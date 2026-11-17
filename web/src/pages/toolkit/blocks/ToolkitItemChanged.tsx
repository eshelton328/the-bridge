// When an open item changed, such as "changed 6 days ago", in mono (D3
// 457:51): after the path badge on the desktop and a tablet, and after the
// kind badge on the phone (M2 429:302). Nothing when it is empty. Props only.
import { css } from '../../../../styled-system/css/index.js'

const changedText = css({ textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap' })

export type ToolkitItemChangedProps = {
  /** When the item changed; none when empty. */
  changed: string
}

export function ToolkitItemChanged({ changed }: ToolkitItemChangedProps) {
  return changed === '' ? null : <span className={changedText}>{changed}</span>
}
