// A transcript's entries as the page draws them (R32, the owner's "these tool
// messages aren't great like send message bash macro etc."): each run of two
// or more tool calls that carry a kind (a live call, backend #371) between two
// other entries is one group, drawn as one row with a summary of its kinds and
// counts in order, such as "Ran 3 commands, read 2 files, edited 1 file". A run
// of one call is its own row, and a call without a kind (a fixture, an older
// server) is never grouped: it draws as before. Pure.
import type { ToolKind } from '@bridge/contract'
import type { ChatEntry } from '../types.ts'

/** A tool call that carries its kind: a live call from a server with backend #371. */
export type KindedTool = Extract<ChatEntry, { type: 'tool' }> & { kind: ToolKind }

/** One item of a transcript: an entry as it is, or a group of two or more calls. `index` is its first entry's place. */
export type TranscriptItem =
  | { readonly type: 'entry'; readonly index: number; readonly entry: ChatEntry }
  | { readonly type: 'tools'; readonly index: number; readonly calls: readonly KindedTool[] }

const isKinded = (entry: ChatEntry): entry is KindedTool => entry.type === 'tool' && entry.kind !== undefined

/** The items of `entries`: each run of two or more kinded calls as one group, every other entry as it is. */
export function transcriptItems(entries: readonly ChatEntry[]): TranscriptItem[] {
  const items: TranscriptItem[] = []
  let run: KindedTool[] = []
  let start = 0
  const flush = () => {
    const [only] = run
    if (run.length === 1 && only !== undefined) items.push({ type: 'entry', index: start, entry: only })
    else if (run.length > 1) items.push({ type: 'tools', index: start, calls: run })
    run = []
  }
  entries.forEach((entry, i) => {
    if (isKinded(entry)) {
      if (run.length === 0) start = i
      run.push(entry)
      return
    }
    flush()
    items.push({ type: 'entry', index: i, entry })
  })
  flush()
  return items
}

/** The summary's part for each kind: MCP and other tools count together as "tools". */
type Part = Exclude<ToolKind, 'mcp' | 'other'> | 'tools'

const plural = (n: number, one: string, many: string) => `${String(n)} ${n === 1 ? one : many}`

const phrases: Record<Part, (n: number) => string> = {
  shell: (n) => `ran ${plural(n, 'command', 'commands')}`,
  read: (n) => `read ${plural(n, 'file', 'files')}`,
  edit: (n) => `edited ${plural(n, 'file', 'files')}`,
  search: (n) => `made ${plural(n, 'search', 'searches')}`,
  web: (n) => `made ${plural(n, 'web request', 'web requests')}`,
  agent: (n) => `started ${plural(n, 'agent', 'agents')}`,
  message: (n) => `sent ${plural(n, 'message', 'messages')}`,
  plan: (n) => `made ${plural(n, 'plan update', 'plan updates')}`,
  tools: (n) => `used ${plural(n, 'tool', 'tools')}`,
}

const partOf = (kind: ToolKind): Part => (kind === 'mcp' || kind === 'other' ? 'tools' : kind)

/** The group's summary: each kind's count in the order the kind first came, such as "Ran 3 commands, read 2 files". */
export function toolSummary(calls: readonly KindedTool[]): string {
  const counts = new Map<Part, number>()
  for (const call of calls) {
    const part = partOf(call.kind)
    counts.set(part, (counts.get(part) ?? 0) + 1)
  }
  const text = [...counts].map(([part, n]) => phrases[part](n)).join(', ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
