// Sort and its sheet on a phone (M4 407:558, 407:814): the icon-only Sort
// opens the Sort menu as a sheet from the bottom that covers the tab bar,
// titled Sort by, with each sort and what it does, the picked one checked,
// and the note under them, as the Inbox's phone Sort sheet (M13) and the
// Filter sheet (M3). An arrow key moves the sort and keeps the sheet open;
// picking a sort closes it; the scrim and Escape close it and keep the
// sort. Props only.
import { BottomSheet, Button, OptionList, SortDescIcon, Stack } from '@eshelton328/component-library-1701'
import { useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactSortMenu } from '../types.ts'

// M4 407:812: the note sits 2 under the last choice, at the sheet's inset, in the description's grey.
const note = css({ textStyle: 'small', color: 'fg.muted' })
// M4 407:821: the sheet's body runs 8 past the note (801 to 809), as the Filter sheet's (T3 407:1624).
const body = css({ pb: '8' })
// M1 406:100, 406:107: the phone's icon-only Sort and Filter draw their icons in the muted grey (`fg.muted`), also
// while pressed (M3 407:61); a secondary Button draws its content in `fg.default`.
const mutedIcon = css({ display: 'inline-flex', color: 'fg.muted' })

export type SortSheetProps = {
  menu: ArtifactSortMenu
  /** The picked sort, such as `newest`. */
  sort: string
  /** The picked sort's short label, such as "Newest"; it names the icon-only button. */
  sortLabel: string
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The sort changed: a pick or an arrow key. A pick then closes the sheet through `onOpenChange`. */
  onSortChange?: ((sort: string) => void) | undefined
}

export function SortSheet({ menu, sort, sortLabel, open, onOpenChange, onSortChange }: SortSheetProps) {
  // The sheet opens with the focus on the sheet itself: Figma draws no focus ring on a choice (M4 407:790).
  const noteRef = useRef<HTMLSpanElement>(null)
  return (
    <BottomSheet
      title={menu.heading}
      trigger={
        // M1 406:97: the phone's Sort is the 36 px icon-only button. M4 draws it under the scrim as M1 does, not
        // pressed (407:558), so the open sheet does not press it.
        <Button size="lg" iconOnly aria-label={`Sort: ${sortLabel}`} data-figma="button · Sort">
          <span className={mutedIcon}>
            <SortDescIcon />
          </span>
        </Button>
      }
      open={open}
      onOpenChange={onOpenChange}
      initialFocus={() => noteRef.current?.closest<HTMLElement>('[role="dialog"]') ?? null}
    >
      {/* M4 407:821: the body holds the choices and the note, 2 apart. */}
      <Stack gap="2" className={body} data-figma="sheet body">
        {/* M4 407:790: each choice pads its text 12 in and 8 above, the check 12 from the end, as OptionList's rows. */}
        <OptionList
          label={menu.heading}
          value={sort}
          size="sm"
          // A click, a tap, Enter, Space or an arrow key sets the sort; only an arrow key leaves the sheet open, as
          // OptionList calls `onItemSelect` for a pick and not for an arrow key (the Inbox's ListTools, M13).
          onValueChange={(value) => {
            onSortChange?.(value)
          }}
          // A pick closes the sheet, also on the sort already picked.
          onItemSelect={() => {
            onOpenChange?.(false)
          }}
          items={menu.options.map((o) => ({ value: o.value, label: o.label, description: o.description }))}
        />
        <span className={note} data-figma="note" ref={noteRef}>
          {menu.note}
        </span>
      </Stack>
    </BottomSheet>
  )
}
