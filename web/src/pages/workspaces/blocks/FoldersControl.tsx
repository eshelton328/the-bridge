// The folders control under the prompt box (D4 137:9): the working folder
// and how many more there are, which opens the chat's folders (128:405): the
// working folder, the folders added since, each with a remove ×, and Add
// folder, which opens the folder picker. The library's `Popover` is the list
// and a `Button` each row (LIBRARY_GAPS.md: Folder list). Props only.
import {
  Button,
  ChevronDownIcon,
  CloseIcon,
  FolderIcon,
  PlusIcon,
  Popover,
  Stack,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ChatFolders } from '../types.ts'

// D4's Figma layers of the folder rows, in order.
const rowLayers = ['128:410', '128:416']

const more = css({ color: 'fg.muted' })
// The list opens over the transcript, clear of the prompt box, as Figma draws it (128:405 ends 8 above 137:2);
// the popover opens next to its trigger, the control inside the box (d-100: 40, the nearest spacing token).
const lift = css({ mb: '40' })
const top = css({ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8' })
const heading = css({ textStyle: 'eyebrow', color: 'fg.muted' })
const subtle = css({ textStyle: 'mono', color: 'fg.subtle' })
// On a row's raised fill fg.subtle falls below 4.5:1, so the note there is fg.muted.
const note = css({ textStyle: 'mono', color: 'fg.muted' })
// A row spreads its folder and its note or remove mark over the list's width.
const row = css({ w: '[100%]', justifyContent: 'flex-start' })
const path = css({ textStyle: 'mono', color: 'fg.default', flex: '1', textAlign: 'start' })

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
    <Button size="xs" textSize="xs" data-figma="137:9">
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
        {folders.items.map((folder, i) =>
          i === 0 ? (
            <Button key={folder} size="lg" className={row} data-figma={rowLayers[i]}>
              <FolderIcon size="16" />
              <span className={path}>{folder}</span>
              <span className={note}>{folders.working}</span>
            </Button>
          ) : (
            <Button
              key={folder}
              size="lg"
              className={row}
              aria-label={folders.remove.replace('{folder}', folder)}
              data-figma={rowLayers[i]}
            >
              <FolderIcon size="16" />
              <span className={path}>{folder}</span>
              <CloseIcon size="16" />
            </Button>
          ),
        )}
        <Button size="sm" textSize="sm" className={row} data-figma="128:424" onClick={onAdd}>
          <PlusIcon size="12" />
          {folders.add}
        </Button>
      </Stack>
    </Popover>
  )
}
