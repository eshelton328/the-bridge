// The sections of the Filter menu: kinds, projects and tags, each a
// checkbox with the number of items it matches. Props only.
import { Checkbox, Inline, PopoverSection } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxFilterMenu } from '../types.ts'

const row = css({ px: '8' })
const count = css({ textStyle: 'mono', color: 'fg.subtle' })

export function FilterMenu({ menu }: { menu: InboxFilterMenu }) {
  return (
    <div data-figma="filter popover">
      {menu.sections.map((section) => (
        <PopoverSection key={section.label} label={section.label}>
          {section.items.map((item) => (
            <Inline key={item.value} gap="8" align="center" justify="between" className={row}>
              <Checkbox label={item.label} value={item.value} checked={item.checked} />
              <span className={count}>{item.count}</span>
            </Inline>
          ))}
        </PopoverSection>
      ))}
    </div>
  )
}
