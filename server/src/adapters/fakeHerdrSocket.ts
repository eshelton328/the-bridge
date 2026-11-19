// A herdr socket for tests: a Unix socket that answers each method with a
// recorded result (from herdr protocol 22) and counts its connections. An
// events.subscribe request gets herdr's start reply and stays open, as
// herdr's does: push() sends an event line to each open subscription.
import { mkdtempSync } from 'node:fs'
import { createServer, type Socket } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export type FakeHerdrSocket = {
  readonly path: string
  readonly connections: () => number
  /** The subscriptions of each events.subscribe stream that is open now. */
  readonly streams: () => unknown[]
  /** Sends one event line to each open stream. */
  readonly push: (event: unknown) => void
  /** Closes each open stream from herdr's side. */
  readonly dropStreams: () => void
  readonly close: () => Promise<void>
}

const field = (value: unknown, name: string): unknown =>
  typeof value === 'object' && value !== null && name in value
    ? Object.getOwnPropertyDescriptor(value, name)?.value
    : undefined

/** Starts the socket; a method with no result gets herdr's error reply. */
export async function startFakeHerdrSocket(results: Readonly<Record<string, unknown>>): Promise<FakeHerdrSocket> {
  const path = join(mkdtempSync(join(tmpdir(), 'herdr-')), 's.sock')
  let connections = 0
  const streams = new Map<Socket, unknown>()
  const server = createServer((conn) => {
    connections += 1
    conn.setEncoding('utf8')
    let buffer = ''
    conn.on('close', () => streams.delete(conn))
    conn.on('error', () => streams.delete(conn))
    conn.on('data', (chunk: string) => {
      buffer += chunk
      const end = buffer.indexOf('\n')
      if (end === -1) return
      const request: unknown = JSON.parse(buffer.slice(0, end))
      buffer = buffer.slice(end + 1)
      const id = field(request, 'id') ?? ''
      const method = field(request, 'method')
      if (method === 'events.subscribe') {
        streams.set(conn, field(field(request, 'params'), 'subscriptions'))
        conn.write(`${JSON.stringify({ id, result: { type: 'subscription_started' } })}\n`)
        return
      }
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
    streams: () => [...streams.values()],
    push: (event) => {
      for (const conn of streams.keys()) conn.write(`${JSON.stringify(event)}\n`)
    },
    dropStreams: () => {
      for (const conn of streams.keys()) conn.destroy()
    },
    close: () =>
      new Promise((resolve) => {
        for (const conn of streams.keys()) conn.destroy()
        server.close(() => {
          resolve()
        })
      }),
  }
}
