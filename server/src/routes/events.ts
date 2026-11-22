// /api/events: the live events as server-sent events (SSE). Each event's SSE
// name is its type and its SSE id its sequence number; its data is the
// whole envelope, checked against the contract. A comment line every 15 s
// (`ssePingMs`) keeps proxies from closing a quiet stream and tells the
// page that the server is there. When the agents stop
// answering, the stream sends one `error` event with an ErrorBody and
// ends, and the browser connects again after `retry` ms. A throw inside
// the stream does the same with `internal`; the route catches it itself,
// as Hono's own handler would send the raw message (d-115).
import { ErrorBody, LiveEvent } from '@bridge/contract'
import { Hono } from 'hono'
import { type SSEStreamingApi, streamSSE } from 'hono/streaming'
import { type AppEnv, agentErrorBody, internalMessage } from '../errors.ts'
import type { Logger } from '../logger.ts'
import type { LiveEvents } from '../services/liveEvents.ts'
import { ssePingMs } from './sse.ts'

const retryMs = 5_000

const sendError = (stream: SSEStreamingApi, body: ErrorBody) =>
  stream.writeSSE({ event: 'error', data: JSON.stringify(ErrorBody.parse(body)) })

export function eventsRoutes(live: LiveEvents, log: Logger) {
  return new Hono<AppEnv>().get('/', (c) => {
    const requestId = c.get('requestId')
    return streamSSE(c, async (stream) => {
      let disconnect: (() => void) | undefined
      let finish: () => void = () => undefined
      const closed = new Promise<void>((resolve) => {
        finish = resolve
      })
      const done = () => {
        clearInterval(ping)
        disconnect?.()
        disconnect = undefined
        finish()
      }
      const ping = setInterval(() => {
        void stream.write(': ping\n\n')
      }, ssePingMs)
      // The cleanup is in place before the first write, so a client that goes during it leaves nothing open.
      stream.onAbort(done)
      // A throw is caught here, not by streamSSE's onError: Hono writes the raw message after onError returns.
      try {
        await stream.writeSSE({ event: 'open', data: '{}', retry: retryMs })
        if (stream.aborted || stream.closed) {
          done()
          return
        }
        disconnect = live.connect({
          send: (event) => {
            const checked = LiveEvent.parse(event)
            void stream.writeSSE({ event: checked.type, id: String(checked.seq), data: JSON.stringify(checked) })
          },
          end: (error) => {
            log.warn('event stream ended', { requestId, reason: error.reason, detail: error.message })
            void sendError(stream, agentErrorBody(error, requestId)).finally(done)
          },
        })
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
