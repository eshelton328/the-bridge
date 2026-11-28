// The Overview's Context drift panel (R9, NCC-131; D01, T01, T01b, M01): the
// heading with the findings' count and Run check, then a Panel with the last
// check's time and scope and a row for each finding. Props only.
import { Button, ListRow, PageHeader, Panel, RefreshIcon, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ProjectDrift } from '../types.ts'

const base = { gridColumn: '[1 / -1]', display: 'flex', flexDirection: 'column', gap: '16', minW: '[0]' } as const
// D01 draws the heading 28 under the panels above: the grid's 20 and 8 more. M01 draws it 20 under
// the Queue: the grid's 24 and 4 less.
const panel = { desktop: css({ ...base, mt: '8' }), tablet: css(base), phone: css({ ...base, mt: '-4' }) }
// The heading row as the Inbox and Queue panels have it: 32 high (44 on touch).
const head = {
  desktop: css({ display: 'flex', alignItems: 'center', minH: 'control.md', '& > *': { flex: '1' } }),
  touch: css({ display: 'flex', alignItems: 'center', minH: 'control.xl', '& > *': { flex: '1' } }),
}
// The line starts where the rows' text does: their 10 side, 4 with the phone's sides.
const line = css({ textStyle: 'small', color: 'fg.muted', px: '10' })
const phoneLine = css({ textStyle: 'small', color: 'fg.muted', px: '4' })

export type ContextDriftProps = {
  drift: ProjectDrift
  layout: Viewport
  /** Run check was pressed; without it (a state) Run check does nothing. */
  onRun?: (() => void) | undefined
}

export function ContextDrift({ drift, layout, onRun }: ContextDriftProps) {
  const busy = drift.busy === true
  return (
    <section className={panel[layout]} aria-label={drift.title} aria-busy={busy} data-figma="context drift">
      <div className={layout === 'desktop' ? head.desktop : head.touch}>
        <PageHeader title={drift.title} count={drift.findings.length} level={2} size="pane">
          <span data-figma="button · Run check">
            <Button variant="secondary" size={layout === 'desktop' ? 'md' : 'lg'} disabled={busy} onClick={onRun}>
              <RefreshIcon />
              {busy ? drift.running : drift.run}
            </Button>
          </span>
        </PageHeader>
      </div>
      <Panel>
        <Stack gap="4">
          {drift.checked === undefined ? null : (
            <p className={layout === 'phone' ? phoneLine : line}>
              <span>{drift.checked}</span>
              {drift.scope === undefined ? null : `. ${drift.scope}`}
            </p>
          )}
          {drift.findings.length === 0 ? null : (
            <Stack gap="0">
              {drift.findings.map((text) => (
                <ListRow
                  key={text}
                  density="compact"
                  padding={layout === 'phone' ? 'phoneSides' : undefined}
                  title={text}
                />
              ))}
            </Stack>
          )}
          {drift.empty === undefined ? null : <p className={layout === 'phone' ? phoneLine : line}>{drift.empty}</p>}
          {drift.notRead === undefined ? null : (
            <p role="status" className={layout === 'phone' ? phoneLine : line}>
              {drift.notRead}
            </p>
          )}
        </Stack>
      </Panel>
    </section>
  )
}
