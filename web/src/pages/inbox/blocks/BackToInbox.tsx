// The Back row at the top of an open item on a tablet or phone (T2 to T4
// 346:5678): the chevron and "Inbox", which returns to the list, above the
// task bar. On the phone (M2 346:9231) the item's Snooze and Dismiss sit at
// the end of the row. Props only; the page entry closes the item.
import { BackRow } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'

// Figma: the row 41 to 73 and the task bar at 83, 42 apart. The library's BackRow is 28 high (control.sm), so
// 12 below it puts the task bar 40 below the row's top.
const row = css({ mb: '12' })

export type BackToInboxProps = {
  onBack?: (() => void) | undefined
  /** The item's actions at the end of the row, as the phone draws them. */
  actions?: ReactNode
}

export function BackToInbox({ onBack, actions }: BackToInboxProps) {
  // The tablet names the row "nav · back" (T2), the phone "nav" (M2).
  return (
    <div className={row} data-figma={actions === undefined ? 'nav · back' : 'nav'}>
      <BackRow label="Inbox" onBack={onBack}>
        {actions}
      </BackRow>
    </div>
  )
}
