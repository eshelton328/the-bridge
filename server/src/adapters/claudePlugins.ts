// The plugins whose skills and commands a Claude chat loads (R34): each
// install in Claude Code's `plugins/installed_plugins.json` that applies to
// the chat's folder and that the settings turn on. Both files are only read,
// never written, and each is read again only when its size or change time moves.
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'

const Install = z.object({
  installPath: z.string().min(1),
  scope: z.string(),
  projectPath: z.string().optional(),
})
const Installed = z.object({ plugins: z.record(z.string(), z.array(z.unknown())) })
const Settings = z.object({ enabledPlugins: z.record(z.string(), z.unknown()).optional() })

/** A plugin that the chat loads: the name its skills go by ("name:skill") and its folder. */
export type PluginFolder = { readonly name: string; readonly path: string }

const files = new Map<string, { size: number; mtimeMs: number; value: unknown }>()

/** The JSON of the file at `path`; undefined when it is missing or is not JSON. */
async function jsonOf(path: string): Promise<unknown> {
  try {
    const { size, mtimeMs } = await stat(path)
    const known = files.get(path)
    if (known?.size === size && known.mtimeMs === mtimeMs) return known.value
    let value: unknown
    try {
      value = JSON.parse(await readFile(path, 'utf8'))
    } catch {
      value = undefined
    }
    files.set(path, { size, mtimeMs, value })
    return value
  } catch {
    return undefined
  }
}

/**
 * The plugins a Claude chat loads: `folders` are the chat's folder up to its repository root, nearest first. A
 * plugin is on when the last settings file that names it says `true`: the owner's `settings.json`, then from the
 * root down to the chat's folder each `.claude/settings.json` and `.claude/settings.local.json`. Its install
 * applies when its scope is `user`, or when its `projectPath` is one of `folders`.
 */
export async function readPluginFolders(claudeDir: string, folders: readonly string[]): Promise<PluginFolder[]> {
  const installed = Installed.safeParse(await jsonOf(join(claudeDir, 'plugins', 'installed_plugins.json')))
  if (!installed.success) return []
  const settingsFiles = [
    join(claudeDir, 'settings.json'),
    ...[...folders]
      .reverse()
      .flatMap((folder) => [join(folder, '.claude', 'settings.json'), join(folder, '.claude', 'settings.local.json')]),
  ]
  const enabled = new Map<string, boolean>()
  for (const settings of await Promise.all(settingsFiles.map(jsonOf))) {
    const parsed = Settings.safeParse(settings)
    for (const [key, on] of Object.entries(parsed.success ? (parsed.data.enabledPlugins ?? {}) : {}))
      enabled.set(key, on === true)
  }
  const found: PluginFolder[] = []
  for (const [key, installs] of Object.entries(installed.data.plugins)) {
    if (enabled.get(key) !== true) continue
    const install = installs
      .flatMap((entry) => {
        const parsed = Install.safeParse(entry)
        return parsed.success ? [parsed.data] : []
      })
      .find(
        ({ scope, projectPath }) => scope === 'user' || (projectPath !== undefined && folders.includes(projectPath)),
      )
    const name = key.split('@')[0] ?? ''
    if (install !== undefined && name !== '') found.push({ name, path: install.installPath })
  }
  return found
}
