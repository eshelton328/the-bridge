// Filter and its sheet on a tablet (T3 407:1303, 407:1617): Filter opens the
// Filter menu as a sheet from the bottom that covers the tab bar, with Clear
// in its title row and Show the full width under the boxes, as the Inbox's
// phone Filter sheet (M7). The button is pressed while the sheet is open
// and, once it closes, shows a dot while boxes are checked. Show applies the boxes and
// closes the sheet; the scrim and Escape close it and keep them. On a phone
// (M3 407:61, 407:399) Filter is the 36 px icon-only button of M1 and the
// sheet is the same. Props only.
import { BottomSheet, BottomSheetClose, Button, FilterIcon } from '@eshelton328/component-library-1701'
import { useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactFilterMenu } from '../types.ts'
import { FilterMenu } from './FilterMenu.tsx'

// T3 407:1719: Show sits 8 under the boxes and 4 in from the sheet's 13 px inset (BottomSheet pads 12 in a 1 px border).
const foot = css({ px: '4', pt: '8' })
const wide = css({ w: '[100%]' })
// T3 407:1624: the sheet's body runs 8 past its last row (1059 to 1067), so Show sits 18 under the boxes.
const body = css({ pb: '8' })
// M1 406:100, 406:107: the phone's icon-only Sort and Filter draw their icons in the muted grey (`fg.muted`), also
// while pressed (M3 407:61); a secondary Button draws its content in `fg.default`.
const mutedIcon = css({ display: 'inline-flex', color: 'fg.muted' })
// M3 407:405, M6 408:707 and 408:711, M7 407:1100: Figma lines a header text button's label up with the sheet's
// content edge (17 from the screen's side). A `text` Button pads its label 8 inside a 1 px border, so the button
// reaches 8 past the header's edge on that side and its label sits 1 px inside Figma's.
const headerEnd = css({ me: '-8' })

export type FilterSheetProps = {
  menu: ArtifactFilterMenu
  /** The checked boxes. */
  checks: readonly string[]
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  onChecksChange?: ((checks: string[]) => void) | undefined
  /** Show: applies the checked boxes. The sheet closes. */
  onApply?: (() => void) | undefined
  /** Filter as an icon-only button, named Filter (the phone, M1 406:104, M3 407:61). */
  iconOnly?: boolean | undefined
}

export function FilterSheet({
  menu,
  checks,
  open,
  onOpenChange,
  onChecksChange,
  onApply,
  iconOnly = false,
}: FilterSheetProps) {
  // The sheet opens with the focus on the sheet itself: Figma draws Clear with no focus ring (T3 407:1623).
  const bodyRef = useRef<HTMLDivElement>(null)
  return (
    <BottomSheet
      title="Filter"
      trigger={
        // T1 405:131: the tablet's controls are 36 high, and Figma sets Filter in Medium 13 (407:1307).
        <Button
          size="lg"
          textSize="sm"
          iconOnly={iconOnly}
          aria-label={iconOnly ? 'Filter' : undefined}
          pressed={open ? true : undefined}
          // T3 draws no dot on Filter while the sheet shows the checked boxes (407:1303); T1 shows it after Show.
          indicator={checks.length > 0 && !open}
          data-figma="button · Filter"
        >
          {iconOnly ? (
            <span className={mutedIcon}>
              <FilterIcon />
            </span>
          ) : (
            <FilterIcon />
          )}
          {iconOnly ? null : 'Filter'}
        </Button>
      }
      open={open}
      onOpenChange={onOpenChange}
      initialFocus={() => bodyRef.current?.closest<HTMLElement>('[role="dialog"]') ?? null}
      actions={
        menu.clear === undefined ? undefined : (
          // T3 407:1623: Clear is a cyan text button at the end of the 40 px title row.
          <Button
            variant="text"
            size="sm"
            className={headerEnd}
            onClick={() => {
              onChecksChange?.([])
            }}
          >
            {menu.clear}
          </Button>
        )
      }
    >
      <div className={body} data-figma="sheet body" ref={bodyRef}>
        <FilterMenu menu={menu} checks={checks} onChecksChange={onChecksChange} sheet />
      </div>
      <div className={foot} data-figma={menu.footLayer ?? '407:1719'}>
        <BottomSheetClose>
          <Button variant="primary" size="xl" className={wide} data-figma={`button · ${menu.show}`} onClick={onApply}>
            {menu.show}
          </Button>
        </BottomSheetClose>
      </div>
    </BottomSheet>
  )
}
