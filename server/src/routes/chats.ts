// /api/chats: the chats sub-app. GET /:chat/transcript returns the last
// entries of one chat's transcript, with its ID URL-encoded, checked
// against the contract. GET /:chat/transcript/events streams each change
// after it opens as server-sent events, as /api/events does. Both read
// only that chat's session. Transcript text goes only into a 200 body or
// an event, never into a log line or an ErrorBody (d-115).
// POST /:chat/prompt sends the owner's prompt to that chat, with the path
// of each attached file below it, and POST
// /:chat/stop stops its work (slice W1); each answers 204. Both take only
// JSON, so a cross-site form cannot post. The prompt text goes to the
// port only, never into a log line or an ErrorBody. POST /:chat/input/clear
// empties the chat's input box (204); the text it removes goes nowhere.
// POST /:chat/uploads starts the upload of a file for that chat (slice
// W1b, routes/uploads.ts). POST /:chat/command types /compact or /clear
// into an idle Claude chat (slice W5, 204); the compact instructions go to
// the port only, as a prompt's text.
import {
  ChatCommandRequest,
  ChatId,
  ClearInputRequest,
  ErrorBody,
  maxCompactChars,
  maxPromptChars,
  SendPromptRequest,
  StartUploadRequest,
  StartUploadResponse,
  StopChatRequest,
  TranscriptChangedEvent,
  TranscriptResponse,
} from '@bridge/contract'
import type { Context } from 'hono'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { type SSEStreamingApi, streamSSE } from 'hono/streaming'
import { type AppEnv, agentErrorBody, agentErrorJson, errorJson, internalMessage } from '../errors.ts'
import type { Logger } from '../logger.ts'
import type { AgentPort, AgentPortError, CancelOutcome, ClearOutcome, CommandOutcome } from '../services/agentPort.ts'
import { clearInput, readTranscript, sendCommand, stopChat } from '../services/chats.ts'
import type { UploadStore } from '../services/uploadStore.ts'
import { type FilePromptOutcome, sendPromptWithFiles, startUpload } from '../services/uploads.ts'
import { jsonBody, jsonOnly, smallJson } from './jsonBody.ts'
import { storeFailed } from './uploads.ts'
import { connectTranscript } from '../services/transcriptEvents.ts'

const pingMs = 25_000
const retryMs = 5_000

/**
 * A prompt body's limit: the longest prompt and its JSON. JSON can write each character as a 6-byte \\u escape,
 * which is more than its UTF-8 bytes (at most 4).
 */
const maxPromptBytes = maxPromptChars * 6 + 1024
/** The largest command body: the longest instructions with each character as a JSON escape, and room for the rest. */
const maxCommandBytes = maxCompactChars * 6 + 1024

const sendError = (stream: SSEStreamingApi, body: ErrorBody) =>
  stream.writeSSE({ event: 'error', data: JSON.stringify(ErrorBody.parse(body)) })

export function chatsRoutes(agents: AgentPort, log: Logger, uploads: UploadStore) {
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
  /** The answer to a send or a stop: 204 when sent; the chat's state when it cannot take it. */
  const answer = (c: Context<AppEnv>, outcome: FilePromptOutcome | CancelOutcome | ClearOutcome | CommandOutcome) => {
    switch (outcome) {
      case 'sent':
      case 'cleared':
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
      case 'noAttachments':
        return errorJson(c, 'chat-not-ready', { state: 'noAttachments', message: 'this chat takes no file yet' })
      case 'badAttachment':
        return errorJson(c, 'upload-conflict', {
          message: 'a file is not a complete upload of this chat, so the prompt was not sent',
        })
      case 'notWorking':
        return errorJson(c, 'chat-not-ready', { state: 'notWorking', message: 'the chat has no work to stop' })
      case 'noCommands':
        return errorJson(c, 'chat-not-ready', {
          state: 'noCommands',
          message: 'the server sends no command or input clear to a Codex chat yet',
        })
      case 'working':
        return errorJson(c, 'chat-not-ready', {
          state: 'working',
          message: 'the chat works now; send the command when it is idle',
        })
      case 'notSubmitted':
        return errorJson(c, 'chat-not-ready', {
          state: 'notSubmitted',
          message: 'the chat did not take the prompt, so the server removed it; send it again',
        })
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
      jsonBody(SendPromptRequest),
      async (c) => {
        const id = chatOf(c)
        if (!id.success) return invalid(c)
        const sent = await sendPromptWithFiles(agents, uploads, id.data, c.req.valid('json'))
        if (!sent.ok)
          return sent.error.from === 'agents' ? failed(c, sent.error.error) : storeFailed(c, log, sent.error.error)
        return answer(c, sent.value)
      },
    )
    .post('/:chat/uploads', smallJson, jsonOnly, jsonBody(StartUploadRequest), async (c) => {
      const id = chatOf(c)
      if (!id.success) return invalid(c)
      const started = await startUpload(agents, uploads, id.data, c.req.valid('json'))
      if (!started.ok)
        return started.error.from === 'agents'
          ? failed(c, started.error.error)
          : storeFailed(c, log, started.error.error)
      switch (started.value) {
        case 'notFound':
          return notFound(c)
        case 'shell':
          return errorJson(c, 'chat-not-ready', { state: 'shell', message: 'a shell chat takes no file' })
        case 'noAttachments':
          return errorJson(c, 'chat-not-ready', { state: 'noAttachments', message: 'this chat takes no file yet' })
        case 'tooLarge':
          return errorJson(c, 'too-large', { message: 'the file is larger than 1 GiB' })
        default:
          return c.json(StartUploadResponse.parse(started.value), 201)
      }
    })
    .post('/:chat/stop', smallJson, jsonOnly, jsonBody(StopChatRequest), async (c) => {
      const id = chatOf(c)
      if (!id.success) return invalid(c)
      const stopped = await stopChat(agents, id.data)
      return stopped.ok ? answer(c, stopped.value) : failed(c, stopped.error)
    })
    .post(
      '/:chat/command',
      bodyLimit({
        maxSize: maxCommandBytes,
        onError: (c: Context<AppEnv>) =>
          errorJson(c, 'invalid-input', { message: 'the command is too long', issues: ['the body is too large'] }),
      }),
      jsonOnly,
      jsonBody(ChatCommandRequest),
      async (c) => {
        const id = chatOf(c)
        if (!id.success) return invalid(c)
        const sent = await sendCommand(agents, id.data, c.req.valid('json'))
        return sent.ok ? answer(c, sent.value) : failed(c, sent.error)
      },
    )
    .post('/:chat/input/clear', smallJson, jsonOnly, jsonBody(ClearInputRequest), async (c) => {
      const id = chatOf(c)
      if (!id.success) return invalid(c)
      const cleared = await clearInput(agents, id.data)
      return cleared.ok ? answer(c, cleared.value) : failed(c, cleared.error)
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
      let goneStream: (() => void) | undefined
      const waiting: TranscriptChangedEvent[] = []
      let ended: AgentPortError | undefined
      let left = false
      const connected = await connectTranscript(agents, id.data, {
        send: (event) => {
          if (deliver) deliver(event)
          else waiting.push(event)
        },
        end: (error) => {
          if (endStream) endStream(error)
          else ended = error
        },
        gone: () => {
          if (goneStream) goneStream()
          else left = true
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
        // The chat has left the list (after /clear its pane has a new chat ID): one not-found error, then the end.
        const leave = () => {
          log.info('event stream ended', { requestId, reason: 'notFound' })
          void sendError(stream, {
            error: { kind: 'not-found', message: 'no chat has this ID', path: c.req.path, requestId },
          }).finally(done)
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
          goneStream = leave
          if (ended) fail(ended)
          else if (left) leave()
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
