// The sections of the Filter menu (D3 403:6852): source, project, how the
// artifact was found and when it changed, each a checkbox with the number
// of artifacts it matches, in 28 px rows (`density="compact"`, D3
// 403:6857), and the Claude or Codex mark before a Source row's label. As
// the Inbox's Filter menu, with the same library parts. In the tablet's sheet (T3 407:1624) a section's label is a
// `GroupHeader` above its rows, as the Inbox's phone sheet draws it
// (`PopoverSection` needs its popover). Props only: a box the owner checks or
// clears is reported, and the library applies the checks on Show.
import { Checkbox, GroupHeader, KindMark, PopoverSection } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactFilterMenu } from '../types.ts'

const count = css({ textStyle: 'monoSm', color: 'fg.subtle' })
// Figma insets each row 8 at both sides (403:6857, T3 407:1511: the box 8 in from the row), so the boxes line up
// with the section labels and the counts end 8 before the row's end.
const row = css({ px: '8' })
// T3 407:1507: the label 8 in from the sheet's inset, as the boxes; `GroupHeader` pads its start 4.
const sheetLabel = css({ pl: '4' })
// T3 407:1508 to 407:1615: the sheet's rows are 30 apart, as `PopoverSection` puts its 28 px rows (gap 2).
const sheetRows = css({ display: 'flex', flexDirection: 'column', gap: '2' })

export type FilterMenuProps = {
  menu: ArtifactFilterMenu
  /** The checked boxes. */
  checks: readonly string[]
  onChecksChange?: ((checks: string[]) => void) | undefined
  /** The menu is the tablet's Filter sheet (T3), not a popover. */
  sheet?: boolean | undefined
}

function Section({ label, sheet, children }: { label: string; sheet: boolean; children: ReactNode }) {
  if (!sheet) return <PopoverSection label={label}>{children}</PopoverSection>
  return (
    <div role="group" aria-label={label} className={sheetRows}>
      {/* T3 names each label row by its capitals, such as `group · SOURCE` (407:1506). */}
      <div className={sheetLabel} data-figma={`group · ${label.toUpperCase()}`}>
        {/* T3 407:1506: a 26 px label row, the text 8 down. The `sidebar` header (8 above, 30 high) is the nearest;
        LIBRARY_GAPS.md "Filter sheet section labels". */}
        <GroupHeader variant="sidebar" label={label} />
      </div>
      {children}
    </div>
  )
}

export function FilterMenu({ menu, checks, onChecksChange, sheet = false }: FilterMenuProps) {
  return (
    <>
      {menu.sections.map((section) => (
        <Section key={section.label} label={section.label} sheet={sheet}>
          {section.items.map((item) => (
            <div key={item.value} className={row} data-figma={`check · ${item.label}`}>
              <Checkbox
                label={item.label}
                value={item.value}
                size="compact"
                // D3 403:6857: 28 px rows (`control.sm`), 30 apart in a `PopoverSection`.
                density="compact"
                // D3 403:6855, 403:6865: Figma's 13 px Claude and Codex marks are the library's 12.
                leading={item.mark === undefined ? undefined : <KindMark kind={item.mark} size="12" />}
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
        </Section>
      ))}
    </>
  )
}
