// /api/events: the live events as server-sent events (SSE). Each event's SSE
// name is its type and its SSE id its sequence number; its data is the
// whole envelope, checked against the contract. A comment line every 25 s
// keeps proxies from closing a quiet stream. When the agents stop
// answering the stream ends, and the browser connects again after
// `retry` ms.
import { LiveEvent } from '@bridge/contract'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { LiveEvents } from '../services/liveEvents.ts'

const pingMs = 25_000
const retryMs = 5_000

export function eventsRoutes(live: LiveEvents) {
  return new Hono().get('/', (c) =>
    streamSSE(c, async (stream) => {
      let disconnect: (() => void) | undefined
      let ping: ReturnType<typeof setInterval> | undefined
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
      // The cleanup is in place before the first write, so a client that goes during it leaves nothing open.
      stream.onAbort(done)
      await stream.writeSSE({ event: 'open', data: '{}', retry: retryMs })
      if (stream.aborted || stream.closed) {
        done()
        return
      }
      ping = setInterval(() => {
        void stream.write(': ping\n\n')
      }, pingMs)
      disconnect = live.connect({
        send: (event) => {
          const checked = LiveEvent.parse(event)
          void stream.writeSSE({ event: checked.type, id: String(checked.seq), data: JSON.stringify(checked) })
        },
        end: done,
      })
      await closed
    }),
  )
}
