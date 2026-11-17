// A dev-only badge in the corner that lists the reports in the ring
// buffer, in place of a runtime error overlay. Production renders nothing.
import { useState, useSyncExternalStore } from 'react'
import { Button, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../styled-system/css/index.js'
import { clearReports, getReports, subscribeReports } from './reporter.ts'

const tray = css({
  position: 'fixed',
  bottom: '12',
  right: '12',
  bg: 'surface.overlay',
  p: '8',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
})
const line = css({ textStyle: 'mono', color: 'fg.muted', m: '0' })

export function ErrorTray() {
  const reports = useSyncExternalStore(subscribeReports, getReports)
  const [open, setOpen] = useState(false)
  if (!import.meta.env.DEV || reports.length === 0) return null
  return (
    <aside className={tray} aria-label="Error reports">
      <Stack gap="8">
        <Button
          size="sm"
          variant="danger"
          onClick={() => {
            setOpen(!open)
          }}
        >
          {`${String(reports.length)} ${reports.length === 1 ? 'error' : 'errors'}`}
        </Button>
        {open ? (
          <>
            {reports.map((r) => (
              <p key={r.at + r.error.message} className={line}>
                {`${r.source} · ${r.route} · ${r.error.message}`}
              </p>
            ))}
            <Button size="sm" onClick={clearReports}>
              Clear
            </Button>
          </>
        ) : null}
      </Stack>
    </aside>
  )
}
