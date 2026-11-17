// The filters that apply, under the list tools: what they filter by, one
// button per value that removes it, and Clear. Props only.
import { Button, CloseIcon, Inline } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxData } from '../types.ts'

const label = css({ textStyle: 'small', color: 'fg.muted' })
const row = css({ px: '4' })
const clear = css({
  textStyle: 'small',
  fontWeight: 'text.label',
  color: 'fg.accent',
  textDecoration: 'none',
  _hover: { textDecoration: 'underline' },
})

export function AppliedFilters({ applied }: { applied: NonNullable<InboxData['applied']> }) {
  return (
    <Inline gap="6" align="center" wrap className={row} data-figma="filters applied">
      <span className={label}>{applied.label}</span>
      {/* The library has no removable filter chip (LIBRARY_GAPS.md); a pressed small button stands for one. */}
      {applied.values.map((value) => (
        <Button key={value} size="sm" pressed aria-label={`Remove ${value}`}>
          {value}
          <CloseIcon size="12" />
        </Button>
      ))}
      <a className={clear} href="#clear">
        Clear
      </a>
    </Inline>
  )
}
