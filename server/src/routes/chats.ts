// /api/chats: the chats sub-app. GET /:chat/transcript returns the last
// entries of one chat's transcript, with its ID URL-encoded, checked
// against the contract. GET /:chat/transcript/events streams each change
// after it opens as server-sent events, as /api/events does. Both read
// only that chat's session. Transcript text goes only into a 200 body or
// an event, never into a log line or an ErrorBody (d-115).
import { ChatId, ErrorBody, TranscriptChangedEvent, TranscriptResponse } from '@bridge/contract'
import type { Context } from 'hono'
import { Hono } from 'hono'
import { type SSEStreamingApi, streamSSE } from 'hono/streaming'
import { type AppEnv, agentErrorBody, agentErrorJson, errorJson, internalMessage } from '../errors.ts'
import type { Logger } from '../logger.ts'
import type { AgentPort, AgentPortError } from '../services/agentPort.ts'
import { readTranscript } from '../services/chats.ts'
import { connectTranscript } from '../services/transcriptEvents.ts'

const pingMs = 25_000
const retryMs = 5_000

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

  return new Hono<AppEnv>()
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
