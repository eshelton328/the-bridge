// A herdr socket for tests: a Unix socket that answers each method with a
// recorded result (from herdr protocol 22) and counts its connections. An
// events.subscribe request gets herdr's start reply and stays open, as
// herdr's does: push() sends an event line to each open subscription.
// answerWith() makes it fail in one of the ways a socket can, for the
// tests of each failure.
import { mkdtempSync } from 'node:fs'
import { createServer, type Socket } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { maxLineChars } from './herdrSocket.ts'

/**
 * How the socket answers: `normal`; `silent` (never); `closeEarly` (closes with no answer); `garbage` (a
 * line that is not JSON); `chunked` (the normal answer in one write per byte group); `wrongId` (the answer
 * to another request); `badShape` (JSON that is no reply); `noNewline` (a line longer than the reader takes).
 */
export type FakeSocketMode =
  | 'normal'
  | 'silent'
  | 'closeEarly'
  | 'garbage'
  | 'chunked'
  | 'wrongId'
  | 'badShape'
  | 'noNewline'

export type FakeHerdrSocket = {
  readonly path: string
  /** Sets how the socket answers each later request, events.subscribe too. */
  readonly answerWith: (mode: FakeSocketMode) => void
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
  let mode: FakeSocketMode = 'normal'
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
      switch (mode) {
        case 'silent':
          return
        case 'closeEarly':
          conn.destroy()
          return
        case 'garbage':
          conn.write('herdr says hello\n')
          return
        case 'wrongId':
          conn.write(`${JSON.stringify({ id: 'another:1', result: {} })}\n`)
          return
        case 'badShape':
          conn.write(`${JSON.stringify({ hello: 'herdr' })}\n`)
          return
        case 'noNewline':
          conn.write('x'.repeat(maxLineChars + 1))
          return
        case 'normal':
        case 'chunked':
          break
      }
      const send = (line: string, last: boolean) => {
        if (mode === 'chunked') {
          for (let at = 0; at < line.length; at += 7) conn.write(line.slice(at, at + 7))
          if (last) conn.end()
        } else if (last) conn.end(line)
        else conn.write(line)
      }
      if (method === 'events.subscribe') {
        streams.set(conn, field(field(request, 'params'), 'subscriptions'))
        send(`${JSON.stringify({ id, result: { type: 'subscription_started' } })}\n`, false)
        return
      }
      const reply =
        typeof method === 'string' && Object.hasOwn(results, method)
          ? { id, result: results[method] }
          : { id, error: { code: 'unknown_method', message: `no result for ${String(method)}` } }
      send(`${JSON.stringify(reply)}\n`, true)
    })
  })
  await new Promise<void>((resolve) => server.listen(path, resolve))
  return {
    path,
    answerWith: (next) => {
      mode = next
    },
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
