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
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
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

/** The component library the app runs, whose version a trace records. */
const LIBRARY_PACKAGE = '@eshelton328/component-library-1701'
/** The name of the define that carries the build into the app (keyboardTrace.ts reads it). */
export const KEYBOARD_TRACE_BUILD_DEFINE = '__KEYBOARD_TRACE_BUILD__'

/** The build a trace was taken on: the served tree's commit and the component library's version, null when unknown. */
export type TraceBuild = { commit: string | null; libraryVersion: string | null }

/** A short or full commit sha. */
const COMMIT = /^[0-9a-f]{7,40}$/
/** A package version, such as `1.0.0-beta.102`: letters, digits, `.`, `+` and `-`, at most 64. */
const VERSION = /^[0-9A-Za-z.+-]{1,64}$/

/** Runs `git` in `cwd` and returns its output; throws when git is missing or fails. */
const runGit = (args: string[], cwd: string): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 })

/**
 * Reads the build once, when the dev server starts: `git rev-parse --short HEAD` in the repository and the `version`
 * of the component library's package.json under `web/node_modules`. Each is null when it cannot be read (no git, no
 * install, an odd value), and nothing here throws, so the dev server always starts.
 */
export function readTraceBuild({
  root = repoRoot,
  git = runGit,
}: {
  root?: string
  git?: (args: string[], cwd: string) => string
} = {}): TraceBuild {
  const readCommit = (): string | null => {
    try {
      const sha = git(['rev-parse', '--short', 'HEAD'], root).trim()
      return COMMIT.test(sha) ? sha : null
    } catch {
      return null
    }
  }
  const readLibraryVersion = (): string | null => {
    try {
      const manifest: unknown = JSON.parse(
        readFileSync(join(root, 'web', 'node_modules', ...LIBRARY_PACKAGE.split('/'), 'package.json'), 'utf8'),
      )
      const version = isRecord(manifest) ? manifest.version : undefined
      return typeof version === 'string' && VERSION.test(version) ? version : null
    } catch {
      return null
    }
  }
  return { commit: readCommit(), libraryVersion: readLibraryVersion() }
}

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
/** A Workspaces state key, such as `phoneChatFull`: letters and digits only, so no free text gets in. */
const STATE_KEY = /^[A-Za-z][A-Za-z0-9]{0,63}$/
/** An app path, such as `/workspaces`: no query, hash or dot segment. */
const PATHNAME = /^(?:\/[A-Za-z0-9_-]+)*\/?$/
const CHAT_DEVICES = new Set(['phone', 'tablet'])
/** A `kb-experiment` key, as the app reads it: letters, digits, `_` and `-`, at most 32. */
const KB_EXPERIMENT = /^[A-Za-z0-9_-]{1,32}$/
/** `build`: `{ commit, libraryVersion }`, a commit sha and a package version, each may be null. */
function isTraceBuild(build: unknown): boolean {
  return (
    hasOnly(build, ['commit', 'libraryVersion']) &&
    (build.commit === null || (typeof build.commit === 'string' && COMMIT.test(build.commit))) &&
    (build.libraryVersion === null || (typeof build.libraryVersion === 'string' && VERSION.test(build.libraryVersion)))
  )
}

const isStateKey = (value: unknown) => value === null || (typeof value === 'string' && STATE_KEY.test(value))
/** Whether `value` is a record with exactly `keys`, so a field with other text in it is refused. */
const hasOnly = (value: unknown, keys: readonly string[]): value is Record<string, unknown> =>
  isRecord(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key))

/** `route`: `{ pathname, state }`, the path and the `state` search param only (null when there is none). */
function isTraceRoute(route: unknown): boolean {
  return (
    hasOnly(route, ['pathname', 'state']) &&
    typeof route.pathname === 'string' &&
    route.pathname.length <= 200 &&
    PATHNAME.test(route.pathname) &&
    isStateKey(route.state)
  )
}

/** `chat`: `{ state, device }`, the Workspaces state key (null for the default) and `phone` or `tablet`. */
function isTraceChat(chat: unknown): boolean {
  return (
    hasOnly(chat, ['state', 'device']) &&
    isStateKey(chat.state) &&
    typeof chat.device === 'string' &&
    CHAT_DEVICES.has(chat.device)
  )
}

/**
 * Whether a trace's header is valid: `userAgent` and `samples[]` always, and
 * `displayMode`, `screenHeight`, `screenWidth`, `devicePixelRatio`,
 * `safeArea`, `reducedMotion`, `automated`, `kbExperiment`, `route`,
 * `chat` and `build` checked when present, so a trace from a
 * client older than those fields is still taken.
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
  for (const key of ['reducedMotion', 'automated'] as const) {
    if (trace[key] !== undefined && typeof trace[key] !== 'boolean') return false
  }
  const kbExperiment = trace.kbExperiment
  if (
    kbExperiment !== undefined &&
    kbExperiment !== null &&
    !(typeof kbExperiment === 'string' && KB_EXPERIMENT.test(kbExperiment))
  )
    return false
  if (trace.route !== undefined && !isTraceRoute(trace.route)) return false
  if (trace.chat !== undefined && !isTraceChat(trace.chat)) return false
  if (trace.build !== undefined && !isTraceBuild(trace.build)) return false
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
        'keyboard-trace body needs { startedAt, userAgent, samples[] }, and a valid displayMode, screenHeight, screenWidth, devicePixelRatio, safeArea, reducedMotion, automated, kbExperiment, route, chat and build when present',
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

/**
 * The Vite plugin: the trace endpoint and its switch on the dev server only (`apply: 'serve'`), and the define
 * `__KEYBOARD_TRACE_BUILD__` with the build (`readTraceBuild`), read once when the dev server starts.
 */
export function keyboardTracePlugin(
  options: Parameters<typeof createTraceHandler>[0] & { build?: () => TraceBuild } = {},
) {
  const { build = () => readTraceBuild(), ...handlerOptions } = options
  return {
    name: 'bridge-keyboard-trace',
    apply: 'serve' as const,
    config() {
      return { define: { [KEYBOARD_TRACE_BUILD_DEFINE]: JSON.stringify(build()) } }
    },
    configureServer(server: DevServer) {
      // The switch first: connect matches by prefix, so the trace endpoint
      // would also take `/__keyboard-trace/enabled`.
      const switchOptions = handlerOptions.traceDir ? { traceDir: handlerOptions.traceDir } : {}
      server.middlewares.use(KEYBOARD_TRACE_ENABLED_PATH, createEnabledHandler(switchOptions))
      server.middlewares.use(KEYBOARD_TRACE_PATH, createTraceHandler(handlerOptions))
    },
  }
}
