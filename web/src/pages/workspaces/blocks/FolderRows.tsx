// The chat's folders (D4 128:405, M8 128:716): the working folder with its
// note, the folders added since, each with a remove ×, and Add folder, which
// opens the folder picker. The folders control's list (D4) and the phone's
// folders sheet (M8) draw them. No list row of the library has a mono path
// with an end note or a remove button, so each row is a `Button`
// (LIBRARY_GAPS.md: Folder list). Props only.
import { Button, CloseIcon, FolderIcon, PlusIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ChatFolders } from '../types.ts'

// D4's Figma layers of the folder rows, in order, and of Add folder.
const d4 = { rows: ['128:410', '128:416'], add: '128:424' }

// On a row's raised fill fg.subtle falls below 4.5:1, so the note there is fg.muted.
const note = css({ textStyle: 'mono', color: 'fg.muted' })
// A row spreads its folder and its note or remove mark over the list's width.
const row = css({ w: '[100%]', justifyContent: 'flex-start' })
// M8 128:717: the working folder's icon is in the accent colour.
const accentIcon = css({ display: 'inline-flex', color: 'accent.default' })
const path = css({ textStyle: 'mono', color: 'fg.default', flex: '1', textAlign: 'start' })

export type FolderRowsProps = {
  folders: ChatFolders
  /** Called when Erik presses Add folder. */
  onAdd?: (() => void) | undefined
  /** The Figma layers of the folder rows, in order, and of Add folder; D4's when not set. */
  layers?: { rows: readonly string[]; add: string } | undefined
  /** Draw the working folder's icon in the accent colour, as the phone's folders sheet does (M8 128:717). */
  accent?: boolean | undefined
}

export function FolderRows({ folders, onAdd, layers = d4, accent = false }: FolderRowsProps) {
  return (
    <>
      {folders.items.map((folder, i) =>
        i === 0 ? (
          <Button key={folder} size="lg" className={row} data-figma={layers.rows[i]}>
            {accent ? (
              <span className={accentIcon}>
                <FolderIcon size="16" />
              </span>
            ) : (
              <FolderIcon size="16" />
            )}
            <span className={path}>{folder}</span>
            <span className={note}>{folders.working}</span>
          </Button>
        ) : (
          <Button
            key={folder}
            size="lg"
            className={row}
            aria-label={folders.remove.replace('{folder}', folder)}
            data-figma={layers.rows[i]}
          >
            <FolderIcon size="16" />
            <span className={path}>{folder}</span>
            <CloseIcon size="16" />
          </Button>
        ),
      )}
      <Button size="sm" textSize="sm" className={row} data-figma={layers.add} onClick={onAdd}>
        <PlusIcon size="12" />
        {folders.add}
      </Button>
    </>
  )
}
