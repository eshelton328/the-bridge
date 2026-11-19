// The sections of the Filter menu: kinds, projects and tags, each a
// checkbox with the number of items it matches. Props only.
// A box the owner checks or clears is reported; the list applies it when the menu closes.
import { Checkbox } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxFilterMenu } from '../types.ts'
import { MenuSection } from './MenuSection.tsx'

// The popover is `surface.raised`, where text is `fg.muted` or brighter (fg.subtle is 4.39:1 there, below WCAG AA);
// the phone's sheet keeps Figma's dimmer `fg.subtle`.
const count = css({ textStyle: 'monoSm', color: 'fg.muted' })
const sheetCount = css({ textStyle: 'monoSm', color: 'fg.subtle' })
// Figma insets each row 8 at both sides (D4 346:1740, T14 346:8879: the box 8 in from the row), so the boxes line up
// with the section labels, which the popover insets 8, and the counts end 8 before the row's end.
const row = css({ px: '8' })

export type FilterMenuProps = {
  menu: InboxFilterMenu
  /** The checked boxes. */
  checks: readonly string[]
  onChecksChange?: ((checks: string[]) => void) | undefined
  /** The menu is the phone's Filter sheet (M7), not a popover. */
  sheet?: boolean | undefined
}

export function FilterMenu({ menu, checks, onChecksChange, sheet }: FilterMenuProps) {
  return (
    <>
      {menu.sections.map((section) => (
        <MenuSection key={section.label} label={section.label} sheet={sheet}>
          {section.items.map((item) => (
            <div key={item.value} className={row}>
              <Checkbox
                label={item.label}
                value={item.value}
                size="sm"
                checked={checks.includes(item.value)}
                onCheckedChange={(checked) => {
                  const others = checks.filter((value) => value !== item.value)
                  onChecksChange?.(checked ? [...others, item.value] : others)
                }}
                labelStyle={section.mono ? 'mono' : 'text'}
                trailing={<span className={sheet ? sheetCount : count}>{item.count}</span>}
              />
            </div>
          ))}
        </MenuSection>
      ))}
    </>
  )
}
