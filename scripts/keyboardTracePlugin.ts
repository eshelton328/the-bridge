// The dev server end of `?keyboard-trace` (web/src/app/keyboardTrace.ts).
// The app POSTs its whole trace here every 2 s and this writes it to one
// file per trace session in the brain's phone-review traces folder, so a
// trace from Erik's phone reaches disk with no step from him. It is a Vite
// plugin with `apply: 'serve'`, so a build never has the endpoint.
import { randomUUID } from 'node:crypto'
import { existsSync, statSync } from 'node:fs'
import { mkdir, rename, writeFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { dirname, join, resolve } from 'node:path'

/** The endpoint the app POSTs its trace to. */
export const KEYBOARD_TRACE_PATH = '/__keyboard-trace'
/** The largest body the endpoint takes, in bytes. */
export const KEYBOARD_TRACE_MAX_BYTES = 10 * 1024 * 1024
/** How far a trace's `startedAt` may be from the server's clock: older or later is refused. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000
const MAX_AHEAD_MS = 5 * 60 * 1000

const repoRoot = resolve(import.meta.dirname, '..')

/**
 * The traces folder: `KEYBOARD_TRACE_DIR` when set, else
 * `engine/_local/phone-review/traces` in the first folder above `start`
 * that has an `engine/` folder (the ncc-1701 root). Undefined when none has.
 */
export function findTraceDir(env: NodeJS.ProcessEnv = process.env, start: string = repoRoot): string | undefined {
  const fromEnv = env.KEYBOARD_TRACE_DIR
  if (fromEnv !== undefined && fromEnv !== '') return resolve(fromEnv)
  for (let dir = resolve(start); ; dir = dirname(dir)) {
    const engine = join(dir, 'engine')
    if (existsSync(engine) && statSync(engine).isDirectory()) return join(engine, '_local', 'phone-review', 'traces')
    if (dirname(dir) === dir) return undefined
  }
}

/**
 * The file name of a trace, made by the server from the trace's start time:
 * only digits, `T`, `Z` and `-`, so no client text reaches the path.
 * Undefined when `startedAt` is no time, or more than a day old or ahead.
 */
export function traceFileName(startedAt: unknown, now: number = Date.now()): string | undefined {
  if (typeof startedAt !== 'string') return undefined
  const ms = Date.parse(startedAt)
  if (!Number.isFinite(ms) || ms < now - MAX_AGE_MS || ms > now + MAX_AHEAD_MS) return undefined
  return `${new Date(ms).toISOString().replace(/[:.]/g, '-')}.json`
}

type Next = (error?: unknown) => void
/** A connect middleware, as Vite's `server.middlewares.use()` takes. */
export type TraceHandler = (req: IncomingMessage, res: ServerResponse, next: Next) => void

function send(res: ServerResponse, status: number, message: string): void {
  res.statusCode = status
  res.setHeader('content-type', 'text/plain; charset=utf-8')
  res.end(message)
}

/** Reads the body up to `max` bytes; undefined when it is larger. */
function readBody(req: IncomingMessage, max: number): Promise<string | undefined> {
  return new Promise((done, fail) => {
    const chunks: Buffer[] = []
    let size = 0
    let over = false
    req.on('data', (chunk: Buffer) => {
      if (over) return
      size += chunk.length
      if (size > max) {
        over = true
        chunks.length = 0
        done(undefined)
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (!over) done(Buffer.concat(chunks).toString('utf8'))
    })
    req.on('error', fail)
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** The endpoint: takes a POSTed JSON trace and replaces its session's file in the traces folder. */
export function createTraceHandler({
  traceDir = () => findTraceDir(),
  maxBytes = KEYBOARD_TRACE_MAX_BYTES,
  now = Date.now,
}: {
  traceDir?: () => string | undefined
  maxBytes?: number
  now?: () => number
} = {}): TraceHandler {
  const handle = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (req.method !== 'POST') {
      res.setHeader('allow', 'POST')
      send(res, 405, 'keyboard-trace takes only POST')
      return
    }
    const type = req.headers['content-type'] ?? ''
    if (type.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
      send(res, 415, 'keyboard-trace takes only application/json')
      return
    }
    const length = Number(req.headers['content-length'])
    if (Number.isFinite(length) && length > maxBytes) {
      send(res, 413, `keyboard-trace takes at most ${String(maxBytes)} bytes`)
      req.resume()
      return
    }
    const body = await readBody(req, maxBytes)
    if (body === undefined) {
      send(res, 413, `keyboard-trace takes at most ${String(maxBytes)} bytes`)
      return
    }
    let trace: unknown
    try {
      trace = JSON.parse(body)
    } catch {
      send(res, 400, 'keyboard-trace body is not JSON')
      return
    }
    if (!isRecord(trace) || typeof trace.userAgent !== 'string' || !Array.isArray(trace.samples)) {
      send(res, 400, 'keyboard-trace body needs { startedAt, userAgent, samples[] }')
      return
    }
    const name = traceFileName(trace.startedAt, now())
    if (name === undefined) {
      send(res, 400, 'keyboard-trace startedAt must be an ISO time within the last day')
      return
    }
    const dir = traceDir()
    if (dir === undefined) {
      send(res, 500, 'keyboard-trace found no traces folder: set KEYBOARD_TRACE_DIR or run inside the ncc-1701 root')
      return
    }
    await mkdir(dir, { recursive: true })
    // Write beside the file and rename, so the file always holds one whole trace.
    const file = join(dir, name)
    const partial = `${file}.${randomUUID()}.partial`
    await writeFile(partial, body)
    await rename(partial, file)
    res.statusCode = 204
    res.end()
  }
  return (req, res, next) => {
    handle(req, res).catch(next)
  }
}

/** The structural part of Vite's dev server this plugin uses. */
type DevServer = { middlewares: { use: (path: string, handler: TraceHandler) => unknown } }

/** The Vite plugin: the trace endpoint on the dev server only (`apply: 'serve'`). */
export function keyboardTracePlugin(options: Parameters<typeof createTraceHandler>[0] = {}) {
  return {
    name: 'bridge-keyboard-trace',
    apply: 'serve' as const,
    configureServer(server: DevServer) {
      server.middlewares.use(KEYBOARD_TRACE_PATH, createTraceHandler(options))
    },
  }
}
