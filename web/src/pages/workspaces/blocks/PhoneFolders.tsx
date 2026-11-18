// The chat's folders on the phone (M8 128:704): the chip in the chat's header
// opens a sheet titled Folders, with D4's folder rows and Add folder; with the
// picker open, a rule, then D4's picker (FolderPickerList) and its Add button
// at the bottom, within thumb reach. The title row and Add stay put and only
// the folders between them scroll (d-107, `ScrollFrame`). The search has the
// focus when the sheet opens on the picker. The library's sheet is as high
// as its content (LIBRARY_GAPS.md: Phone folders sheet). At a tablet's width
// (T5 128:537, `device="tablet"`) the title row has the chat's name after
// Folders, which the library's title row cannot draw, so the sheet's own title
// row gives way to one in the frame's header; the parts sit 23 in from the
// sheet's edges and 10 apart, and Cancel and Add sit at the end of the foot,
// as beside the desktop's chat (D4). Props only.
import {
  BottomSheet,
  BottomSheetClose,
  Button,
  CloseIcon,
  FolderIcon,
  Inline,
  PlusIcon,
  ScrollFrame,
} from '@eshelton328/component-library-1701'
import { type FocusEvent, useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ChatFolders, FolderPicker, PhoneFoldersLayers } from '../types.ts'
import { FolderPickerList } from './FolderPickerList.tsx'
import { FolderRows } from './FolderRows.tsx'

// The sheet is a flex column; the frame fills it and shrinks with it, so only its body scrolls.
const fill = css({ display: 'flex', flexDirection: 'column', flex: '1', minH: '[0]' })
// M8 128:716: the rows start 16 in from the screen's sides (the sheet pads 12 inside its border) and every part is
// 8 under the one before.
const body = css({ px: '4', gap: '8' })
// M8 128:735: a rule over the picker, 8 under Add folder.
const rule = css({ borderTopWidth: 'default', borderTopStyle: 'solid', borderTopColor: 'border.default' })
// M8 128:802: Add spans the sheet, 16 in (the sheet pads 12, Add 4 more), 8 under the rows. Add is the footer's
// direct child, so `ScrollFrame` draws its focus ring inside it and the footer's clip cannot cut the ring.
const add = css({ mx: '4', mt: '8' })
// T5 128:540: the parts sit 23 in from the sheet's edges (its 1 px border, 12 of padding and 10) and 10 apart; the
// title row is 10 under the grabber.
const tabletBody = css({ px: '10', gap: '10', pt: '10' })
const tabletHeader = css({ px: '10', pt: '10' })
// T5 128:541, 128:542: Folders in 17 px, as a sheet's title is, and the chat's name in mono after it.
const heading = css({ textStyle: 'subtitle', color: 'fg.default', m: '0' })
const chatName = css({ textStyle: 'mono', color: 'fg.muted', flex: '1' })
// T5 128:546: the × is grey, where a text button draws its icon in the accent colour.
const close = css({ color: 'fg.muted' })
// T5 128:634: Cancel and Add at the end of the foot, 10 under the rows.
const tabletFoot = css({ mx: '10', mt: '10' })

// The sheet's focus trap selects the text of the field it focuses; Figma draws the caret after "~/the-" with nothing
// selected (128:752), so the caret goes to the end once the trap is done.
function caretAtEnd(event: FocusEvent<HTMLDivElement>) {
  const field = event.target
  if (!(field instanceof HTMLInputElement)) return
  queueMicrotask(() => {
    field.setSelectionRange(field.value.length, field.value.length)
  })
}

export type PhoneFoldersProps = {
  folders: ChatFolders
  /** The chip's label, such as "{count} folders"; {count} is the number of folders. */
  chip: string
  picker?: FolderPicker | undefined
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The picker shows under the folders. */
  pickerOpen: boolean
  onPickerOpenChange?: ((open: boolean) => void) | undefined
  /** The folder chosen in the picker, by path. */
  picked: string | null
  onPick?: ((path: string) => void) | undefined
  /** The device whose width the sheet has: the phone (the default) or a tablet (T5). */
  device?: 'phone' | 'tablet' | undefined
  /** The chat's name, after Folders in the tablet's title row (T5 128:542). */
  chat?: string | undefined
  /** The frame's Figma layers. */
  layers?: PhoneFoldersLayers | undefined
}

export function PhoneFolders(props: PhoneFoldersProps) {
  const { folders, picker, open, onOpenChange, pickerOpen, onPickerOpenChange, picked, layers } = props
  const tablet = props.device === 'tablet'
  const ref = useRef<HTMLDivElement>(null)
  const showPicker = pickerOpen && picker !== undefined
  const trigger = (
    <Button size="xs" textSize="xs" data-figma={layers?.chip}>
      <FolderIcon size="12" />
      {props.chip.replace('{count}', String(folders.items.length))}
    </Button>
  )
  const addLabel = picker === undefined ? '' : picker.add.replace('{folder}', picked ?? '')
  const footer = !showPicker ? undefined : tablet ? (
    <Inline gap="8" align="center" justify="end" className={tabletFoot}>
      <Button size="sm" textSize="sm" onClick={() => onPickerOpenChange?.(false)} data-figma={layers?.cancel}>
        {picker.cancel}
      </Button>
      <Button size="sm" textSize="smStrong" variant="primary" data-figma={layers?.addFolder}>
        <PlusIcon size="12" />
        {addLabel}
      </Button>
    </Inline>
  ) : (
    <Button variant="primary" size="xl" className={add} data-figma={layers?.addFolder}>
      <PlusIcon size="16" />
      {addLabel}
    </Button>
  )
  const header = tablet ? (
    <div className={tabletHeader}>
      <Inline gap="8" align="center" data-figma={layers?.title}>
        <h2 className={heading}>{folders.label}</h2>
        <span className={chatName}>{props.chat}</span>
        <BottomSheetClose>
          <Button variant="text" size="xs" iconOnly className={close} aria-label="Close">
            <CloseIcon size="20" />
          </Button>
        </BottomSheetClose>
      </Inline>
    </div>
  ) : undefined
  const content = (
    <div ref={ref} className={fill} onFocus={caretAtEnd}>
      <ScrollFrame bodyClassName={tablet ? tabletBody : body} header={header} footer={footer}>
        <FolderRows
          folders={folders}
          onAdd={() => onPickerOpenChange?.(true)}
          accent
          layers={layers === undefined ? undefined : { rows: layers.rows, add: layers.add }}
        />
        {showPicker ? (
          <>
            <div className={rule} data-figma={layers?.rule} />
            <FolderPickerList
              picker={picker}
              picked={picked}
              onPick={props.onPick}
              onClose={() => onPickerOpenChange?.(false)}
              size={tablet ? 'tabletSheet' : 'sheet'}
              layers={
                layers === undefined
                  ? undefined
                  : {
                      title: layers.pickerTitle,
                      search: layers.search,
                      recent: layers.recent,
                      browse: layers.browse,
                    }
              }
            />
          </>
        ) : null}
      </ScrollFrame>
    </div>
  )
  const initialFocus = showPicker ? () => ref.current?.querySelector('input') ?? null : undefined
  return tablet ? (
    <BottomSheet
      label={folders.label}
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      initialFocus={initialFocus}
    >
      {content}
    </BottomSheet>
  ) : (
    <BottomSheet
      title={folders.label}
      closeButton
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      initialFocus={initialFocus}
    >
      {content}
    </BottomSheet>
  )
}
