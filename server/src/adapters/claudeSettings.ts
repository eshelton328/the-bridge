// The auto-compact window that Claude Code's settings set for each model
// (`modelSettings["<model>"].autoCompactWindow` in ~/.claude/settings.json). A
// chat compacts when its context reaches that window, so the context bar is
// full there. The file is only read, never written, and read again only when
// its size or change time moves.
import { stat, readFile } from 'node:fs/promises'
import { z } from 'zod'

// Each model's settings are read one by one, so a value this server does not take (such as "auto") for one model
// drops only that model's window.
const Settings = z.object({ modelSettings: z.record(z.string(), z.unknown()).optional() })
const ModelWindow = z.object({ autoCompactWindow: z.number().int().positive() })

/** The window of each model ID that sets one, in tokens; empty when the file is missing or cannot be read. */
export type CompactWindows = Readonly<Record<string, number>>

let last: { path: string; size: number; mtimeMs: number; windows: CompactWindows } | undefined

/** The one setting a side run copies (`env`): Code Mode. A session started in it resumes only in it. */
export const codeModeKey = 'CLAUDE_CODE_EXPERIMENTAL_CODE_MODE'
const CodeModeEnv = z.object({ env: z.object({ [codeModeKey]: z.string() }) })

/**
 * The value that the settings file at `path` gives `env.CLAUDE_CODE_EXPERIMENTAL_CODE_MODE`; undefined when it gives
 * none or the file cannot be read. It reads no other key of `env`, which can hold a token.
 */
export async function readCodeMode(path: string): Promise<string | undefined> {
  let value: unknown
  try {
    value = JSON.parse(await readFile(path, 'utf8'))
  } catch {
    // A missing or bad file sets no Code Mode.
    return undefined
  }
  const parsed = CodeModeEnv.safeParse(value)
  return parsed.success ? parsed.data.env[codeModeKey] : undefined
}

/** The auto-compact windows that the settings file at `path` sets; a model the file does not name is not here. */
export async function readCompactWindows(path: string): Promise<CompactWindows> {
  try {
    const { size, mtimeMs } = await stat(path)
    if (last?.path === path && last.size === size && last.mtimeMs === mtimeMs) return last.windows
    let value: unknown
    try {
      value = JSON.parse(await readFile(path, 'utf8'))
    } catch {
      value = undefined
    }
    const parsed = Settings.safeParse(value)
    const windows: Record<string, number> = {}
    const models = parsed.success ? (parsed.data.modelSettings ?? {}) : {}
    for (const [model, settings] of Object.entries(models)) {
      const window = ModelWindow.safeParse(settings)
      if (window.success) windows[model] = window.data.autoCompactWindow
    }
    last = { path, size, mtimeMs, windows }
    return windows
  } catch {
    return {}
  }
}
