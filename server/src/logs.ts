// Reads the server's log lines back for `pnpm logs` and for the
// terminal: a filter by request ID, level and time, and one readable line
// for each entry, with an error's stack under it.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { type LogLevel, logLevels } from './logger.ts'

const levelNumber: Readonly<Record<LogLevel, number>> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
}

const LogEntry = z.looseObject({ level: z.number(), time: z.string(), msg: z.string() })
export type LogEntry = z.infer<typeof LogEntry>

export type LogFilter = {
  readonly requestId?: string | undefined
  /** The lowest level to show. */
  readonly level?: LogLevel | undefined
  readonly since?: Date | undefined
}

/** One log line as an entry, or undefined when it is not one. */
export function parseLine(line: string): LogEntry | undefined {
  let value: unknown
  try {
    value = JSON.parse(line)
  } catch {
    return undefined
  }
  const entry = LogEntry.safeParse(value)
  return entry.success ? entry.data : undefined
}

function matches(entry: LogEntry, { requestId, level, since }: LogFilter): boolean {
  if (requestId !== undefined && entry.requestId !== requestId) return false
  if (level !== undefined && entry.level < levelNumber[level]) return false
  if (since !== undefined && new Date(entry.time) < since) return false
  return true
}

const levelName = (n: number): string => logLevels.find((l) => levelNumber[l] === n)?.toUpperCase() ?? String(n)

const ErrorShape = z.object({
  message: z.string().optional(),
  stack: z.string().optional(),
  cause: z.unknown().optional(),
})

/** The stack (or the message) of an error and of each of its causes, outermost first. */
function errorChain(err: unknown): string[] {
  const chain: string[] = []
  for (let at: unknown = err; chain.length < 10; ) {
    const shape = ErrorShape.safeParse(at)
    const text = shape.success ? (shape.data.stack ?? shape.data.message) : undefined
    if (!shape.success || text === undefined) break
    chain.push(text)
    at = shape.data.cause
  }
  return chain
}

/** `time LEVEL msg key=value …`, then the error's stack, indented. */
export function formatEntry(entry: LogEntry): string {
  const { level, time, msg, err, ...fields } = entry
  const pairs = Object.entries(fields).map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
  const head = [time, levelName(level).padEnd(5), msg, ...pairs].join(' ')
  const chain = errorChain(err)
  if (chain.length === 0) return err === undefined ? head : `${head} err=${JSON.stringify(err)}`
  return [head, ...chain.map((text, i) => `  ${i === 0 ? '' : 'caused by: '}${text.replaceAll('\n', '\n  ')}`)].join(
    '\n',
  )
}

/** The entries of every log file in `dir`, oldest file first, that match `filter`. */
export function readLogs(dir: string, filter: LogFilter): LogEntry[] {
  return readdirSync(dir)
    .filter((name) => /^bridge-\d{4}-\d{2}-\d{2}\.log$/.test(name))
    .sort()
    .flatMap((name) => readFileSync(join(dir, name), 'utf8').split('\n'))
    .flatMap((line) => parseLine(line) ?? [])
    .filter((entry) => matches(entry, filter))
}

/** `15m`, `2h` or `3d` before `now`, or an ISO time. */
export function sinceOf(text: string, now: Date): Date | undefined {
  const ago = /^(\d+)([mhd])$/.exec(text)
  if (ago) {
    const unit = { m: 60_000, h: 3_600_000, d: 86_400_000 }[ago[2] === 'm' ? 'm' : ago[2] === 'h' ? 'h' : 'd']
    return new Date(now.getTime() - Number(ago[1]) * unit)
  }
  const at = new Date(text)
  return Number.isNaN(at.getTime()) ? undefined : at
}
