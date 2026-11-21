// The model of a Claude Code chat and how much of its context window it
// uses, from the end of its session file (a JSON line for each entry). Only
// the last 64 KB is read, and only when a request asks, so a long
// transcript costs the same as a short one.
import { open } from 'node:fs/promises'
import { ChatEffort, type ModelAlias } from '@bridge/contract'
import { z } from 'zod'

const tailBytes = 64 * 1024

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
  /** The share of the model's context window that the last request used, 0 to 1; null when not known. */
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

/** The model, context share and effort of the session file at `path`; each null when it cannot be read. */
export async function readClaudeSession(path: string): Promise<ClaudeSession> {
  let text: string
  try {
    const handle = await open(path, 'r')
    try {
      const { size } = await handle.stat()
      const start = Math.max(0, size - tailBytes)
      const buffer = Buffer.alloc(size - start)
      await handle.read(buffer, 0, buffer.length, start)
      text = buffer.toString('utf8')
    } finally {
      await handle.close()
    }
  } catch {
    return unknownSession
  }
  let effort: ChatEffort | null = null
  for (const line of text.split('\n').reverse()) {
    let value: unknown
    try {
      value = JSON.parse(line)
    } catch {
      continue
    }
    effort ??= effortOf(value)
    const entry = AssistantLine.safeParse(value)
    // Claude Code writes "<synthetic>" for an entry no model made, such as an interrupted turn; a side chain is a
    // subagent's own context.
    if (!entry.success || entry.data.message.model === '<synthetic>' || entry.data.isSidechain === true) continue
    const { model, usage } = entry.data.message
    // A dated ID, such as "claude-haiku-4-5-20251001", has the window of its alias.
    const window = contextWindows[model.replace(/-\d{8}$/, '')]
    const used = usage
      ? (usage.input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0)
      : undefined
    const contextUsed = window === undefined || used === undefined ? null : Math.min(1, used / window)
    return { model, contextUsed, effort }
  }
  return { ...unknownSession, effort }
}

/** Claude Code's folder name for a working directory: each character that is not a letter or digit becomes "-". */
export function claudeProjectFolder(cwd: string): string {
  return cwd.replace(/[^A-Za-z0-9]/g, '-')
}
