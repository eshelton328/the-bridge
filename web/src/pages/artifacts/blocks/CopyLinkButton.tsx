// Copy link and what it did (audit W-6): "Copied" or "Copy failed" on the
// control itself while `status` is set, then "Copy link" again. With a label
// (D2's bar, M2's button) the three contents sit in one grid cell and only
// the shown one is visible, so the button keeps the width of the widest and
// the bar does not jump; icon-only (T2's Back bar) the icon and the name
// change. A polite status region beside the button says the result to a
// screen reader, as the button's own children cannot (they are
// presentational); with `announce` false it has none, for a second Copy
// link on the same screen (the bar's beside the one next to Open artifact),
// so the result is said once. Props only; the page entry copies and clears `status`.
import { Button, CheckIcon, CopyIcon, WarningIcon } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { CopyLinkStatus } from '../types.ts'

const labels = { idle: 'Copy link', copied: 'Copied', failed: 'Copy failed' } as const
const stack = css({ display: 'inline-grid', placeItems: 'center' })
// The button's own icon gap (the library's button recipe, gap 6).
const cell = css({ gridArea: '[1 / 1]', display: 'inline-flex', alignItems: 'center', gap: '6' })
const hidden = css({ visibility: 'hidden' })
const srOnly = css({ srOnly: true })

export type CopyLinkButtonProps = {
  /** What the last press did; "Copy link" without it. */
  status?: CopyLinkStatus | undefined
  onClick?: (() => void) | undefined
  /** The button's height, as `Button`'s `size`. */
  size?: 'md' | 'lg' | 'xl' | undefined
  /** A square icon-only button (T2's Back bar); its name says the result. */
  iconOnly?: boolean | undefined
  className?: string | undefined
  /** Whether its status region says the result; false for a second Copy link on the same screen. */
  announce?: boolean | undefined
}

export function CopyLinkButton({
  status,
  onClick,
  size,
  iconOnly = false,
  className,
  announce = true,
}: CopyLinkButtonProps) {
  const shown = status ?? 'idle'
  return (
    <>
      {iconOnly ? (
        <Button size={size} iconOnly aria-label={labels[shown]} className={className} onClick={onClick}>
          {status === 'copied' ? <CheckIcon /> : status === 'failed' ? <WarningIcon /> : <CopyIcon />}
        </Button>
      ) : (
        <Button size={size} className={className} onClick={onClick}>
          <span className={stack}>
            <span className={cx(cell, shown === 'idle' ? undefined : hidden)} aria-hidden={shown !== 'idle'}>
              <CopyIcon />
              {labels.idle}
            </span>
            <span className={cx(cell, shown === 'copied' ? undefined : hidden)} aria-hidden={shown !== 'copied'}>
              <CheckIcon />
              {labels.copied}
            </span>
            <span className={cx(cell, shown === 'failed' ? undefined : hidden)} aria-hidden={shown !== 'failed'}>
              {labels.failed}
            </span>
          </span>
        </Button>
      )}
      {announce ? (
        <span role="status" className={srOnly}>
          {status === undefined ? '' : labels[status]}
        </span>
      ) : null}
    </>
  )
}
