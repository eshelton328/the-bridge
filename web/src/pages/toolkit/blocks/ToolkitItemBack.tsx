// An open item's back row on a tablet or phone (T3 428:543): Back to Toolkit,
// with Discuss and Show on map at its end. When the item was opened from
// another item's links (T7 441:65), Back to Toolkit starts a breadcrumb
// (441:66): Toolkit › that item › the open item, and that item's crumb goes
// back to it. On a tab other than the Overview (T10 461:244) the row names the
// open item after Toolkit: Toolkit › the open item. The library has no breadcrumb (LIBRARY_GAPS.md, Item
// breadcrumb), so the crumbs after the BackRow are text in its label style
// and the item's crumb a plain button. A workflow on a page of its own (D13
// `breadcrumb row` 446:481) shows the same row on the desktop too: Toolkit ›
// Workflows › the workflow, the kind's crumb going back to the list of that
// kind; its Figma keys differ (`layers`). A file on a page of its own (T6
// 440:1761) goes back to the Files tab's tree: the row reads Files. Props only.
import { BackRow, focusRing } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css, cx } from '../../../../styled-system/css/index.js'

// T7 441:65: the breadcrumb at the start, the actions at the end (their own `ms: auto`).
const row = css({ display: 'flex', alignItems: 'center', minW: '[0]' })
const tallRow = css({ minH: 'control.lg' })
// T7 441:66: each crumb and separator 6 after the one before; the BackRow's button ends 6 after Toolkit (its `pe`).
const trail = css({ display: 'flex', alignItems: 'center', gap: '6', minW: '[0]' })
const separator = css({ color: 'fg.subtle' })
// T7 441:270: the item it came from is muted; 441:271: the open item in the default colour.
const crumb = css({
  p: '0',
  bg: 'transparent',
  border: 'none',
  borderRadius: 'sm',
  color: 'fg.muted',
  cursor: 'pointer',
  _hover: { color: 'fg.default' },
  outline: 'none',
  [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
})
const current = css({ color: 'fg.default', truncate: true, minW: '[0]' })
// The crumbs take the BackRow label's style: `labelLg` with the `md` row (T7 441:270, 25 high), `body` with the `sm`
// row (T10 461:249, 20 high), so the trail keeps one size.
const crumbText = { md: css({ textStyle: 'labelLg' }), sm: css({ textStyle: 'body' }) }

export type ToolkitItemBackProps = {
  /** The open item's name, the last crumb. */
  name: string
  /** The item it was opened from; without it the row shows only Back to Toolkit. */
  from?: { name: string; onOpen?: (() => void) | undefined } | null | undefined
  /** Names the open item after Toolkit when there is no `from` (T10, How it works). */
  named?: boolean | undefined
  /** Back to the list. */
  onBack?: (() => void) | undefined
  /** What Back goes back to: Toolkit when not set; Files from a file on a page of its own (T6). */
  label?: string | undefined
  /** Discuss and Show on map. */
  actions: ReactNode
  /**
   * The Figma keys of the row and the breadcrumb: `back row` and the trail's name when not set; D13 names the row
   * `breadcrumb row` and has no layer for the trail alone.
   */
  layers?: { row: string; trail: string | null } | undefined
  /** D13 446:481: the row is 38 high on a workflow's own page (its Show on map); the tablet control height, 36. */
  tall?: boolean | undefined
  /**
   * The BackRow's size: `md` (the default, T3 428:545 and T7 441:67, an 18 px chevron in Figma) or `sm`, the 16 px
   * chevron and the label in `body` of the trail that names the open item (T10 461:245, D13 446:482, T14 475:769).
   */
  size?: 'md' | 'sm' | undefined
}

export function ToolkitItemBack({
  name,
  from,
  named = false,
  onBack,
  label = 'Toolkit',
  actions,
  layers,
  tall = false,
  size = 'md',
}: ToolkitItemBackProps) {
  const hasFrom = from !== undefined && from !== null
  const rowLayer = layers?.row ?? 'back row'
  if (!hasFrom && !named) {
    return (
      <div data-figma={rowLayer}>
        <BackRow label={label} onBack={onBack} size={size}>
          {actions}
        </BackRow>
      </div>
    )
  }
  return (
    <div className={tall ? cx(row, tallRow) : row} data-figma={rowLayer}>
      <nav
        aria-label="Breadcrumb"
        className={trail}
        data-figma={
          layers === undefined
            ? hasFrom
              ? `breadcrumb · Toolkit › ${from.name} › ${name}`
              : undefined
            : (layers.trail ?? undefined)
        }
      >
        <BackRow label={label} onBack={onBack} size={size} />
        {hasFrom ? (
          <>
            <span className={cx(separator, crumbText[size])} aria-hidden="true">
              ›
            </span>
            <button type="button" className={cx(crumb, crumbText[size])} onClick={from.onOpen}>
              {from.name}
            </button>
          </>
        ) : null}
        <span className={cx(separator, crumbText[size])} aria-hidden="true">
          ›
        </span>
        <span className={cx(current, crumbText[size])} aria-current="page">
          {name}
        </span>
      </nav>
      {actions}
    </div>
  )
}
