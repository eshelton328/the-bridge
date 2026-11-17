// The filters that apply, under the list tools: per Filter menu section
// what it filters by and one button per value that removes it, and Clear.
// Props only.
import { Button, CloseIcon, Inline } from '@eshelton328/component-library-1701'
import { Fragment } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { AppliedSection } from '../types.ts'

const label = css({ textStyle: 'small', color: 'fg.muted' })
const row = css({ px: '4' })
// Figma sets each value in Geist Mono 11 (T15 359:539, D13 359:993): `monoSm`.
const value = css({ textStyle: 'monoSm' })
const clear = css({
  textStyle: 'small',
  fontWeight: 'text.label',
  color: 'fg.accent',
  textDecoration: 'none',
  _hover: { textDecoration: 'underline' },
})

export type AppliedFiltersProps = {
  sections: readonly AppliedSection[]
  /** Removes one value from the filters. */
  onRemove?: ((value: string) => void) | undefined
  onClear?: (() => void) | undefined
}

export function AppliedFilters({ sections, onRemove, onClear }: AppliedFiltersProps) {
  return (
    <Inline gap="6" align="center" wrap className={row} data-figma="filters applied">
      {sections.map((section) => (
        <Fragment key={section.label}>
          <span className={label}>{section.label}</span>
          {/* The library has no removable filter chip (LIBRARY_GAPS.md); a pressed small button stands for one. */}
          {section.values.map((v) => (
            <Button
              key={v}
              size="sm"
              pressed
              aria-label={`Remove ${v}`}
              onClick={() => {
                onRemove?.(v)
              }}
            >
              <span className={value}>{v}</span>
              <CloseIcon size="12" />
            </Button>
          ))}
        </Fragment>
      ))}
      <a
        className={clear}
        href="#clear"
        onClick={(event) => {
          event.preventDefault()
          onClear?.()
        }}
      >
        Clear
      </a>
    </Inline>
  )
}
