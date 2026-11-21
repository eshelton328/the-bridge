// The skills and commands of a Claude chat's "/" list, from the files that
// Claude Code reads when a session starts (R34): the owner's (~/.claude/skills
// and ~/.claude/commands) and each folder's from the chat's folder up to its
// repository root (.claude/skills, .claude/commands). Not the skills of a
// folder below the chat's folder: Claude Code loads those only once it works
// there. Only the front matter of a file is read (its first 16 KB), never the
// rest; a folder and a file are read again only when their change time or
// size moves.
import { readdir, stat, open } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { ChatSkill, maxSkills, type SkillSource } from '@bridge/contract'

/** The commands that the page sends itself; each one goes through `POST /api/chats/:chat/command` or the chat bar. */
export const builtinCommands: readonly ChatSkill[] = [
  { name: 'compact', description: 'Compact the conversation, with optional instructions', source: 'builtin' },
  { name: 'clear', description: 'Start a new conversation in this pane', source: 'builtin' },
  { name: 'model', description: 'Change the model of this chat', source: 'builtin' },
  { name: 'effort', description: 'Change the effort of this chat', source: 'builtin' },
]

/** The length a description is cut to: one line on a phone. */
const descriptionChars = 80
/** The most bytes read from a file for its front matter. */
const headBytes = 16 * 1024
/** How deep a `commands` folder's subfolders go into a command's name ("frontend:component"). */
const maxCommandDepth = 3

type Head = { name?: string; description: string; hidden: boolean }

/** One line of a description, cut at a word near `descriptionChars` with "…". */
export function oneLine(text: string): string {
  const line = text.replace(/\s+/g, ' ').trim()
  if (line.length <= descriptionChars) return line
  const cut = line.slice(0, descriptionChars - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > descriptionChars / 2 ? cut.slice(0, space) : cut).trimEnd()}…`
}

/** A YAML value: a quoted one without its quotes, a plain one without a `# comment` at its end. */
const unquote = (value: string) =>
  /^["']/.test(value) ? value.replace(/^(["'])([\s\S]*)\1$/, '$2') : value.replace(/\s+#.*$/, '')

/** The name, description and `user-invocable` of a file's YAML front matter; null for a file with none. */
export function frontMatterOf(text: string): Head | null {
  const lines = text.split(/\r?\n/)
  if (lines[0]?.trim() !== '---') return null
  const end = lines.indexOf('---', 1)
  const body = lines.slice(1, end < 0 ? lines.length : end)
  const fields = new Map<string, string>()
  for (let i = 0; i < body.length; i += 1) {
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(body[i] ?? '')
    if (match?.[1] === undefined) continue
    let value = match[2] ?? ''
    // A block (">" or "|") or a plain value that goes on in the indented lines below it.
    const more: string[] = []
    while (i + 1 < body.length && /^\s+\S/.test(body[i + 1] ?? '')) {
      i += 1
      more.push((body[i] ?? '').trim())
    }
    if (/^[>|][+-]?$/.test(value.trim())) value = more.join(' ')
    else if (more.length > 0) value = [value, ...more].join(' ')
    fields.set(match[1], unquote(value.trim()))
  }
  const name = fields.get('name')
  return {
    ...(name !== undefined && name !== '' && { name }),
    description: oneLine(fields.get('description') ?? ''),
    hidden: fields.get('user-invocable') === 'false',
  }
}

const heads = new Map<string, { size: number; mtimeMs: number; head: Head | null }>()
const listings = new Map<string, { mtimeMs: number; names: string[] }>()

async function headOf(path: string): Promise<Head | null> {
  try {
    const { size, mtimeMs } = await stat(path)
    const known = heads.get(path)
    if (known?.size === size && known.mtimeMs === mtimeMs) return known.head
    const handle = await open(path, 'r')
    try {
      const buffer = Buffer.alloc(Math.min(size, headBytes))
      await handle.read(buffer, 0, buffer.length, 0)
      // A file with no front matter still counts, by its folder's or file's name.
      const head = frontMatterOf(buffer.toString('utf8')) ?? { description: '', hidden: false }
      heads.set(path, { size, mtimeMs, head })
      return head
    } finally {
      await handle.close()
    }
  } catch {
    return null
  }
}

/** The names in a folder, sorted; none when it is missing. */
async function namesIn(folder: string): Promise<string[]> {
  try {
    const { mtimeMs } = await stat(folder)
    const known = listings.get(folder)
    if (known?.mtimeMs === mtimeMs) return known.names
    const names = (await readdir(folder)).filter((n) => !n.startsWith('.')).sort()
    listings.set(folder, { mtimeMs, names })
    return names
  } catch {
    return []
  }
}

const exists = async (path: string) => {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

/** The skills of one `skills` folder (`<skill>/SKILL.md`), each name with `prefix` before it. */
async function skillsIn(folder: string, source: SkillSource, prefix = ''): Promise<ChatSkill[]> {
  const found = await Promise.all(
    (await namesIn(folder)).map(async (entry) => {
      const head = await headOf(join(folder, entry, 'SKILL.md'))
      if (head === null || head.hidden) return []
      const skill = ChatSkill.safeParse({
        name: `${prefix}${head.name ?? entry}`,
        description: head.description,
        source,
      })
      return skill.success ? [skill.data] : []
    }),
  )
  return found.flat()
}

/** The commands of one `commands` folder (`<command>.md`); a subfolder's go by "<subfolder>:<command>". */
async function commandsIn(folder: string, source: SkillSource, prefix = '', depth = 0): Promise<ChatSkill[]> {
  const found = await Promise.all(
    (await namesIn(folder)).map(async (entry): Promise<ChatSkill[]> => {
      if (!entry.endsWith('.md'))
        return depth < maxCommandDepth ? commandsIn(join(folder, entry), source, `${prefix}${entry}:`, depth + 1) : []
      const head = await headOf(join(folder, entry))
      if (head === null || head.hidden) return []
      const name = `${prefix}${basename(entry, '.md')}`
      const skill = ChatSkill.safeParse({ name, description: head.description, source })
      return skill.success ? [skill.data] : []
    }),
  )
  return found.flat()
}

/** The folders from `cwd` up to its repository root (the first with `.git`), never `home` or above it. */
async function upToRoot(cwd: string, home: string): Promise<string[]> {
  const folders: string[] = []
  for (let folder = cwd; folder !== home && folder !== dirname(folder); folder = dirname(folder)) {
    folders.push(folder)
    if (await exists(join(folder, '.git'))) break
  }
  return folders
}

/**
 * The "/" list of a Claude chat in `cwd`: the built-in commands, then each skill and command by name, at most
 * `maxSkills` in all. A name that comes twice keeps the one Claude Code runs: the owner's before the chat's folders.
 */
export async function readClaudeSkills(cwd: string | undefined, claudeDir: string, home: string): Promise<ChatSkill[]> {
  const local = cwd === undefined ? [] : await upToRoot(cwd, home)
  const groups = await Promise.all([
    skillsIn(join(claudeDir, 'skills'), 'user'),
    commandsIn(join(claudeDir, 'commands'), 'user'),
    ...local.map((folder) => skillsIn(join(folder, '.claude', 'skills'), 'project')),
    ...local.map((folder) => commandsIn(join(folder, '.claude', 'commands'), 'project')),
  ])
  const seen = new Set(builtinCommands.map((c) => c.name))
  const skills = groups.flat().filter((s) => !seen.has(s.name) && seen.add(s.name))
  const sorted = skills.sort((a, b) => a.name.localeCompare(b.name))
  return [...builtinCommands, ...sorted.slice(0, maxSkills - builtinCommands.length)]
}
