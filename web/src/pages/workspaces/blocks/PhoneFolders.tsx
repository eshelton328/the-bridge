// The chat's folders on the phone (M8 128:704): the chip in the chat's header
// opens a sheet titled Folders, with D4's folder rows and Add folder; with the
// picker open, a rule, then D4's picker (FolderPickerList) and its Add button
// at the bottom, within thumb reach. The title row and Add stay put and only
// the folders between them scroll (d-107, `ScrollFrame`). The search has the
// focus when the sheet opens on the picker. The library's sheet is as high
// as its content (LIBRARY_GAPS.md: Phone folders sheet). Props only.
import { BottomSheet, Button, FolderIcon, PlusIcon, ScrollFrame } from '@eshelton328/component-library-1701'
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
  /** The frame's Figma layers. */
  layers?: PhoneFoldersLayers | undefined
}

export function PhoneFolders(props: PhoneFoldersProps) {
  const { folders, picker, open, onOpenChange, pickerOpen, onPickerOpenChange, picked, layers } = props
  const ref = useRef<HTMLDivElement>(null)
  const showPicker = pickerOpen && picker !== undefined
  const trigger = (
    <Button size="xs" textSize="xs" data-figma={layers?.chip}>
      <FolderIcon size="12" />
      {props.chip.replace('{count}', String(folders.items.length))}
    </Button>
  )
  return (
    <BottomSheet
      title={folders.label}
      closeButton
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      initialFocus={showPicker ? () => ref.current?.querySelector('input') ?? null : undefined}
    >
      <div ref={ref} className={fill} onFocus={caretAtEnd}>
        <ScrollFrame
          bodyClassName={body}
          footer={
            showPicker ? (
              <Button variant="primary" size="xl" className={add} data-figma={layers?.addFolder}>
                <PlusIcon size="16" />
                {picker.add.replace('{folder}', picked ?? '')}
              </Button>
            ) : undefined
          }
        >
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
                size="sheet"
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
    </BottomSheet>
  )
}
