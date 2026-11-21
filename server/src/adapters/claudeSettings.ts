// The auto-compact window that Claude Code's settings set for each model
// (`modelSettings["<model>"].autoCompactWindow` in ~/.claude/settings.json). A
// chat compacts when its context reaches that window, so the context bar is
// full there. The file is only read, never written, and read again only when
// its size or change time moves.
import { stat, readFile } from 'node:fs/promises'
import { z } from 'zod'

const Settings = z.object({
  modelSettings: z
    .record(z.string(), z.object({ autoCompactWindow: z.number().int().positive().optional() }).loose())
    .optional(),
})

/** The window of each model ID that sets one, in tokens; empty when the file is missing or cannot be read. */
export type CompactWindows = Readonly<Record<string, number>>

let last: { path: string; size: number; mtimeMs: number; windows: CompactWindows } | undefined

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
    for (const [model, settings] of Object.entries(models))
      if (settings.autoCompactWindow !== undefined) windows[model] = settings.autoCompactWindow
    last = { path, size, mtimeMs, windows }
    return windows
  } catch {
    return {}
  }
}
