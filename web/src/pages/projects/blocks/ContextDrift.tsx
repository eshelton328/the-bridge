// The Overview's Context drift panel (R9, NCC-131): the last `ncc check` and
// Run check, in a plain layout, as no frame draws it yet. Props only.
import { Button, ListRow, PageHeader, Panel, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ProjectDrift } from '../types.ts'

const panel = css({ gridColumn: '[1 / -1]', display: 'flex', flexDirection: 'column', gap: '16', minW: '[0]' })
// The heading row as the Inbox and Queue panels have it: 32 high (44 on touch).
const head = {
  desktop: css({ display: 'flex', alignItems: 'center', minH: 'control.md' }),
  touch: css({ display: 'flex', alignItems: 'center', minH: 'control.xl' }),
}
const line = css({ textStyle: 'small', color: 'fg.muted', px: '10' })

export type ContextDriftProps = {
  drift: ProjectDrift
  layout: Viewport
  /** Run check was pressed; without it Run check is off. */
  onRun?: (() => void) | undefined
}

export function ContextDrift({ drift, layout, onRun }: ContextDriftProps) {
  const busy = drift.busy === true
  return (
    <section className={panel} aria-label={drift.title} aria-busy={busy} data-figma="context drift">
      <div className={layout === 'desktop' ? head.desktop : head.touch}>
        <PageHeader title={drift.title} count={drift.findings.length} level={2} size="pane">
          <Button size={layout === 'desktop' ? 'md' : 'lg'} disabled={busy || onRun === undefined} onClick={onRun}>
            {busy ? drift.running : drift.run}
          </Button>
        </PageHeader>
      </div>
      <Panel>
        <Stack gap="4">
          {drift.checked === undefined ? null : <p className={line}>{drift.checked}</p>}
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
          {drift.empty === undefined ? null : <p className={line}>{drift.empty}</p>}
          {drift.notRead === undefined ? null : (
            <p role="status" className={line}>
              {drift.notRead}
            </p>
          )}
        </Stack>
      </Panel>
    </section>
  )
}
