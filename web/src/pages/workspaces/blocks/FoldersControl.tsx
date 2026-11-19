// The folders control under the prompt box (D4 137:9): the working folder
// and how many more there are, which opens the chat's folders (128:405): the
// working folder, the folders added since, each with a remove ×, and Add
// folder, which opens the folder picker. The library's `Popover` is the list
// and FolderRows its rows (LIBRARY_GAPS.md: Folder list). Props only.
import { Button, ChevronDownIcon, FolderIcon, Popover, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ChatFolders } from '../types.ts'
import { FolderRows } from './FolderRows.tsx'

const more = css({ color: 'fg.muted' })
// The list opens over the transcript, clear of the prompt box, as Figma draws it (128:405 ends 8 above 137:2);
// the popover opens next to its trigger, the control inside the box (d-100: 40, the nearest spacing token).
const lift = css({ mb: '40' })
const top = css({ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8' })
const heading = css({ textStyle: 'eyebrow', color: 'fg.muted' })
const subtle = css({ textStyle: 'mono', color: 'fg.subtle' })

export type FoldersControlProps = {
  folders: ChatFolders
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** Called when Erik presses Add folder. */
  onAdd?: (() => void) | undefined
}

export function FoldersControl({ folders, open, onOpenChange, onAdd }: FoldersControlProps) {
  const [working] = folders.items
  const trigger = (
    <Button size="xs" textSize="xs" keepIconSize data-figma="137:9">
      <FolderIcon size="12" />
      <span>{working}</span>{' '}
      {folders.items.length > 1 ? <span className={more}>+{folders.items.length - 1}</span> : null}
      <ChevronDownIcon size="12" />
    </Button>
  )
  return (
    <Popover
      data-figma={open ? '128:405' : undefined}
      label={folders.label}
      open={open}
      onOpenChange={onOpenChange}
      placement="top-start"
      width="lg"
      flip={false}
      className={lift}
      trigger={trigger}
    >
      <Stack gap="10">
        <div className={top}>
          <span className={heading}>{folders.heading}</span>
          <span className={subtle}>{folders.scope}</span>
        </div>
        <FolderRows folders={folders} onAdd={onAdd} />
      </Stack>
    </Popover>
  )
}
