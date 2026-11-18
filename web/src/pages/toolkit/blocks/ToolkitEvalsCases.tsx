// The cases panel of the Evals tab (Figma `panel · cases`, D20 482:1956):
// the header (the label with the count of the cases, and what the scores
// are), one row for each case (`case · artifact-defines-ids` 482:1961: its
// name in mono at the start and its scores at the end, muted) and a line
// under them. An agent's drafts (D26) and a hook's test groups (D28) use the
// same panel. The library has no table of name and value rows
// (LIBRARY_GAPS.md, Evals panels), so the rows are a list styled with tokens.
// Props only.
import { Panel } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitEvals } from '../types.ts'
import { casesLabel } from './evalsView.ts'
import { ToolkitEvalsHeader } from './ToolkitEvalsHeader.tsx'

// D20 482:1961: the rows 25 apart (17 high, 8 apart). The mono style is 16 high (d-072) and no space token has 9, so
// the rows are 8 and 10 apart in turn: 25 apart on average, each row within 1 px of Figma's.
const rows = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8',
  listStyle: 'none',
  m: '0',
  p: '0',
  '& > :nth-child(even)': { mt: '2' },
})
const row = css({ display: 'flex', alignItems: 'center', gap: '8', minW: '[0]' })
const name = css({ textStyle: 'mono', color: 'fg.default', minW: '[0]' })
const value = css({ ms: 'auto', textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap' })
// D20 482:1981: the line is 8 under the last row in Figma; the header is 1 px shorter in the render and the last row
// 1 px higher, so 2 more.
const note = css({ textStyle: 'small', color: 'fg.muted', mt: '2' })

export type ToolkitEvalsCasesProps = { cases: NonNullable<ToolkitEvals['cases']> }

export function ToolkitEvalsCases({ cases }: ToolkitEvalsCasesProps) {
  const label = casesLabel(cases)
  return (
    <section aria-label={label} data-figma="panel · cases">
      <Panel>
        <ToolkitEvalsHeader label={label} end={{ type: 'note', label: cases.meta }} />
        <ul className={rows}>
          {cases.rows.map((r) => (
            <li key={r.name} className={row} data-figma={`case · ${r.name}`}>
              <span className={name}>{r.name}</span>
              <span className={value}>{r.value}</span>
            </li>
          ))}
        </ul>
        {cases.note === undefined ? null : <p className={note}>{cases.note}</p>}
      </Panel>
    </section>
  )
}
