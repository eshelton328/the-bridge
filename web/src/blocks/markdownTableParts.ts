// The elements a Markdown table renders to (GitHub's pipe tables, through
// remark-gfm), in one place: MarkdownText maps `table`, `thead`, `tbody`,
// `tr`, `th` and `td` to these. The library has no Table part yet
// (LIBRARY_GAPS.md: Table part for Markdown tables, R51), so each maps to
// its own plain element, with no style of the app's; the release that
// brings the part maps them to it here, and nowhere else.
import type { Components } from 'react-markdown'

export const markdownTableParts = {
  table: 'table',
  thead: 'thead',
  tbody: 'tbody',
  tr: 'tr',
  th: 'th',
  td: 'td',
} as const satisfies Components
