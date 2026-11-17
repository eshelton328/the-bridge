// A labelled section of a menu: a `PopoverSection` in a popover, and in a
// phone's bottom sheet, where `PopoverSection` cannot sit (it needs its
// popover), the label as a `GroupHeader` above the rows (M4, M6, M7;
// LIBRARY_GAPS.md: Section label in a sheet). Props only.
import { GroupHeader, PopoverSection } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'

export type MenuSectionProps = {
  label: string
  /** The section sits in a bottom sheet, not a popover. */
  sheet?: boolean | undefined
  children: ReactNode
}

export function MenuSection({ label, sheet = false, children }: MenuSectionProps) {
  if (!sheet) return <PopoverSection label={label}>{children}</PopoverSection>
  return (
    <div role="group" aria-label={label}>
      <GroupHeader label={label} />
      {children}
    </div>
  )
}
