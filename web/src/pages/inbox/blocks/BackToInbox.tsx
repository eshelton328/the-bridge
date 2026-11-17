// The Back row at the top of an open item on a tablet or phone (T2 to T4
// 346:5678): the chevron and "Inbox", which returns to the list, above the
// task bar. On the phone (M2 346:9231) the item's Snooze and Dismiss sit at
// the end of the row. Props only; the page entry closes the item.
import { BackRow } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'

// Figma (T2 346:5677): the row 41 to 73, the task frame 4 under it, and the task bar 6 inside the task frame (its
// top padding), at 83: 42 below the row's top. The library's BackRow is 28 high (control.sm), so 6 below it and the
// task's own 6 put the task bar 40 below the row's top; the task frame starts 2 above Figma's.
const row = css({ mb: '6' })
// The phone's nav (M2 346:9231, M5 346:9851) is 40 high: its 32 px buttons 4 in from the top and bottom, and the task
// 2 under it (M5 346:9866 at 84). With 12 under a 32 px row the task started 2 lower and the buttons 4 higher.
const phoneRow = css({ py: '4', mb: '2' })

export type BackToInboxProps = {
  onBack?: (() => void) | undefined
  /** The item's actions at the end of the row, as the phone draws them. */
  actions?: ReactNode
}

export function BackToInbox({ onBack, actions }: BackToInboxProps) {
  // The tablet names the row "nav · back" (T2), the phone "nav" (M2).
  return (
    <div className={actions === undefined ? row : phoneRow} data-figma={actions === undefined ? 'nav · back' : 'nav'}>
      <BackRow label="Inbox" onBack={onBack}>
        {actions}
      </BackRow>
    </div>
  )
}
