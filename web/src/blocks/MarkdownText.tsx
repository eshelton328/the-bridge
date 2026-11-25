// Markdown text as the app renders it, in a chat's transcript (Workspaces
// EntryText) and in a brain item's record (Inbox LiveDetail): react-markdown
// with GitHub's extensions (remark-gfm: tables, strikethrough, task lists
// and autolinks, review R51), inside the caller's MarkdownView. HTML in the
// text stays text. A link is a link only with an http, https or mailto URL,
// and opens in a new tab (review R56): a bare URL, a `www.` link (which
// remark-gfm gives `http://`) and a bare email become links, the `www.` one
// to https; a link with any other URL (`javascript:`, `data:`, a relative
// path) stays plain text. MarkdownView draws a link in the accent colour, underlined,
// and breaks a long URL anywhere, so it wraps in its column. An image shows
// its alt text, so the text loads nothing from another site. A task list's
// box is named by its state ("Task done", "Task not done"). A table is the
// library's Table part (`markdownTableParts.ts`) at the caller's `size`, the
// size of its MarkdownView. A GitHub alert (`> [!NOTE]`) is the library's
// Callout (`remarkCallout.ts`, `MarkdownQuote.tsx`). A live chat's name
// becomes a mention that opens the chat (remarkChatMentions.ts), with the
// chats from MarkdownChatsContext. A fenced code block is the library's
// MarkdownCodeBlock (`MarkdownCodeFence.tsx`: its label, syntax colours,
// sideways scroll, a diff's tints, a fold and Copy with `onCopyCode`). The
// plugins are one list and the element overrides one map per size, so a
// later plugin (math, diagrams) adds an entry to each. TeX (`$…$`, `$$…$$`)
// draws with KaTeX (`useMathPlugins.ts`, `MathFormula.tsx`). The caller wraps it
// in a BlockBoundary.
import type { ReactNode } from 'react'
import Markdown, { type Components, type ExtraProps, type Options } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChatMention } from './ChatMention.tsx'
import { type CopyCode, MarkdownCodeFence } from './MarkdownCodeFence.tsx'
import { MarkdownChatsContext } from './markdownChats.ts'
import { MathFormula } from './MathFormula.tsx'
import { codeOf } from './fence.ts'
import { MarkdownQuote } from './MarkdownQuote.tsx'
import { type MarkdownSize, markdownTableParts } from './markdownTableParts.ts'
import { remarkCallout } from './remarkCallout.ts'
import { remarkChatMentions } from './remarkChatMentions.ts'
import { useMathPlugins } from './useMathPlugins.ts'

const remarkPlugins: NonNullable<Options['remarkPlugins']> = [remarkGfm, remarkCallout]

/** The length of the Markdown source a link came from, or undefined when the parser gave no position. */
const sourceLength = (node: ExtraProps['node']): number | undefined => {
  const start = node?.position?.start.offset
  const end = node?.position?.end.offset
  return start === undefined || end === undefined ? undefined : end - start
}

/**
 * The URL a link opens, or undefined when it is not http, https or mailto. A bare `www.` autolink goes to https: its
 * source is its text alone, where a Markdown link `[www.…](http://www.…)` keeps the URL its author wrote.
 */
function linkUrl(href: string | undefined, children: ReactNode, node: ExtraProps['node']): string | undefined {
  if (href === undefined) return undefined
  const www =
    typeof children === 'string' &&
    children.startsWith('www.') &&
    href === `http://${children}` &&
    sourceLength(node) === children.length
  const url = www ? `https://${children}` : href
  return /^(https?:\/\/|mailto:)/i.test(url) ? url : undefined
}

const inline: Components = {
  a: ({ href, children, node }) => {
    const url = linkUrl(href, children, node)
    return url === undefined ? (
      children
    ) : (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  },
  img: ({ alt }) => alt ?? null,
  pre: ({ node, children }) => <MarkdownCodeFence node={node}>{children}</MarkdownCodeFence>,
  // Inline math (remark-math, for a text with a $) is a code element labelled math; any other code stays code.
  code: ({ node, children, ...props }) => {
    const code = codeOf(node)
    return code?.language === 'math' ? (
      <MathFormula tex={code.code} display={false} />
    ) : (
      <code {...props}>{children}</code>
    )
  },
  // remark-gfm writes a task list's box with no label (axe: label); the box is read-only, so its name is its state.
  input: ({ type, checked, disabled }) => (
    <input
      type={type}
      checked={checked}
      disabled={disabled}
      readOnly
      aria-label={type === 'checkbox' ? (checked === true ? 'Task done' : 'Task not done') : undefined}
    />
  ),
}

// The mention plugin's element (remarkChatMentions.ts), which is not an HTML element, so `Components` has no key for it.
const mentionParts = { 'chat-mention': ChatMention }

const components: Record<MarkdownSize, Components> = {
  md: {
    ...inline,
    ...mentionParts,
    ...markdownTableParts.md,
    blockquote: ({ node, children }) => (
      <MarkdownQuote node={node} size="md">
        {children}
      </MarkdownQuote>
    ),
  },
  sm: {
    ...inline,
    ...mentionParts,
    ...markdownTableParts.sm,
    blockquote: ({ node, children }) => (
      <MarkdownQuote node={node} size="sm">
        {children}
      </MarkdownQuote>
    ),
  },
}

// The maps with a Copy, one pair per copy callback: a page passes one stable callback, so each code block keeps its
// component across renders. The Copy is a prop, never a context, as the Claude Design canvas runs React 18 (Codex
// review of #511).
const withCopy = new WeakMap<CopyCode, Record<MarkdownSize, Components>>()

function componentsFor(size: MarkdownSize, onCopy: CopyCode | undefined): Components {
  if (onCopy === undefined) return components[size]
  let maps = withCopy.get(onCopy)
  if (maps === undefined) {
    const pre: Components['pre'] = ({ node, children }) => (
      <MarkdownCodeFence node={node} onCopy={onCopy}>
        {children}
      </MarkdownCodeFence>
    )
    maps = { md: { ...components.md, pre }, sm: { ...components.sm, pre } }
    withCopy.set(onCopy, maps)
  }
  return maps[size]
}

export type MarkdownTextProps = {
  /** The text, as Markdown. */
  text: string
  /** The size of the MarkdownView around it, for a table's text: `md` (the default) or `sm`. */
  size?: MarkdownSize | undefined
  /** Copies a code block's code (the page's copyText); without it a code block has no copy button. */
  onCopyCode?: CopyCode | undefined
}

type PluginList = NonNullable<Options['remarkPlugins']>

/** The base plugins with the math plugins, one array per math list, so a render with the same list keeps it. */
const withMath = new WeakMap<PluginList, PluginList>()
/** The plugins for a chats map, one array per base list and map, so a render with the same map keeps them. */
const pluginsByChats = new WeakMap<PluginList, WeakMap<ReadonlyMap<string, string>, PluginList>>()

/** Math first (remark-math is a syntax extension), then the mentions, so a formula is never a mention. */
const pluginsFor = (chats: ReadonlyMap<string, string>, math: PluginList): PluginList => {
  let base = remarkPlugins
  if (math.length > 0) {
    base = withMath.get(math) ?? [...remarkPlugins, ...math]
    withMath.set(math, base)
  }
  if (chats.size === 0) return base
  const byChats = pluginsByChats.get(base) ?? new WeakMap<ReadonlyMap<string, string>, PluginList>()
  pluginsByChats.set(base, byChats)
  const known = byChats.get(chats)
  if (known !== undefined) return known
  const plugins: PluginList = [...base, [remarkChatMentions, chats]]
  byChats.set(chats, plugins)
  return plugins
}

// The context is read with its Consumer, not `use` or useContext: the canvas runs React 18, which has no `use`.
// useMathPlugins uses only hooks React 18 has.
export function MarkdownText({ text, size = 'md', onCopyCode }: MarkdownTextProps) {
  const math = useMathPlugins(text)
  return (
    <MarkdownChatsContext.Consumer>
      {({ chats }) => (
        <Markdown remarkPlugins={pluginsFor(chats, math.plugins)} components={componentsFor(size, onCopyCode)}>
          {math.text}
        </Markdown>
      )}
    </MarkdownChatsContext.Consumer>
  )
}
