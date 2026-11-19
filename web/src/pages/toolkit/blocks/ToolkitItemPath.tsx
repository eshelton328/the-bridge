// An open item's path row (D3 457:45): the path badge, whose copy button
// copies the path, then when the item changed in mono. On the phone (M2
// 457:188) the row holds only the badge, and when it changed moves to the
// meta row (`ToolkitItemChanged`). A file on its own page on the phone (M6
// 435:493) names the file in the badge with its icon and no copy button,
// since the back row holds the copy button. Props only.
import { CopyIcon, FileIcon, FolderIcon, PathBadge, focusRing } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import { ToolkitItemChanged } from './ToolkitItemChanged.tsx'

// D3 457:45: the path badge, then when it changed in mono, 10 apart.
const pathRow = css({ display: 'flex', alignItems: 'center', alignSelf: 'flex-start', gap: '10' })
// D3 457:50: the copy icon is a bare 12 px icon inside the badge; the library's smallest button is 24 high.
const copy = css({
  display: 'inline-flex',
  p: '0',
  color: 'fg.muted',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  _hover: { color: 'fg.default' },
  outline: 'none',
  [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
})

export type ToolkitItemPathProps = {
  /** The item's path, such as "toolkit/skills/writer/". */
  location: string
  /** When the item changed, such as "changed 6 days ago"; none when empty. */
  changed: string
  /** Called with the path when its copy button is pressed. */
  onCopyPath?: ((path: string) => void) | undefined
  /** The row's Figma layer: `path row` (D3, T3); `null` on the phone (M2), whose badge has no row around it. */
  layer?: string | null | undefined
  /** The badge's icon; a folder's or a file's by the path when not set (M6: a script's code icon). */
  icon?: ReactNode
  /** Whether the badge ends with the copy button; not on a file's own page on the phone (M6). */
  copyable?: boolean | undefined
}

export function ToolkitItemPath({
  location,
  changed,
  onCopyPath,
  layer = 'path row',
  icon,
  copyable = true,
}: ToolkitItemPathProps) {
  return (
    <div className={pathRow} data-figma={layer ?? undefined}>
      <div data-figma="path badge">
        <PathBadge
          path={location}
          // A folder's path ends with "/" (D3 457:47); a file's shows the file icon (D4 457:56).
          icon={icon ?? (location.endsWith('/') ? <FolderIcon /> : <FileIcon />)}
          trailing={
            copyable ? (
              <button
                type="button"
                className={copy}
                aria-label={`Copy ${location}`}
                onClick={() => {
                  onCopyPath?.(location)
                }}
              >
                <CopyIcon />
              </button>
            ) : undefined
          }
        />
      </div>
      <ToolkitItemChanged changed={changed} />
    </div>
  )
}
