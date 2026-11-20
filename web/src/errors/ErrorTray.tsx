// A dev-only badge in the corner that lists the reports in the ring
// buffer, in place of a runtime error overlay. Production renders nothing.
// It sits at the window's bottom right unless that covers a composer or an
// error line; then it moves up above them, measured each frame while it
// shows (trayPlace.ts), so the phone's Send and Retry always take a tap.
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Button, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../styled-system/css/index.js'
import { clearReports, getReports, subscribeReports } from './reporter.ts'
import { keepClearBoxes, trayBottom, trayInset } from './trayPlace.ts'

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
  const shown = import.meta.env.DEV && reports.length > 0
  const trayRef = useRef<HTMLElement>(null)
  // The place follows what the page draws (a composer that grows, a line that comes, the keyboard), so it is measured
  // each frame while the tray shows. No library token gives that distance: it is a measured px value, as paneFloors.ts.
  useLayoutEffect(() => {
    if (!shown) return
    let frame = 0
    let last = trayInset
    const place = () => {
      const el = trayRef.current
      if (el !== null) {
        const box = el.getBoundingClientRect()
        const bottom = trayBottom(
          { width: box.width, height: box.height },
          { width: window.innerWidth, height: window.innerHeight },
          keepClearBoxes(el.ownerDocument, el),
        )
        if (bottom !== last) {
          last = bottom
          el.style.bottom = `${String(bottom)}px`
        }
      }
      frame = requestAnimationFrame(place)
    }
    place()
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [shown])
  if (!shown) return null
  return (
    <aside ref={trayRef} className={tray} aria-label="Error reports">
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
              <p key={r.seq} className={line}>
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
