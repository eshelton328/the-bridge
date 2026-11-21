// The kind, title and one-line label of a tool call (R32), so the page shows
// "Ran a command · Run the server tests" and not a raw name such as
// "Bash". The label is the call's own `description` field, which the agent
// writes for the owner; no other argument and no result is read.
import type { ToolKind } from '@bridge/contract'
import { z } from 'zod'

const maxLabel = 120

const kinds: Record<string, { kind: ToolKind; title: string }> = {
  Bash: { kind: 'shell', title: 'Ran a command' },
  PowerShell: { kind: 'shell', title: 'Ran a command' },
  REPL: { kind: 'shell', title: 'Ran a script' },
  Read: { kind: 'read', title: 'Read a file' },
  Write: { kind: 'edit', title: 'Wrote a file' },
  Edit: { kind: 'edit', title: 'Edited a file' },
  MultiEdit: { kind: 'edit', title: 'Edited a file' },
  NotebookEdit: { kind: 'edit', title: 'Edited a notebook' },
  Grep: { kind: 'search', title: 'Searched the files' },
  Glob: { kind: 'search', title: 'Found files' },
  WebFetch: { kind: 'web', title: 'Read a web page' },
  WebSearch: { kind: 'web', title: 'Searched the web' },
  Agent: { kind: 'agent', title: 'Started an agent' },
  Task: { kind: 'agent', title: 'Started an agent' },
  SendMessage: { kind: 'message', title: 'Sent a message' },
  TodoWrite: { kind: 'plan', title: 'Updated the to-do list' },
  Skill: { kind: 'plan', title: 'Loaded a skill' },
}

const Input = z.object({ description: z.string().optional() })

const words = (text: string) =>
  text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()

/** "SendMessage" as "Send message"; an MCP tool "mcp__server__tool_name" as "server: tool name". */
function titleOf(name: string): string {
  const mcp = /^mcp__(.+?)__(.+)$/.exec(name)
  if (mcp !== null) return `${mcp[1] ?? ''}: ${words(mcp[2] ?? '')}`
  const text = words(name)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** The longest start of `text` of at most `units` UTF-16 units that splits no character, such as an emoji. */
function cut(text: string, units: number): string {
  let kept = ''
  for (const char of text) {
    if (kept.length + char.length > units) break
    kept += char
  }
  return kept
}

/** The kind, title and label of a call to `name` with `input`. */
export function toolLabel(name: string, input: unknown): { kind: ToolKind; title: string; label: string } {
  const known = kinds[name]
  const kind = known?.kind ?? (name.startsWith('mcp__') ? 'mcp' : 'other')
  const title = (known?.title ?? titleOf(name)).slice(0, 100)
  const parsed = Input.safeParse(input)
  const description = parsed.success ? (parsed.data.description ?? '') : ''
  // One line: the first line only, with no control character.
  const line = description.split(/\r?\n/, 1)[0] ?? ''
  const label = line.replace(/\p{Cc}/gu, '').trim()
  return {
    kind,
    title: title === '' ? 'Used a tool' : title,
    label: label.length > maxLabel ? `${cut(label, maxLabel - 1)}…` : label,
  }
}
