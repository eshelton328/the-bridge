// /api/chats: the chats sub-app. GET /:chat/transcript returns the last
// entries of one chat's transcript, with its ID URL-encoded, checked
// against the contract. GET /:chat/transcript/events streams each change
// after it opens as server-sent events, as /api/events does. Both read
// only that chat's session. Transcript text goes only into a 200 body or
// an event, never into a log line or an ErrorBody (d-115).
// POST /:chat/prompt sends the owner's prompt to that chat, and POST
// /:chat/stop stops its work (slice W1); each answers 204. Both take only
// JSON, so a cross-site form cannot post. The prompt text goes to the
// port only, never into a log line or an ErrorBody.
import {
  ChatId,
  ErrorBody,
  maxPromptChars,
  SendPromptRequest,
  StopChatRequest,
  TranscriptChangedEvent,
  TranscriptResponse,
} from '@bridge/contract'
import type { Context, Next } from 'hono'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { validator } from 'hono/validator'
import type { z } from 'zod'
import { type SSEStreamingApi, streamSSE } from 'hono/streaming'
import { type AppEnv, agentErrorBody, agentErrorJson, errorJson, internalMessage } from '../errors.ts'
import type { Logger } from '../logger.ts'
import type { AgentPort, AgentPortError, CancelOutcome, SendOutcome } from '../services/agentPort.ts'
import { readTranscript, sendPrompt, stopChat } from '../services/chats.ts'
import { connectTranscript } from '../services/transcriptEvents.ts'

const pingMs = 25_000
const retryMs = 5_000

/**
 * A prompt body's limit: the longest prompt and its JSON. JSON can write each character as a 6-byte \\u escape,
 * which is more than its UTF-8 bytes (at most 4).
 */
const maxPromptBytes = maxPromptChars * 6 + 1024

const sendError = (stream: SSEStreamingApi, body: ErrorBody) =>
  stream.writeSSE({ event: 'error', data: JSON.stringify(ErrorBody.parse(body)) })

export function chatsRoutes(agents: AgentPort, log: Logger) {
  const chatOf = (c: Context<AppEnv>) => ChatId.safeParse(c.req.param('chat'))
  const invalid = (c: Context<AppEnv>) =>
    errorJson(c, 'invalid-input', {
      message: 'the chat ID is not valid',
      issues: ['a chat ID is <machine>/<chat>, URL-encoded'],
    })
  const failed = (c: Context<AppEnv>, error: AgentPortError) => {
    log.warn('herdr call failed', { requestId: c.get('requestId'), reason: error.reason, detail: error.message })
    return agentErrorJson(c, error)
  }
  const notFound = (c: Context<AppEnv>) =>
    errorJson(c, 'not-found', { path: c.req.path, message: 'no chat has this ID' })
  const jsonOnly = async (c: Context<AppEnv>, next: Next) => {
    if (!/^application\/json(;|$)/i.test(c.req.header('Content-Type') ?? ''))
      return errorJson(c, 'invalid-input', {
        message: 'the request must be JSON',
        issues: ['Content-Type must be application/json'],
      })
    // Parsed here, so malformed JSON is a 400; hono's validator would throw it to onError as a 500. The
    // validator below reads the parsed body from hono's cache.
    const read = await c.req.json().then(
      () => true,
      () => false,
    )
    if (!read)
      return errorJson(c, 'invalid-input', { message: 'the request must be JSON', issues: ['body: invalid_json'] })
    await next()
    return undefined
  }
  /** Checks the body with `schema`; an issue names the field and the rule only, never the text. */
  const body = <S extends z.ZodType>(schema: S) =>
    validator('json', (value, c: Context<AppEnv>) => {
      const parsed = schema.safeParse(value)
      if (parsed.success) return parsed.data
      return errorJson(c, 'invalid-input', {
        message: 'the request does not match the contract',
        issues: parsed.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.code}`),
      })
    })
  /** The answer to a send or a stop: 204 when sent; the chat's state when it cannot take it. */
  const answer = (c: Context<AppEnv>, outcome: SendOutcome | CancelOutcome) => {
    switch (outcome) {
      case 'sent':
        return c.body(null, 204)
      case 'notFound':
        return notFound(c)
      case 'shell':
        return errorJson(c, 'chat-not-ready', { state: 'shell', message: 'a shell chat takes no prompt' })
      case 'needsYou':
        return errorJson(c, 'chat-not-ready', { state: 'needsYou', message: 'the chat waits for your answer' })
      case 'inputNotEmpty':
        return errorJson(c, 'chat-not-ready', {
          state: 'inputNotEmpty',
          message: "the chat's input box holds text, so the prompt was not sent",
        })
      case 'notWorking':
        return errorJson(c, 'chat-not-ready', { state: 'notWorking', message: 'the chat has no work to stop' })
    }
  }

  return new Hono<AppEnv>()
    .post(
      '/:chat/prompt',
      bodyLimit({
        maxSize: maxPromptBytes,
        onError: (c: Context<AppEnv>) =>
          errorJson(c, 'invalid-input', { message: 'the prompt is too long', issues: ['the body is too large'] }),
      }),
      jsonOnly,
      body(SendPromptRequest),
      async (c) => {
        const id = chatOf(c)
        if (!id.success) return invalid(c)
        const sent = await sendPrompt(agents, id.data, c.req.valid('json').text)
        return sent.ok ? answer(c, sent.value) : failed(c, sent.error)
      },
    )
    .post('/:chat/stop', jsonOnly, body(StopChatRequest), async (c) => {
      const id = chatOf(c)
      if (!id.success) return invalid(c)
      const stopped = await stopChat(agents, id.data)
      return stopped.ok ? answer(c, stopped.value) : failed(c, stopped.error)
    })
    .get('/:chat/transcript', async (c) => {
      const id = chatOf(c)
      if (!id.success) return invalid(c)
      const read = await readTranscript(agents, id.data)
      if (!read.ok) return failed(c, read.error)
      if (read.value === null) return notFound(c)
      return c.json(TranscriptResponse.parse(read.value), 200)
    })
    .get('/:chat/transcript/events', async (c) => {
      const id = chatOf(c)
      if (!id.success) return invalid(c)
      const requestId = c.get('requestId')
      // Events wait here until the stream is open.
      let deliver: ((event: TranscriptChangedEvent) => void) | undefined
      let endStream: ((error: AgentPortError) => void) | undefined
      const waiting: TranscriptChangedEvent[] = []
      let ended: AgentPortError | undefined
      const connected = await connectTranscript(agents, id.data, {
        send: (event) => {
          if (deliver) deliver(event)
          else waiting.push(event)
        },
        end: (error) => {
          if (endStream) endStream(error)
          else ended = error
        },
      })
      if (!connected.ok) return failed(c, connected.error)
      const stop = connected.value
      if (stop === null) return notFound(c)
      return streamSSE(c, async (stream) => {
        let finish: () => void = () => undefined
        const closed = new Promise<void>((resolve) => {
          finish = resolve
        })
        const done = () => {
          clearInterval(ping)
          stop()
          finish()
        }
        const ping = setInterval(() => {
          void stream.write(': ping\n\n')
        }, pingMs)
        stream.onAbort(done)
        const write = (event: TranscriptChangedEvent) => {
          const checked = TranscriptChangedEvent.parse(event)
          void stream.writeSSE({ event: checked.type, id: String(checked.seq), data: JSON.stringify(checked) })
        }
        const fail = (error: AgentPortError) => {
          log.warn('event stream ended', { requestId, reason: error.reason, detail: error.message })
          void sendError(stream, agentErrorBody(error, requestId)).finally(done)
        }
        try {
          await stream.writeSSE({ event: 'open', data: '{}', retry: retryMs })
          if (stream.aborted || stream.closed) {
            done()
            return
          }
          for (const event of waiting.splice(0)) write(event)
          deliver = write
          endStream = fail
          if (ended) fail(ended)
        } catch (err) {
          log.error('event stream error', { requestId, err })
          await sendError(stream, { error: { kind: 'internal', message: internalMessage, requestId } })
          done()
          return
        }
        await closed
      })
    })
}
