// A herdr socket for tests: a Unix socket that answers each method with a
// recorded result (from herdr protocol 22) and counts its connections.
import { mkdtempSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export type FakeHerdrSocket = {
  readonly path: string
  readonly connections: () => number
  readonly close: () => Promise<void>
}

/** Starts the socket; a method with no result gets herdr's error reply. */
export async function startFakeHerdrSocket(results: Readonly<Record<string, unknown>>): Promise<FakeHerdrSocket> {
  const path = join(mkdtempSync(join(tmpdir(), 'herdr-')), 's.sock')
  let connections = 0
  const server = createServer((conn) => {
    connections += 1
    conn.setEncoding('utf8')
    let buffer = ''
    conn.on('data', (chunk: string) => {
      buffer += chunk
      const end = buffer.indexOf('\n')
      if (end === -1) return
      const request: unknown = JSON.parse(buffer.slice(0, end))
      const id = typeof request === 'object' && request !== null && 'id' in request ? request.id : ''
      const method = typeof request === 'object' && request !== null && 'method' in request ? request.method : ''
      const reply =
        typeof method === 'string' && Object.hasOwn(results, method)
          ? { id, result: results[method] }
          : { id, error: { code: 'unknown_method', message: `no result for ${String(method)}` } }
      conn.end(`${JSON.stringify(reply)}\n`)
    })
  })
  await new Promise<void>((resolve) => server.listen(path, resolve))
  return {
    path,
    connections: () => connections,
    close: () =>
      new Promise((resolve) => {
        server.close(() => {
          resolve()
        })
      }),
  }
}
