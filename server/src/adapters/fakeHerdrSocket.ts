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
  /** Each request that the socket got, in order: its method and its params. */
  readonly requests: () => { readonly method: unknown; readonly params: unknown }[]
  /** Answers each later request for `method` with `result`, until a call with `undefined` gives the recorded result again. */
  readonly set: (method: string, result: unknown) => void
  /** Answers the next request for `method` with herdr's error reply of `code` and `message`, once. */
  readonly failOnce: (method: string, code: string, message: string) => void
  /** Answers the next request for `method` with `result`, once, then the recorded result again. */
  readonly once: (method: string, result: unknown) => void
  /** Answers the next request for `method` `ms` later, once, as a slow herdr would. */
  readonly delayOnce: (method: string, ms: number) => void
  /** Sends one event line to each open stream. */
  readonly push: (event: unknown) => void
  /** Calls `react` with each later request before the socket answers it, as a pane would act on its input. */
  readonly onRequest: (react: ((method: unknown, params: unknown) => void) | undefined) => void
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
  const next = new Map<string, unknown>()
  const lasting = new Map<string, unknown>()
  const failures = new Map<string, { readonly code: string; readonly message: string }>()
  const requests: { readonly method: unknown; readonly params: unknown }[] = []
  const delays = new Map<string, number>()
  let reactTo: ((method: unknown, params: unknown) => void) | undefined
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
      const line = buffer.slice(0, end)
      buffer = buffer.slice(end + 1)
      let request: unknown
      try {
        request = JSON.parse(line)
      } catch (error) {
        // A test that sends a bad line sees herdr's kind of answer, not a crash of the socket.
        if (!(error instanceof SyntaxError)) throw error
        conn.end(`${JSON.stringify({ id: '', error: { code: 'invalid_request', message: error.message } })}\n`)
        return
      }
      const id = field(request, 'id') ?? ''
      const method = field(request, 'method')
      const wait = typeof method === 'string' ? delays.get(method) : undefined
      if (typeof method === 'string' && wait !== undefined) {
        // Reads the same line again later, as if it came then.
        delays.delete(method)
        setTimeout(() => {
          buffer = `${line}\n${buffer}`
          conn.emit('data', '')
        }, wait)
        return
      }
      requests.push({ method, params: field(request, 'params') })
      reactTo?.(method, field(request, 'params'))
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
      // herdr refuses a subscription that names a pane it does not have (a pane that closed after the list read).
      const refused = method === 'events.subscribe' ? failures.get(method) : undefined
      if (refused !== undefined) {
        failures.delete('events.subscribe')
        send(`${JSON.stringify({ id, error: refused })}\n`, true)
        return
      }
      if (method === 'events.subscribe') {
        streams.set(conn, field(field(request, 'params'), 'subscriptions'))
        send(`${JSON.stringify({ id, result: { type: 'subscription_started' } })}\n`, false)
        return
      }
      const failure = typeof method === 'string' ? failures.get(method) : undefined
      if (typeof method === 'string' && failure !== undefined) {
        failures.delete(method)
        send(`${JSON.stringify({ id, error: failure })}\n`, true)
        return
      }
      const onlyOnce = typeof method === 'string' && next.has(method)
      const reply = onlyOnce
        ? { id, result: next.get(method) }
        : typeof method === 'string' && lasting.has(method)
          ? { id, result: lasting.get(method) }
          : typeof method === 'string' && Object.hasOwn(results, method)
            ? { id, result: results[method] }
            : { id, error: { code: 'unknown_method', message: `no result for ${String(method)}` } }
      if (onlyOnce) next.delete(method)
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
    once: (method, result) => {
      next.set(method, result)
    },
    requests: () => [...requests],
    failOnce: (method, code, message) => {
      failures.set(method, { code, message })
    },
    set: (method, result) => {
      if (result === undefined) lasting.delete(method)
      else lasting.set(method, result)
    },
    streams: () => [...streams.values()],
    delayOnce: (method, ms) => {
      delays.set(method, ms)
    },
    onRequest: (react) => {
      reactTo = react
    },
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

const esc = String.fromCharCode(27)
const rule = `${esc}[0m${esc}[38;2;136;136;136m${'─'.repeat(60)}${esc}[0m`

/**
 * A Claude Code screen whose input box holds `text` (one line for each line of it), as herdr's pane.read gives
 * it with format "ansi"; an empty box shows the dim placeholder.
 */
/** A Claude Code screen with its "Switch model?" dialog open, as `/model sonnet` shows it on a chat with history. */
export function switchModelScreen(): string {
  return [
    '  line 59: example text',
    '▔'.repeat(40),
    '  Switch model?',
    '  Your next response will be slower and use more tokens',
    '',
    '  ❯ 1. Yes, switch to Sonnet 5.5',
    '    2. No, go back',
    '',
    '  Enter to confirm · Esc to cancel',
  ].join('\r\n')
}

export function claudeScreen(text: string): string {
  const box =
    text === ''
      ? [`❯ ${esc}[0m${esc}[2mTry "fix lint errors"${esc}[0m`]
      : text.split('\n').map((line, at) => `${at === 0 ? '❯ ' : '  '}${line}`)
  return ['Claude Code v2.1', '', rule, ...box, rule, '  ⏵⏵ auto mode on'].join('\r\n')
}

/** herdr's pane.read reply for a pane that shows `screen`. */
export const paneRead = (pane: string, screen: string) => ({
  type: 'pane_read',
  read: { pane_id: pane, source: 'visible', format: 'ansi', text: screen, revision: 0, truncated: false },
})
