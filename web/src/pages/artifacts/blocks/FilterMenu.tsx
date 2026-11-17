// The sections of the Filter menu (D3 403:6852): source, project, how the
// artifact was found and when it changed, each a checkbox with the number
// of artifacts it matches. As the Inbox's Filter menu, with the same
// library parts. Props only: a box Erik checks or clears is reported, and
// the library applies the checks on Show.
import { Checkbox, PopoverSection } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactFilterMenu } from '../types.ts'

const count = css({ textStyle: 'monoSm', color: 'fg.subtle' })
// Figma insets each row 8 at both sides (403:6857: the box 8 in from the row), so the boxes line up with the
// section labels and the counts end 8 before the row's end.
const row = css({ px: '8' })

export type FilterMenuProps = {
  menu: ArtifactFilterMenu
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
            <div key={item.value} className={row} data-figma={`check · ${item.label}`}>
              <Checkbox
                label={item.label}
                value={item.value}
                size="compact"
                checked={checks.includes(item.value)}
                onCheckedChange={(checked) => {
                  const others = checks.filter((value) => value !== item.value)
                  onChecksChange?.(checked ? [...others, item.value] : others)
                }}
                labelStyle={item.mono ? 'mono' : 'text'}
                trailing={<span className={count}>{item.count}</span>}
              />
            </div>
          ))}
        </PopoverSection>
      ))}
    </>
  )
}
