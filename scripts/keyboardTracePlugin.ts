// The dev server end of `?keyboard-trace` (web/src/app/keyboardTrace.ts).
// The app POSTs its whole trace here every 2 s and this writes it to one
// file per trace session in the brain's phone-review traces folder, so a
// trace from the owner's phone reaches disk with no step from him. It is a Vite
// plugin with `apply: 'serve'`, so a build never has the endpoint.
//
// `GET /__keyboard-trace/enabled` is the switch: the app asks it once on
// load and traces without the URL param when the file `ENABLED` is in the
// traces folder, so bridge-coord can turn tracing on and off in the
// installed Home Screen app, where no one can type a URL.
import { randomUUID } from 'node:crypto'
import { existsSync, statSync } from 'node:fs'
import { mkdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { dirname, join, resolve } from 'node:path'

/** The endpoint the app POSTs its trace to. */
export const KEYBOARD_TRACE_PATH = '/__keyboard-trace'
/** The switch the app asks on load: `{ enabled }`, true when the traces folder has `ENABLED`. */
export const KEYBOARD_TRACE_ENABLED_PATH = '/__keyboard-trace/enabled'
/** The file in the traces folder that turns tracing on without the URL param. */
export const KEYBOARD_TRACE_SWITCH_FILE = 'ENABLED'
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

const DISPLAY_MODES = new Set(['standalone', 'browser'])
const SAFE_AREA_SIDES = ['top', 'right', 'bottom', 'left'] as const
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/**
 * Whether a trace's header is valid: `userAgent` and `samples[]` always, and
 * `displayMode`, `screenHeight`, `screenWidth`, `devicePixelRatio` and
 * `safeArea` checked when present, so a trace from a client older than
 * those fields is still taken.
 */
export function isTraceHeader(trace: unknown): trace is Record<string, unknown> & { samples: unknown[] } {
  if (!isRecord(trace) || typeof trace.userAgent !== 'string' || !Array.isArray(trace.samples)) return false
  if (
    trace.displayMode !== undefined &&
    !(typeof trace.displayMode === 'string' && DISPLAY_MODES.has(trace.displayMode))
  )
    return false
  for (const key of ['screenHeight', 'screenWidth', 'devicePixelRatio'] as const) {
    if (trace[key] !== undefined && !isNumber(trace[key])) return false
  }
  const safeArea = trace.safeArea
  if (safeArea === undefined) return true
  return isRecord(safeArea) && SAFE_AREA_SIDES.every((side) => isNumber(safeArea[side]))
}

/** The `t` of a trace's last sample, or -Infinity when it has none. */
function lastSampleTime(samples: unknown[]): number {
  const last = samples.at(-1)
  return isRecord(last) && typeof last.t === 'number' ? last.t : Number.NEGATIVE_INFINITY
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
  // The time of the last sample written to each file. A page that is hidden
  // sends while a POST is still out, so an older trace can land second.
  const latest = new Map<string, number>()
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
    if (!isTraceHeader(trace)) {
      send(
        res,
        400,
        'keyboard-trace body needs { startedAt, userAgent, samples[] }, and a valid displayMode, screenHeight, screenWidth, devicePixelRatio and safeArea when present',
      )
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
    // Write beside the file and rename, so the file always holds one whole trace,
    // and never replace a trace with one whose last sample is older.
    const file = join(dir, name)
    const last = lastSampleTime(trace.samples)
    if (last < (latest.get(file) ?? Number.NEGATIVE_INFINITY)) {
      send(res, 409, 'keyboard-trace has a newer trace for this session')
      return
    }
    latest.set(file, last)
    const partial = `${file}.${randomUUID()}.partial`
    await writeFile(partial, body)
    if (latest.get(file) === last) await rename(partial, file)
    else await rm(partial, { force: true })
    res.statusCode = 204
    res.end()
  }
  return (req, res, next) => {
    handle(req, res).catch(next)
  }
}

/**
 * The switch: `GET` answers `{ "enabled": true }` when the traces folder has
 * the file `ENABLED`, else `{ "enabled": false }`, never cached. It takes no
 * input and reads only whether that one file exists.
 */
export function createEnabledHandler({
  traceDir = () => findTraceDir(),
}: {
  traceDir?: () => string | undefined
} = {}): TraceHandler {
  const isEnabled = async (): Promise<boolean> => {
    const dir = traceDir()
    if (dir === undefined) return false
    try {
      return (await stat(join(dir, KEYBOARD_TRACE_SWITCH_FILE))).isFile()
    } catch {
      return false
    }
  }
  const handle = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    res.setHeader('cache-control', 'no-store')
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('allow', 'GET, HEAD')
      send(res, 405, 'keyboard-trace/enabled takes only GET')
      return
    }
    const body = JSON.stringify({ enabled: await isEnabled() })
    res.statusCode = 200
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader('x-content-type-options', 'nosniff')
    res.end(req.method === 'HEAD' ? undefined : body)
  }
  return (req, res, next) => {
    handle(req, res).catch(next)
  }
}

/** The structural part of Vite's dev server this plugin uses. */
type DevServer = { middlewares: { use: (path: string, handler: TraceHandler) => unknown } }

/** The Vite plugin: the trace endpoint and its switch on the dev server only (`apply: 'serve'`). */
export function keyboardTracePlugin(options: Parameters<typeof createTraceHandler>[0] = {}) {
  return {
    name: 'bridge-keyboard-trace',
    apply: 'serve' as const,
    configureServer(server: DevServer) {
      // The switch first: connect matches by prefix, so the trace endpoint
      // would also take `/__keyboard-trace/enabled`.
      server.middlewares.use(
        KEYBOARD_TRACE_ENABLED_PATH,
        createEnabledHandler(options.traceDir ? { traceDir: options.traceDir } : {}),
      )
      server.middlewares.use(KEYBOARD_TRACE_PATH, createTraceHandler(options))
    },
  }
}
