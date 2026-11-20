// The short target of a tool call that a transcript shows beside the
// tool's name. It never holds an argument, a query or a result, which can
// hold a token or a private text: a shell tool gives its program names
// only, a file tool its path from the chat's folder or with the home
// folder as "~", a web tool its host only, and any other tool "".
import { basename, isAbsolute, relative } from 'node:path'
import { z } from 'zod'

export type TargetContext = {
  /** The chat's working folder, such as the repo it works in. */
  readonly cwd: string | undefined
  /** The owner's home folder, shown as "~". */
  readonly home: string
}

const maxTarget = 200

const shellTools = new Set(['Bash', 'PowerShell'])
const fileTools = new Set(['Read', 'Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'Grep', 'Glob'])
const webTools = new Set(['WebFetch'])

const Input = z.object({
  command: z.string().optional(),
  file_path: z.string().optional(),
  notebook_path: z.string().optional(),
  path: z.string().optional(),
  url: z.string().optional(),
})

/** A word that is a program name, with no quote, dollar sign or slash after basename. */
const programName = /^[A-Za-z0-9][A-Za-z0-9._+-]*$/
const assignment = /^[A-Za-z_][A-Za-z0-9_]*=/
const prefixes = new Set(['sudo', 'env', 'time', 'nohup', 'exec', 'command', 'builtin'])

/** A heredoc from its marker to its end line (or to the end of the command), whose body is text, not commands. */
const heredoc = /<<-?[ \t]*(['"]?)([A-Za-z0-9_]+)\1[^\n]*(?:\n[\s\S]*?\n[ \t]*\2[ \t]*(?=\n|$)|[\s\S]*$)/g
/** A quoted string, which is never a program name and can hold a separator such as "|". */
const quoted = /'[^']*'|"(?:\\.|[^"\\])*"/g
/** A redirection, such as "2>&1" or ">>". */
const redirection = /\d*[<>]+&?\d*-?/g

/** The program names of a shell command line, joined with " | ", such as "git | grep". */
export function programsOf(command: string): string {
  // A backslash and a newline join two lines; "@" stands for a heredoc, an escaped character and a quoted string.
  let line = command
    .replace(/\\\n/g, ' ')
    .replace(heredoc, ' @ ')
    .replace(/\\[\s\S]/g, ' @ ')
    .replace(quoted, ' @ ')
  // A quote that does not close: nothing after it is read.
  const unclosed = line.search(/['"]/)
  if (unclosed >= 0) line = line.slice(0, unclosed)
  line = line.replace(redirection, ' ')
  const names: string[] = []
  for (const segment of line.split(/\|\||&&|[|;&\n(){}`]/)) {
    const words = segment.trim().split(/\s+/)
    const word = words.find((w) => w !== '' && !assignment.test(w) && !prefixes.has(w))
    if (word === undefined) continue
    const name = basename(word)
    if (programName.test(name)) names.push(name)
  }
  return names.join(' | ')
}

function pathTarget(path: string, { cwd, home }: TargetContext): string {
  if (!isAbsolute(path)) return path
  const under = (root: string | undefined) => {
    if (root === undefined) return undefined
    const rel = relative(root, path)
    return rel.startsWith('..') || isAbsolute(rel) ? undefined : rel
  }
  const inCwd = under(cwd)
  if (inCwd !== undefined) return inCwd === '' ? '.' : inCwd
  const inHome = under(home)
  if (inHome !== undefined) return inHome === '' ? '~' : `~/${inHome}`
  return basename(path)
}

function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return ''
  }
}

/** The short target of a call to the tool `name` with `input`: see the file comment. */
export function toolTarget(name: string, input: unknown, context: TargetContext): string {
  const parsed = Input.safeParse(input)
  if (!parsed.success) return ''
  const { command, file_path, notebook_path, path, url } = parsed.data
  let target = ''
  if (shellTools.has(name) && command !== undefined) target = programsOf(command)
  else if (fileTools.has(name)) {
    const file = file_path ?? notebook_path ?? path
    target = file === undefined ? '' : pathTarget(file, context)
  } else if (webTools.has(name) && url !== undefined) target = hostOf(url)
  // A control character never reaches the client.
  return target.replace(/\p{Cc}/gu, '').slice(0, maxTarget)
}
