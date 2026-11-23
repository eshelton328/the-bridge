// Markdown text as the app renders it, in a chat's transcript (Workspaces
// EntryText) and in a brain item's record (Inbox LiveDetail): react-markdown
// with GitHub's extensions (remark-gfm: tables, strikethrough, task lists
// and autolinks, review R51), inside the caller's MarkdownView. HTML in the
// text stays text, and a link keeps only a safe URL (react-markdown's
// `defaultUrlTransform`: http, https, mailto and a few more; a
// `javascript:` URL becomes empty) and opens in a new tab. An image shows
// its alt text, so the text loads nothing from another site. A task list's
// box is named by its state ("Task done", "Task not done"). A table is the
// library's Table part (`markdownTableParts.ts`) at the caller's `size`, the
// size of its MarkdownView. The caller wraps it in a BlockBoundary. Props
// only.
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { type MarkdownSize, markdownTableParts } from './markdownTableParts.ts'

const remarkPlugins = [remarkGfm]

const inline: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
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
