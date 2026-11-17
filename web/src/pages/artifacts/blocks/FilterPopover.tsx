// Filter and its menu (D3 403:6453, 403:6852): the button is pressed while
// the menu is open and shows a dot while boxes are checked; the menu's
// footer names what the checked boxes show, and Show applies them and
// closes the menu. Props only.
import { Button, FilterIcon, Popover } from '@eshelton328/component-library-1701'
import type { ArtifactFilterMenu } from '../types.ts'
import { FilterMenu } from './FilterMenu.tsx'

export type FilterPopoverProps = {
  menu: ArtifactFilterMenu
  /** The checked boxes. */
  checks: readonly string[]
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  onChecksChange?: ((checks: string[]) => void) | undefined
  /** Show: applies the checked boxes. */
  onApply?: (() => void) | undefined
}

export function FilterPopover({ menu, checks, open, onOpenChange, onChecksChange, onApply }: FilterPopoverProps) {
  return (
    <Popover
      trigger={
        // Figma sets Filter in Medium 13 with a cyan dot while boxes are checked (403:6457, 403:6841). The button is
        // the trigger itself, so its data-figma key sits on it.
        <Button
          textSize="sm"
          pressed={open ? true : undefined}
          indicator={checks.length > 0}
          data-figma="button · Filter"
        >
          <FilterIcon />
          Filter
        </Button>
      }
      label={menu.label}
      width="md"
      placement="bottom-start"
      data-figma={open ? 'menu · Filter' : undefined}
      open={open}
      onOpenChange={onOpenChange}
      note={menu.note}
      actions={
        <span data-figma={`button · ${menu.show}`}>
          <Button variant="primary" onClick={onApply}>
            {menu.show}
          </Button>
        </span>
      }
    >
      <FilterMenu menu={menu} checks={checks} onChecksChange={onChecksChange} />
    </Popover>
  )
}
