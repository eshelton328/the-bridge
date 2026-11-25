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
// size of its MarkdownView. The caller wraps it in a BlockBoundary. Props
// only.
import type { ReactNode } from 'react'
import Markdown, { type Components, type ExtraProps } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { type MarkdownSize, markdownTableParts } from './markdownTableParts.ts'

const remarkPlugins = [remarkGfm]

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

const components: Record<MarkdownSize, Components> = {
  md: { ...inline, ...markdownTableParts.md },
  sm: { ...inline, ...markdownTableParts.sm },
}

export type MarkdownTextProps = {
  /** The text, as Markdown. */
  text: string
  /** The size of the MarkdownView around it, for a table's text: `md` (the default) or `sm`. */
  size?: MarkdownSize | undefined
}

export function MarkdownText({ text, size = 'md' }: MarkdownTextProps) {
  return (
    <Markdown remarkPlugins={remarkPlugins} components={components[size]}>
      {text}
    </Markdown>
  )
}
