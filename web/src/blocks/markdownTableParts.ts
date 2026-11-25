// The elements a Markdown table renders to (GitHub's pipe tables, through
// remark-gfm), in one place: MarkdownText maps `table`, `thead`, `tbody`,
// `tr`, `th` and `td` to the library's Table part (review R51). Its frame
// scrolls a wide table sideways inside the text's column, so the page never
// does, and a column is never narrower than its longest word. The table's
// text size matches the MarkdownView around it: `sm` in the Inbox record,
// `md` in a chat's transcript.
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@eshelton328/component-library-1701'
import { createElement } from 'react'
import type { Components } from 'react-markdown'

/** The text size of a MarkdownView, and so of a table in it. */
export type MarkdownSize = 'md' | 'sm'

const partsOf = (size: MarkdownSize) =>
  ({
    table: (props) => createElement(Table, { ...props, size }),
    thead: TableHead,
    tbody: TableBody,
    tr: TableRow,
    th: TableHeaderCell,
    td: TableCell,
  }) satisfies Components

export const markdownTableParts = { md: partsOf('md'), sm: partsOf('sm') } as const
