// A remark plugin that turns a chat's name in a message's text into a
// mention: a link that opens that chat (MarkdownText draws it as the
// library's MentionChip). It links only a name the caller's map knows, the
// titles of the live chats. `@name` links any known title; a title without
// the `@` links only when it has a hyphen or a space, such as
// `bridge-coord`, so a one-word title such as "routing" stays a word in
// plain prose. A title two chats share links nothing, as it names no one
// chat. Code, inline code and the text of a link stay as they are; a name
// inside a longer word or a path (`bridge-coord.md`, `bridge-coord/`)
// stays text. The match ignores case.

/** The parts of an mdast node the plugin reads and writes. */
type MdNode = {
  type: string
  value?: string
  children?: MdNode[]
  data?: { hName?: string; hProperties?: Record<string, string> }
}

/** A mention's node: MarkdownText draws `chat-mention` with its `chat` (the chat ID) and `name` (the title). */
const mention = (chat: string, name: string, text: string): MdNode => ({
  type: 'chatMention',
  data: { hName: 'chat-mention', hProperties: { chat, name } },
  children: [{ type: 'text', value: text }],
})

/** Nodes whose text never becomes a mention. */
const skipped = new Set(['link', 'linkReference', 'inlineCode', 'code', 'html', 'chatMention'])

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** A title that links without `@`: it has a hyphen or a space between words. */
const bareTitle = (title: string) => /\S[-\s]\S/.test(title)

/**
 * The map from a lower-case title to its chat ID, without the titles two chats share. `chats` maps each chat ID to
 * its title.
 */
export function mentionIndex(chats: ReadonlyMap<string, string>): ReadonlyMap<string, string> {
  const byTitle = new Map<string, string | null>()
  for (const [chat, title] of chats) {
    const key = title.trim().toLowerCase()
    if (key === '') continue
    byTitle.set(key, byTitle.has(key) ? null : chat)
  }
  const out = new Map<string, string>()
  for (const [key, chat] of byTitle) if (chat !== null) out.set(key, chat)
  return out
}

/** The pattern of a mention: group 1 is `@` or empty, group 2 the title. Longer titles first, so the whole name wins. */
function mentionPattern(titles: readonly string[]): RegExp | undefined {
  if (titles.length === 0) return undefined
  const names = [...titles].sort((a, b) => b.length - a.length).map(escape)
  return new RegExp(`(?<![\\w@./-])(@?)(${names.join('|')})(?![\\w/-]|\\.\\w)`, 'giu')
}

function splitText(value: string, pattern: RegExp, index: ReadonlyMap<string, string>): MdNode[] | undefined {
  const out: MdNode[] = []
  let last = 0
  for (const match of value.matchAll(pattern)) {
    const [whole, at = '', name = ''] = match
    const chat = index.get(name.toLowerCase())
    if (chat === undefined || (at === '' && !bareTitle(name))) continue
    if (match.index > last) out.push({ type: 'text', value: value.slice(last, match.index) })
    out.push(mention(chat, name, whole))
    last = match.index + whole.length
  }
  if (out.length === 0) return undefined
  if (last < value.length) out.push({ type: 'text', value: value.slice(last) })
  return out
}

function walk(node: MdNode, pattern: RegExp, index: ReadonlyMap<string, string>): void {
  const children = node.children
  if (children === undefined) return
  node.children = children.flatMap((child) => {
    if (skipped.has(child.type)) return [child]
    if (child.type === 'text' && child.value !== undefined) return splitText(child.value, pattern, index) ?? [child]
    walk(child, pattern, index)
    return [child]
  })
}

/** The plugin, for `remarkPlugins`: `[remarkChatMentions, chats]`, where `chats` maps each chat ID to its title. */
export function remarkChatMentions(chats: ReadonlyMap<string, string>) {
  const index = mentionIndex(chats)
  const pattern = mentionPattern([...index.keys()])
  return (tree: MdNode) => {
    if (pattern !== undefined) walk(tree, pattern, index)
  }
}
