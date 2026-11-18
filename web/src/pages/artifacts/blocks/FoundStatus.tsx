// When the library last checked its sources, as "Checked Claude and Codex 2m
// ago" after a refresh mark (Figma 402:15375): muted mono text at the end of
// the header. Props only.
import { Inline, RefreshIcon } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'

// Figma keeps 24 between the status and Add a link (an 8 px spacer and two 8 px gaps); the header's gap gives 8.
const status = css({ textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap', me: '16' })

export type FoundStatusProps = {
  text: string
  /** Extra classes, such as the phone's space above the status (M1 406:110). */
  className?: string | undefined
}

export function FoundStatus({ text, className }: FoundStatusProps) {
  return (
    <Inline gap="6" align="center" className={cx(status, className)} data-figma="found status" role="status">
      <RefreshIcon size="12" />
      {text}
    </Inline>
  )
}
