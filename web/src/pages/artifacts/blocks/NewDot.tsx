// The New dot of a list row (Figma "new dot", D2 403:213, D4 403:8233): a
// 6 px dot in `status.working.fg`. The library has no dot for a row
// (LIBRARY_GAPS.md: New dot in a list row), and no size token is 6: a 2 px
// padding inside a 1 px border of the same colour makes it. Props only.
import { css } from '../../../../styled-system/css/index.js'

const dot = css({
  flexShrink: '0',
  p: '2',
  borderRadius: 'full',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'status.working.fg',
  bg: 'status.working.fg',
})

export type NewDotProps = {
  /** What a screen reader reads, such as "New". */
  label: string
}

export function NewDot({ label }: NewDotProps) {
  return <span className={dot} role="img" aria-label={label} />
}
