// The plugins whose skills and commands a Claude chat loads (R34): each
// install in Claude Code's `plugins/installed_plugins.json` that applies to
// the chat's folder and that the settings turn on. Both files are only read,
// never written, and each is read again only when its size or change time moves.
import { readFile, stat } from 'node:fs/promises'
import { dirname, isAbsolute, join } from 'node:path'
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
 * The folder of the chat's own `settings.local.json`: its repository root, and for a worktree (a `.git` file
 * that points into `<main>/.git/worktrees/`) the main checkout's root, as Claude Code keeps the file there. Outside a
 * repository it is the chat's folder. `folders` end at the root when it has `.git`.
 */
async function localSettingsFolder(folders: readonly string[]): Promise<string | undefined> {
  const root = folders.at(-1)
  if (root === undefined) return undefined
  let git: string
  try {
    if ((await stat(join(root, '.git'))).isDirectory()) return root
    git = await readFile(join(root, '.git'), 'utf8')
  } catch {
    return folders[0]
  }
  const gitdir = /^gitdir:\s*(.+)$/m.exec(git)?.[1]?.trim()
  if (gitdir === undefined) return root
  const full = isAbsolute(gitdir) ? gitdir : join(root, gitdir)
  const at = full.lastIndexOf(join('.git', 'worktrees'))
  return at > 0 ? dirname(full.slice(0, at + '.git'.length)) : root
}

/**
 * The plugins a Claude chat loads: `folders` are the chat's folder up to its repository root, nearest first. A
 * plugin is on when the last settings file that names it says `true`: the owner's `settings.json`, then from the
 * root down to the chat's folder each `.claude/settings.json`, then the one `.claude/settings.local.json` of
 * `localSettingsFolder`. Its install
 * applies when its scope is `user`, or when its `projectPath` is one of `folders`.
 */
export async function readPluginFolders(claudeDir: string, folders: readonly string[]): Promise<PluginFolder[]> {
  const installed = Installed.safeParse(await jsonOf(join(claudeDir, 'plugins', 'installed_plugins.json')))
  if (!installed.success) return []
  const local = await localSettingsFolder(folders)
  const settingsFiles = [
    join(claudeDir, 'settings.json'),
    ...[...folders].reverse().map((folder) => join(folder, '.claude', 'settings.json')),
    ...(local === undefined ? [] : [join(local, '.claude', 'settings.local.json')]),
  ]
  const enabled = new Map<string, boolean>()
  for (const settings of await Promise.all(settingsFiles.map(jsonOf))) {
    const parsed = Settings.safeParse(settings)
    for (const [key, on] of Object.entries(parsed.success ? (parsed.data.enabledPlugins ?? {}) : {}))
      enabled.set(key, on === true)
  }
  const places = local === undefined ? folders : [...folders, local]
  const found: PluginFolder[] = []
  for (const [key, installs] of Object.entries(installed.data.plugins)) {
    if (enabled.get(key) !== true) continue
    const install = installs
      .flatMap((entry) => {
        const parsed = Install.safeParse(entry)
        return parsed.success ? [parsed.data] : []
      })
      .find(({ scope, projectPath }) => scope === 'user' || (projectPath !== undefined && places.includes(projectPath)))
    const name = key.split('@')[0] ?? ''
    if (install !== undefined && name !== '') found.push({ name, path: install.installPath })
  }
  return found
}
