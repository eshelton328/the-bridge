// The sections of the Filter menu: kinds, projects and tags, each a
// checkbox with the number of items it matches. Props only.
// A box Erik checks or clears is reported; the list applies it when the menu closes.
import { Checkbox, PopoverSection } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxFilterMenu } from '../types.ts'

const count = css({ textStyle: 'monoSm', color: 'fg.subtle' })

export type FilterMenuProps = {
  menu: InboxFilterMenu
  /** The checked boxes. */
  checks: readonly string[]
  onChecksChange?: ((checks: string[]) => void) | undefined
}

export function FilterMenu({ menu, checks, onChecksChange }: FilterMenuProps) {
  return (
    <>
      {menu.sections.map((section) => (
        <PopoverSection key={section.label} label={section.label}>
          {section.items.map((item) => (
            <Checkbox
              key={item.value}
              label={item.label}
              value={item.value}
              size="sm"
              checked={checks.includes(item.value)}
              onCheckedChange={(checked) => {
                const others = checks.filter((value) => value !== item.value)
                onChecksChange?.(checked ? [...others, item.value] : others)
              }}
              labelStyle={section.mono ? 'mono' : 'text'}
              trailing={<span className={count}>{item.count}</span>}
            />
          ))}
        </PopoverSection>
      ))}
    </>
  )
}
