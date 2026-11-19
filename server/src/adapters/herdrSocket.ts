// The herdr socket API. herdrRequest sends one request: a JSON line out, a
// JSON line back ({"id", "result"} or {"id", "error"}), on a new connection
// each time, so the server holds no connection while no client asks
// (d-112). herdrSubscribe holds one connection open for events.subscribe
// until it is closed: herdr answers {"result": {"type":
// "subscription_started"}}, then sends one JSON line for each event.
import { createConnection } from 'node:net'
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'

const Reply = z.union([
  z.object({ id: z.string(), result: z.unknown() }),
  z.object({ id: z.string(), error: z.object({ code: z.string(), message: z.string() }) }),
])

let next = 0

/** Sends `method` with `params` to the socket and resolves its result, or why there is none. */
export function herdrRequest(
  socket: string,
  method: string,
  params: Readonly<Record<string, unknown>>,
  timeoutMs = 5000,
): Promise<Result<unknown, string>> {
  next += 1
  const id = `bridge:${String(next)}`
  return new Promise((resolve) => {
    let buffer = ''
    let settled = false
    const conn = createConnection(socket)
    const finish = (value: Result<unknown, string>) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      conn.destroy()
      resolve(value)
    }
    const timer = setTimeout(() => {
      finish(err(`herdr did not answer ${method} in ${String(timeoutMs)} ms`))
    }, timeoutMs)
    conn.setEncoding('utf8')
    conn.on('connect', () => conn.write(`${JSON.stringify({ id, method, params })}\n`))
    conn.on('error', (e) => {
      finish(err(`herdr socket ${socket}: ${e.message}`))
    })
    conn.on('close', () => {
      finish(err(`herdr closed the socket before it answered ${method}`))
    })
    conn.on('data', (chunk: string) => {
      buffer += chunk
      const end = buffer.indexOf('\n')
      if (end === -1) return
      let line: unknown
      try {
        line = JSON.parse(buffer.slice(0, end))
      } catch {
        finish(err(`herdr sent a line that is not JSON for ${method}`))
        return
      }
      const reply = Reply.safeParse(line)
      if (!reply.success) finish(err(`herdr sent an unknown reply for ${method}`))
      else if ('error' in reply.data)
        finish(err(`herdr ${method}: ${reply.data.error.code}: ${reply.data.error.message}`))
      else finish(ok(reply.data.result))
    })
  })
}

export type HerdrStream = {
  /** Closes the connection; `onEnd` is not called after it. */
  close(): void
}

export type HerdrStreamHandlers = {
  /** herdr started the subscription. */
  readonly onStart: () => void
  /** One event line, after the start. */
  readonly onEvent: (event: unknown) => void
  /** Why the stream stopped, once, unless `close()` came first. */
  readonly onEnd: (message: string) => void
}

/** Opens an `events.subscribe` stream with `subscriptions`. */
export function herdrSubscribe(
  socket: string,
  subscriptions: readonly Readonly<Record<string, unknown>>[],
  { onStart, onEvent, onEnd }: HerdrStreamHandlers,
  timeoutMs = 5000,
): HerdrStream {
  next += 1
  const id = `bridge:${String(next)}`
  let buffer = ''
  let started = false
  let over = false
  const conn = createConnection(socket)
  const end = (message: string) => {
    if (over) return
    over = true
    clearTimeout(timer)
    conn.destroy()
    onEnd(message)
  }
  const timer = setTimeout(() => {
    end(`herdr did not start events.subscribe in ${String(timeoutMs)} ms`)
  }, timeoutMs)
  conn.setEncoding('utf8')
  conn.on('connect', () =>
    conn.write(`${JSON.stringify({ id, method: 'events.subscribe', params: { subscriptions } })}\n`),
  )
  conn.on('error', (e) => {
    end(`herdr socket ${socket}: ${e.message}`)
  })
  conn.on('close', () => {
    end('herdr closed the events.subscribe stream')
  })
  conn.on('data', (chunk: string) => {
    buffer += chunk
    for (let at = buffer.indexOf('\n'); at !== -1 && !over; at = buffer.indexOf('\n')) {
      const text = buffer.slice(0, at)
      buffer = buffer.slice(at + 1)
      let line: unknown
      try {
        line = JSON.parse(text)
      } catch {
        end('herdr sent a line that is not JSON on events.subscribe')
        return
      }
      if (started) {
        onEvent(line)
        continue
      }
      const reply = Reply.safeParse(line)
      if (!reply.success) end('herdr sent an unknown reply for events.subscribe')
      else if ('error' in reply.data)
        end(`herdr events.subscribe: ${reply.data.error.code}: ${reply.data.error.message}`)
      else {
        started = true
        clearTimeout(timer)
        onStart()
      }
    }
  })
  return {
    close: () => {
      over = true
      clearTimeout(timer)
      conn.destroy()
    },
  }
}
