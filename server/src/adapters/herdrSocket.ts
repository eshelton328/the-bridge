// One request to the herdr socket API: a JSON line out, a JSON line back
// ({"id", "result"} or {"id", "error"}), on a new connection each time, so
// the server holds no connection while no client asks (d-112).
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
