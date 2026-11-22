// The Add a link form as a sheet on a phone (M6 408:703): the phone's plus
// button opens D5's form as a sheet from the bottom that covers the tab bar,
// as the Filter and Sort sheets do (M3, M4). Cancel starts the title row
// and Add ends it, with the title centred between them; under it the
// description and the form's fields (`AddLinkFields`). The link field has
// the focus when it opens. Cancel, the scrim and Escape close it. Props only.
import { BottomSheet, BottomSheetClose, Button, Stack } from '@eshelton328/component-library-1701'
import { useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { AddLinkForm } from '../types.ts'
import { type AddLinkEntry, AddLinkFields, type AddLinkSource } from './AddLinkFields.tsx'

// M6 408:712 to 408:742: the description and the fields sit 4 in from the sheet's 13 px inset (BottomSheet pads 12 in a
// 1 px border), as the sheet's title row (408:706 at x 17). Figma puts them 14 apart; no spacing token is 14, so a tie
// takes the larger, 16 (d-072, LIBRARY_GAPS.md "Sheet form spacing").
const body = css({ px: '4' })
const description = css({ textStyle: 'small', color: 'fg.muted' })
// M3 407:405, M6 408:707 and 408:711, M7 407:1100: Figma lines a header text button's label up with the sheet's
// content edge (17 from the screen's side). A `text` Button pads its label 8 inside a 1 px border, so the button
// reaches 8 past the header's edge on that side and its label sits 1 px inside Figma's.
const headerStart = css({ ms: '-8' })
const headerEnd = css({ me: '-8' })

export type AddLinkSheetProps = {
  form: AddLinkForm
  open: boolean
  /** The picked source. */
  source: AddLinkSource
  onOpenChange?: ((open: boolean) => void) | undefined
  onSourceChange?: ((source: AddLinkSource) => void) | undefined
  /** Add was pressed. */
  onSubmit?: (() => void) | undefined
  /** The typed link and title (the live library); without it the fields keep what is typed. */
  entry?: AddLinkEntry | undefined
  /** The picked project; the form's `project.value` when not set. */
  project?: string | undefined
  onProjectChange?: ((project: string) => void) | undefined
}

export function AddLinkSheet({
  form,
  open,
  source,
  onOpenChange,
  onSourceChange,
  onSubmit,
  entry,
  project,
  onProjectChange,
}: AddLinkSheetProps) {
  const linkRef = useRef<HTMLDivElement>(null)
  return (
    <BottomSheet
      title={form.title}
      open={open}
      onOpenChange={onOpenChange}
      initialFocus={() => linkRef.current?.querySelector('input') ?? null}
      leading={
        // M6 408:707: Cancel is a cyan text button at the start of the title row.
        <BottomSheetClose>
          <Button variant="text" size="sm" className={headerStart}>
            {form.cancel}
          </Button>
        </BottomSheetClose>
      }
      actions={
        // M6 408:711: Add is a cyan text button at the end of the title row.
        <Button variant="text" size="sm" className={headerEnd} onClick={onSubmit}>
          {form.submit}
        </Button>
      }
    >
      <Stack gap="16" className={body}>
        <p className={description}>{form.description}</p>
        <AddLinkFields
          form={form}
          layout="sheet"
          source={source}
          onSourceChange={onSourceChange}
          linkRef={linkRef}
          entry={entry}
          project={project}
          onProjectChange={onProjectChange}
        />
      </Stack>
    </BottomSheet>
  )
}
