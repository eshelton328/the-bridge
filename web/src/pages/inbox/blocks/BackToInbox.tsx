// The Back row at the top of an open item on a tablet or phone (T2 to T4
// 346:5678): the chevron and "Inbox", which returns to the list, above the
// task bar. Props only; the page entry closes the item.
import { BackRow } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

// Figma: the row 41 to 73 and the task bar at 83, 42 apart. The library's BackRow is 28 high (control.sm), so
// 12 below it puts the task bar 40 below the row's top.
const row = css({ mb: '12' })

export function BackToInbox({ onBack }: { onBack?: (() => void) | undefined }) {
  return (
    <div className={row} data-figma="nav · back">
      <BackRow label="Inbox" onBack={onBack} />
    </div>
  )
}
