// An open item's path row (D3 457:45): the path badge, whose copy button
// copies the path, then when the item changed in mono. Props only.
import { CopyIcon, FileIcon, FolderIcon, PathBadge } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

// D3 457:45: the path badge, then when it changed in mono, 10 apart.
const pathRow = css({ display: 'flex', alignItems: 'center', alignSelf: 'flex-start', gap: '10' })
const changedText = css({ textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap' })
// D3 457:50: the copy icon is a bare 12 px icon inside the badge; the library's smallest button is 24 high.
const copy = css({
  display: 'inline-flex',
  p: '0',
  color: 'fg.muted',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  _hover: { color: 'fg.default' },
  _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
})

export type ToolkitItemPathProps = {
  /** The item's path, such as "toolkit/skills/writer/". */
  location: string
  /** When the item changed, such as "changed 6 days ago"; none when empty. */
  changed: string
  /** Called with the path when its copy button is pressed. */
  onCopyPath?: ((path: string) => void) | undefined
}

export function ToolkitItemPath({ location, changed, onCopyPath }: ToolkitItemPathProps) {
  return (
    <div className={pathRow} data-figma="path row">
      <div data-figma="path badge">
        <PathBadge
          path={location}
          // A folder's path ends with "/" (D3 457:47); a file's shows the file icon (D4 457:56).
          icon={location.endsWith('/') ? <FolderIcon /> : <FileIcon />}
          trailing={
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
          }
        />
      </div>
      {changed === '' ? null : <span className={changedText}>{changed}</span>}
    </div>
  )
}
