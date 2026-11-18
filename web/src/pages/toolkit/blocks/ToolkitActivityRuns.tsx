// The runs in progress of the Activity view: on the desktop a `Panel` with
// its header (Figma `panel · RUNNING NOW`, D11 444:521: the label in
// capitals and "sample data" at its end) over the rows 8 apart; on a tablet
// or phone the label and the note as one line (T9 449:262), the rows and the
// hint under them (449:297), each a part of the view's column. Props only.
import { Panel } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitActivityCounts } from '../types.ts'
import { panelLayer } from './activityPage.ts'
import { ToolkitEvalsHeader } from './ToolkitEvalsHeader.tsx'
import { ToolkitRunRow } from './ToolkitRunRow.tsx'

// D11 444:520: the two panels of a row are as tall as the taller: the row's grid stretches the section,
// and its Panel grows to fill it (a section Panel is as tall as its content); no wider content widens it.
const fill = css({ display: 'flex', flexDirection: 'column', minW: '[0]', '& > *': { flexGrow: '1' } })

// D11 444:526 to 444:563: the rows 8 apart, 8 under the header; T9 449:263 to 449:286 12 apart; M10 10 apart.
const rows = {
  desktop: css({ display: 'flex', flexDirection: 'column', gap: '8', listStyle: 'none', m: '0', p: '0' }),
  tablet: css({ display: 'flex', flexDirection: 'column', gap: '12', listStyle: 'none', m: '0', p: '0' }),
  phone: css({ display: 'flex', flexDirection: 'column', gap: '10', listStyle: 'none', m: '0', p: '0' }),
}
const body = css({ display: 'flex', flexDirection: 'column', gap: '8' })
const label = css({ textStyle: 'monoCaps', color: 'fg.muted', m: '0' })
const hint = css({ textStyle: 'small', color: 'fg.muted', m: '0' })

export type ToolkitActivityRunsProps = {
  running: ToolkitActivityCounts['running']
  layout: Viewport
  /** The id of the open run, whose row is selected. */
  open?: string | undefined
  onOpen?: ((id: string) => void) | undefined
}

export function ToolkitActivityRuns({ running, layout, open, onOpen }: ToolkitActivityRunsProps) {
  const list = (
    <ul className={rows[layout]} aria-label={running.label}>
      {running.rows.map((r) => (
        <ToolkitRunRow
          key={r.id}
          run={r}
          layout={layout}
          status={running.status}
          open={running.open}
          selected={r.id === open}
          onOpen={onOpen}
        />
      ))}
    </ul>
  )
  if (layout === 'desktop') {
    return (
      <section className={fill} aria-label={running.label} data-figma={panelLayer(running.label, layout)}>
        <Panel>
          <div className={body}>
            <ToolkitEvalsHeader level={2} label={running.label} end={{ type: 'note', label: running.meta }} />
            {list}
          </div>
        </Panel>
      </section>
    )
  }
  return (
    <>
      <h2 className={label}>{`${running.label} · ${running.meta}`}</h2>
      {list}
      {running.hint === undefined ? null : <p className={hint}>{running.hint}</p>}
    </>
  )
}
