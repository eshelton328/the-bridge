// The model of a Claude Code chat and how much of its context window it
// uses, from the end of its session file (a JSON line for each entry). It
// reads back from the end only to the newest reply, only when a request
// asks, and not again while the file stays the same.
import { type FileHandle, open } from 'node:fs/promises'
import { ChatEffort, type ModelAlias } from '@bridge/contract'
import { z } from 'zod'
import type { CompactWindows } from './claudeSettings.ts'

/** The size of each read from the end of a session file. */
const tailBytes = 64 * 1024
/**
 * The most a read takes from the end of a session file. Claude Code can write lines of 80 KB and more (a prompt
 * snapshot) after a reply, so a reply can be far from the end; a chat whose last reply is further back shows none.
 */
const maxSessionBytes = 16 * 1024 * 1024

const Usage = z.object({
  input_tokens: z.number().nonnegative().optional(),
  cache_read_input_tokens: z.number().nonnegative().optional(),
  cache_creation_input_tokens: z.number().nonnegative().optional(),
})

/** A line that holds the effort of its turn: Claude Code writes `perTurnEffort` and `effort` on its entries. */
const EffortLine = z.object({
  isSidechain: z.boolean().optional(),
  perTurnEffort: z.unknown().optional(),
  effort: z.unknown().optional(),
})

const AssistantLine = z.object({
  type: z.literal('assistant'),
  isSidechain: z.boolean().optional(),
  message: z.object({ model: z.string(), usage: Usage.optional() }),
})

/**
 * The context window of each model, in tokens (the claude-api reference, cached 2026-11-03). A model that is not
 * here has no `contextUsed`: the app shows none rather than a wrong share. Opus 4.6 and Sonnet 4.6 are not here,
 * because a session picks a 200K or a 1M window for them and the session file does not say which.
 */
const contextWindows: Readonly<Record<string, number>> = {
  'claude-fable-5-2': 1_000_000,
  'claude-fable-5-1': 1_000_000,
  'claude-fable-5': 1_000_000,
  'claude-opus-5-5': 1_000_000,
  'claude-opus-5': 1_000_000,
  'claude-opus-4-8': 1_000_000,
  'claude-opus-4-7': 1_000_000,
  'claude-sonnet-5-5': 1_000_000,
  'claude-sonnet-5': 1_000_000,
  'claude-haiku-5-5': 1_000_000,
  'claude-haiku-4-5': 200_000,
}

export type ClaudeSession = {
  /** The model of the last assistant entry, such as "claude-opus-5-5"; null when the file has none. */
  readonly model: string | null
  /**
   * The share of the context that the last request used, 0 to 1; null when not known. The whole is the model's
   * auto-compact window when Claude Code's settings set one (the chat compacts there), else its context window.
   */
  readonly contextUsed: number | null
  /** The effort of the newest entry that names a known one; null when none does. */
  readonly effort: ChatEffort | null
}

const unknownSession: ClaudeSession = { model: null, contextUsed: null, effort: null }

/** The family of a Claude model ID, such as "opus" for "claude-opus-5-5"; null for another model or none. */
export function modelAliasOf(model: string | null): ModelAlias | null {
  const family = /^claude-(fable|opus|sonnet|haiku)(?:-|$)/.exec(model ?? '')?.[1]
  return family === 'fable' || family === 'opus' || family === 'sonnet' || family === 'haiku' ? family : null
}

/** The effort that one parsed line names, its turn's first; null when it names none that `/effort` takes. */
function effortOf(value: unknown): ChatEffort | null {
  const line = EffortLine.safeParse(value)
  if (!line.success || line.data.isSidechain === true) return null
  for (const field of [line.data.perTurnEffort, line.data.effort]) {
    const effort = ChatEffort.safeParse(field)
    if (effort.success) return effort.data
  }
  return null
}

/** What the lines of one read gave: the newest reply's model and context share, if any, and the newest effort. */
type Scan = { found?: Reply; effort: ChatEffort | null }
/** The newest reply's model and the tokens its request used, null when the line has no usage. */
type Reply = { model: string; used: number | null }

/**
 * Reads `lines`, newest first, from `effort` on: the first reply ends the read, and the effort of the reply's turn
 * may be on an older line of the same lines (a prompt names its turn's effort before the reply does).
 */
function scanLines(lines: readonly string[], effortSoFar: ChatEffort | null): Scan {
  let effort = effortSoFar
  let found: Scan['found']
  for (const line of lines) {
    if (found !== undefined && effort !== null) break
    let value: unknown
    try {
      value = JSON.parse(line)
    } catch {
      continue
    }
    effort ??= effortOf(value)
    if (found !== undefined) continue
    const entry = AssistantLine.safeParse(value)
    // Claude Code writes "<synthetic>" for an entry no model made, such as an interrupted turn; a side chain is a
    // subagent's own context.
    if (!entry.success || entry.data.message.model === '<synthetic>' || entry.data.isSidechain === true) continue
    const { model, usage } = entry.data.message
    const used = usage
      ? (usage.input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0)
      : null
    found = { model, used }
  }
  return found === undefined ? { effort } : { found, effort }
}

/** What one read of a session file found, before the context share. */
type Read = { reply: Reply | null; effort: ChatEffort | null }

/** The share of the whole that `reply` used, capped at 1; null for a model with no window or a reply with no usage. */
function contextUsedOf(reply: Reply, compactWindows: CompactWindows): number | null {
  // A dated ID, such as "claude-haiku-4-5-20251001", has the window of its alias.
  const model = reply.model.replace(/-\d{8}$/, '')
  const window = compactWindows[model] ?? contextWindows[model]
  return window === undefined || reply.used === null ? null : Math.min(1, reply.used / window)
}

/** The last result for each session file, with the size and change time it was read at. */
const cache = new Map<string, { size: number; mtimeMs: number; limit: number; read: Read }>()
/** The most files the cache holds; the oldest entry goes first. */
const cacheEntries = 512

/**
 * The model, context share and effort of the session file at `path`; each null when it cannot be read. It reads
 * back from the end in chunks of 64 KB and stops at the first reply, or after `limit` bytes: Claude Code can write
 * lines of 80 KB and more (a prompt snapshot) after a reply. A file whose size and change time are the same as at
 * the last read is not read again. `compactWindows` are the auto-compact windows from Claude Code's settings.
 */
export async function readClaudeSession(
  path: string,
  limit = maxSessionBytes,
  compactWindows: CompactWindows = {},
): Promise<ClaudeSession> {
  try {
    const handle = await open(path, 'r')
    try {
      const { size, mtimeMs } = await handle.stat()
      const known = cache.get(path)
      const fresh = known?.size === size && known.mtimeMs === mtimeMs && known.limit === limit
      const read = fresh ? known.read : await readBack(handle, size, limit)
      if (!fresh) {
        cache.delete(path)
        cache.set(path, { size, mtimeMs, limit, read })
        for (const oldest of cache.keys()) {
          if (cache.size <= cacheEntries) break
          cache.delete(oldest)
        }
      }
      const { reply, effort } = read
      return reply === null
        ? { ...unknownSession, effort }
        : { model: reply.model, contextUsed: contextUsedOf(reply, compactWindows), effort }
    } finally {
      await handle.close()
    }
  } catch {
    return unknownSession
  }
}

async function readBack(handle: FileHandle, size: number, limit: number): Promise<Read> {
  let end = size
  let read = 0
  // The start of a line whose rest was in the chunk before; it joins the next chunk, which holds its start.
  let carry = Buffer.alloc(0)
  let effort: ChatEffort | null = null
  while (end > 0 && read < limit) {
    const length = Math.min(tailBytes, end, limit - read)
    const start = end - length
    const chunk = Buffer.alloc(length)
    await handle.read(chunk, 0, length, start)
    end = start
    read += length
    const data = Buffer.concat([chunk, carry])
    // Before the first line end, the data may be part of a line; at the start of the file it is a whole line.
    const cut = end === 0 ? 0 : data.indexOf(10) + 1
    if (cut === 0 && end > 0) {
      carry = data
      continue
    }
    carry = data.subarray(0, cut)
    const scan = scanLines(data.subarray(cut).toString('utf8').split('\n').reverse(), effort)
    effort = scan.effort
    if (scan.found !== undefined) return { reply: scan.found, effort }
  }
  return { reply: null, effort }
}

/** Claude Code's folder name for a working directory: each character that is not a letter or digit becomes "-". */
export function claudeProjectFolder(cwd: string): string {
  return cwd.replace(/[^A-Za-z0-9]/g, '-')
}
