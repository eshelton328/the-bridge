// The sections of the Filter menu: kinds, projects and tags, each a
// checkbox with the number of items it matches. Props only.
import { Checkbox, PopoverSection } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxFilterMenu } from '../types.ts'

const count = css({ textStyle: 'mono', color: 'fg.subtle' })

export function FilterMenu({ menu }: { menu: InboxFilterMenu }) {
  return (
    <div data-figma="filter popover">
      {menu.sections.map((section) => (
        <PopoverSection key={section.label} label={section.label}>
          {section.items.map((item) => (
            <Checkbox
              key={item.value}
              label={item.label}
              value={item.value}
              checked={item.checked}
              trailing={<span className={count}>{item.count}</span>}
            />
          ))}
        </PopoverSection>
      ))}
    </div>
  )
}
