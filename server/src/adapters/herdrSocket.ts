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

/** The longest line, in UTF-16 characters, that the reader takes from herdr; a longer one ends the call. */
export const maxLineChars = 4 * 1024 * 1024

/**
 * Why a call to the herdr socket gave no result. `connect`, `timeout` and `closed` say that herdr did not
 * answer; the others say that it answered with something this adapter does not read.
 */
export type SocketFailure =
  | { readonly kind: 'connect'; readonly code: string | undefined; readonly message: string }
  | { readonly kind: 'timeout'; readonly message: string }
  | { readonly kind: 'closed'; readonly message: string }
  | { readonly kind: 'notJson'; readonly message: string }
  | { readonly kind: 'tooLong'; readonly message: string }
  | { readonly kind: 'badShape'; readonly message: string }
  | { readonly kind: 'herdrError'; readonly code: string; readonly message: string }

const errnoCode = (e: Error): string | undefined => {
  const code: unknown = Object.getOwnPropertyDescriptor(e, 'code')?.value
  return typeof code === 'string' ? code : undefined
}

/** The failure of a socket error event. */
const connectFailure = (socket: string, e: Error): SocketFailure => ({
  kind: 'connect',
  code: errnoCode(e),
  message: `herdr socket ${socket}: ${e.message}`,
})

/** Reads the start or the reply line of request `id`: its result, or why there is none. */
function replyOf(line: unknown, id: string, method: string): Result<unknown, SocketFailure> {
  const reply = Reply.safeParse(line)
  if (!reply.success) return err({ kind: 'badShape', message: `herdr sent an unknown reply for ${method}` })
  if (reply.data.id !== id)
    return err({ kind: 'badShape', message: `herdr answered ${method} with the reply to another request` })
  if ('error' in reply.data)
    return err({
      kind: 'herdrError',
      code: reply.data.error.code,
      message: `herdr ${method}: ${reply.data.error.code}: ${reply.data.error.message}`,
    })
  return ok(reply.data.result)
}

let next = 0

/** Sends `method` with `params` to the socket and resolves its result, or why there is none. */
export function herdrRequest(
  socket: string,
  method: string,
  params: Readonly<Record<string, unknown>>,
  timeoutMs = 5000,
): Promise<Result<unknown, SocketFailure>> {
  next += 1
  const id = `bridge:${String(next)}`
  return new Promise((resolve) => {
    let buffer = ''
    let settled = false
    const conn = createConnection(socket)
    const finish = (value: Result<unknown, SocketFailure>) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      conn.destroy()
      resolve(value)
    }
    const timer = setTimeout(() => {
      finish(err({ kind: 'timeout', message: `herdr did not answer ${method} in ${String(timeoutMs)} ms` }))
    }, timeoutMs)
    conn.setEncoding('utf8')
    conn.on('connect', () => conn.write(`${JSON.stringify({ id, method, params })}\n`))
    conn.on('error', (e) => {
      finish(err(connectFailure(socket, e)))
    })
    conn.on('close', () => {
      finish(err({ kind: 'closed', message: `herdr closed the socket before it answered ${method}` }))
    })
    conn.on('data', (chunk: string) => {
      buffer += chunk
      const end = buffer.indexOf('\n')
      if (end === -1) {
        if (buffer.length > maxLineChars)
          finish(
            err({
              kind: 'tooLong',
              message: `herdr sent a line longer than ${String(maxLineChars)} characters for ${method}`,
            }),
          )
        return
      }
      let line: unknown
      try {
        line = JSON.parse(buffer.slice(0, end))
      } catch {
        finish(err({ kind: 'notJson', message: `herdr sent a line that is not JSON for ${method}` }))
        return
      }
      finish(replyOf(line, id, method))
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
  readonly onEnd: (failure: SocketFailure) => void
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
  const end = (failure: SocketFailure) => {
    if (over) return
    over = true
    clearTimeout(timer)
    conn.destroy()
    onEnd(failure)
  }
  const timer = setTimeout(() => {
    end({ kind: 'timeout', message: `herdr did not start events.subscribe in ${String(timeoutMs)} ms` })
  }, timeoutMs)
  conn.setEncoding('utf8')
  conn.on('connect', () =>
    conn.write(`${JSON.stringify({ id, method: 'events.subscribe', params: { subscriptions } })}\n`),
  )
  conn.on('error', (e) => {
    end(connectFailure(socket, e))
  })
  conn.on('close', () => {
    end({ kind: 'closed', message: 'herdr closed the events.subscribe stream' })
  })
  conn.on('data', (chunk: string) => {
    buffer += chunk
    if (!buffer.includes('\n') && buffer.length > maxLineChars) {
      end({
        kind: 'tooLong',
        message: `herdr sent a line longer than ${String(maxLineChars)} characters on events.subscribe`,
      })
      return
    }
    for (let at = buffer.indexOf('\n'); at !== -1 && !over; at = buffer.indexOf('\n')) {
      const text = buffer.slice(0, at)
      buffer = buffer.slice(at + 1)
      let line: unknown
      try {
        line = JSON.parse(text)
      } catch {
        end({ kind: 'notJson', message: 'herdr sent a line that is not JSON on events.subscribe' })
        return
      }
      if (started) {
        onEvent(line)
        continue
      }
      const reply = replyOf(line, id, 'events.subscribe')
      if (!reply.ok) end(reply.error)
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
