// One request on the e2e herdr session's socket (herdrSession.ts), as a
// client of herdr's API would send it, for the e2e helpers and tests.
import { createConnection } from 'node:net'
import { inject } from 'vitest'

/** One request on the session's socket; its reply line, parsed. */
export function herdrRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let reply = ''
    const conn = createConnection(inject('herdrSocket'), () =>
      conn.write(`${JSON.stringify({ id: `e2e:${method}`, method, params })}\n`),
    )
    conn.setEncoding('utf8')
    conn.on('error', reject)
    conn.on('data', (chunk: string) => {
      reply += chunk
      if (!reply.includes('\n')) return
      conn.end()
      if (reply.includes('"error"')) reject(new Error(`herdr refused ${method}: ${reply}`))
      else resolve(JSON.parse(reply))
    })
  })
}
