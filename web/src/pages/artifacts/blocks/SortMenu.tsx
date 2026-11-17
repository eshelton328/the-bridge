// Sort and its menu (D6 403:8484, 403:8881): the button names the picked
// sort and is pressed while the menu is open; the menu lists each sort with
// what it does, the picked one checked, and a note under a rule. Picking a
// sort closes the menu. As the Inbox's Sort menu (RadioMenu). Props only.
import { Button, ChevronDownIcon, RadioMenu, SortDescIcon } from '@eshelton328/component-library-1701'
import type { ArtifactSortMenu } from '../types.ts'

export type SortMenuProps = {
  menu: ArtifactSortMenu
  /** The picked sort, such as `newest`. */
  sort: string
  /** The picked sort's short label on the button, such as "Newest". */
  sortLabel: string
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** A sort picked; the menu then closes. */
  onSortChange?: ((sort: string) => void) | undefined
}

export function SortMenu({ menu, sort, sortLabel, open, onOpenChange, onSortChange }: SortMenuProps) {
  return (
    <RadioMenu
      trigger={
        // Figma sets Newest in Medium 13 with the cyan border of a pressed button while the menu is open (403:8484).
        // The button is the trigger itself, so its data-figma key sits on it.
        <Button textSize="sm" pressed={open ? true : undefined} data-figma="button · Sort">
          <SortDescIcon />
          {sortLabel}
          <ChevronDownIcon size="12" />
        </Button>
      }
      label={menu.heading}
      heading={menu.heading}
      // Figma's menu is 280 wide (403:8881), the library's width for a menu whose choices have a description.
      width="sort"
      data-figma={open ? 'menu · Sort' : undefined}
      open={open}
      onOpenChange={onOpenChange}
      value={sort}
      onValueChange={(value) => {
        onSortChange?.(value)
      }}
      options={menu.options}
      note={menu.note}
    />
  )
}
