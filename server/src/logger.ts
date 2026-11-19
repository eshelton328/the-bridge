// The server's one logger (d-115): pino, one JSON line per entry. Each
// message is a constant from `logMessages` and the data goes in fields,
// because pino's redaction reads the fields, never the message text. The
// `Logger` type takes only a listed message, and a hook replaces any other
// message that reaches pino, so a value never hides in a message.
import { closeSync, mkdirSync, openSync, readdirSync, rmSync, writeSync } from 'node:fs'
import { join } from 'node:path'
import pino from 'pino'
import { z } from 'zod'

const Entry = z.record(z.string(), z.unknown())

const logMessages = [
  'request',
  'server started',
  'server error',
  'uncaught exception',
  'unhandled rejection',
  'log message not listed',
] as const
export type LogMessage = (typeof logMessages)[number]
const listed: ReadonlySet<unknown> = new Set(logMessages)

export const logLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const
export type LogLevel = (typeof logLevels)[number]

type LogFields = Readonly<Record<string, unknown>>

export type Logger = Readonly<Record<LogLevel, (message: LogMessage, fields?: LogFields) => void>> & {
  /** A logger that adds `fields` to each entry, such as a request ID. */
  readonly child: (fields: LogFields) => Logger
}

/** Where the lines go; pino calls `write` once for each line, at once. */
export type LogSink = { readonly write: (line: string) => void }

/** The fields that never reach a log: prompt and transcript text, tokens and Tailscale logins (d-115). */
const redactPaths = [
  'prompt',
  '*.prompt',
  'transcript',
  '*.transcript',
  'token',
  '*.token',
  'authorization',
  '*.authorization',
  'login',
  '*.login',
  'headers["tailscale-user-login"]',
  '*.headers["tailscale-user-login"]',
]

function wrap(base: pino.Logger): Logger {
  const at =
    (level: LogLevel) =>
    (message: LogMessage, fields: LogFields = {}) => {
      base[level](fields, message)
    }
  return {
    trace: at('trace'),
    debug: at('debug'),
    info: at('info'),
    warn: at('warn'),
    error: at('error'),
    fatal: at('fatal'),
    child: (fields) => wrap(base.child(fields)),
  }
}

/** The pino logger under a `Logger`. */
function createPino(sink: LogSink, level: LogLevel): pino.Logger {
  return pino(
    {
      level,
      base: null,
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: { paths: redactPaths, censor: '[redacted]' },
      serializers: { err: pino.stdSerializers.errWithCause },
      hooks: {
        logMethod(args, method) {
          const message = args.findIndex((a) => typeof a === 'string')
          if (message === -1 || listed.has(args[message])) {
            method.apply(this, args)
            return
          }
          const fields: unknown = message === 0 ? {} : args[0]
          method.call(this, fields, 'log message not listed')
        },
      },
    },
    sink,
  )
}

export function createLogger(sink: LogSink, level: LogLevel): Logger {
  return wrap(createPino(sink, level))
}

/** Sends each line to every sink. */
export const teeSinks = (...sinks: readonly LogSink[]): LogSink => ({
  write: (line) => {
    for (const sink of sinks) sink.write(line)
  },
})

const fileName = /^bridge-(\d{4}-\d{2}-\d{2})\.log$/

/**
 * One file for each UTC day in `dir` (`bridge-2026-11-19.log`), written at once with no buffer, so a fatal
 * line is on disk before the process exits. When a new day's file opens, the oldest files past `keepDays` go.
 */
export function dailyFiles(dir: string, keepDays = 14, now: () => Date = () => new Date()): LogSink {
  mkdirSync(dir, { recursive: true, mode: 0o700 })
  let day = ''
  let fd = -1
  const prune = () => {
    const days = readdirSync(dir)
      .filter((name) => fileName.test(name))
      .sort()
    for (const name of days.slice(0, Math.max(0, days.length - keepDays))) rmSync(join(dir, name))
  }
  return {
    write: (line) => {
      const today = now().toISOString().slice(0, 10)
      if (today !== day) {
        if (fd !== -1) closeSync(fd)
        day = today
        fd = openSync(join(dir, `bridge-${today}.log`), 'a', 0o600)
        prune()
      }
      writeSync(fd, line)
    },
  }
}

/** A logger that keeps its lines in memory, for tests. */
export function memoryLogger(level: LogLevel = 'trace'): {
  readonly log: Logger
  readonly pino: pino.Logger
  readonly lines: () => Record<string, unknown>[]
} {
  const kept: string[] = []
  const base = createPino({ write: (line) => kept.push(line) }, level)
  return { log: wrap(base), pino: base, lines: () => kept.map((line) => Entry.parse(JSON.parse(line))) }
}
