// An open item's back row on a tablet or phone (T3 428:543): Back to Toolkit,
// with Discuss and Show on map at its end. When the item was opened from
// another item's links (T7 441:65), Back to Toolkit starts a breadcrumb
// (441:66): Toolkit › that item › the open item, and that item's crumb goes
// back to it. On a tab other than the Overview (T10 461:244) the row names the
// open item after Toolkit: Toolkit › the open item. The library has no breadcrumb (LIBRARY_GAPS.md, Item
// breadcrumb), so the crumbs after the BackRow are text in its label style
// and the item's crumb a plain button. Props only.
import { BackRow } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'

// T7 441:65: the breadcrumb at the start, the actions at the end (their own `ms: auto`).
const row = css({ display: 'flex', alignItems: 'center', minW: '[0]' })
// T7 441:66: each crumb and separator 6 after the one before; the BackRow's button ends 6 after Toolkit (its `pe`).
const trail = css({ display: 'flex', alignItems: 'center', gap: '6', minW: '[0]' })
const separator = css({ textStyle: 'labelLg', color: 'fg.subtle' })
// T7 441:270: the item it came from is muted; 441:271: the open item in the default colour.
const crumb = css({
  p: '0',
  bg: 'transparent',
  border: 'none',
  borderRadius: 'sm',
  textStyle: 'labelLg',
  color: 'fg.muted',
  cursor: 'pointer',
  _hover: { color: 'fg.default' },
  _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
})
const current = css({ textStyle: 'labelLg', color: 'fg.default', truncate: true, minW: '[0]' })

export type ToolkitItemBackProps = {
  /** The open item's name, the last crumb. */
  name: string
  /** The item it was opened from; without it the row shows only Back to Toolkit. */
  from?: { name: string; onOpen?: (() => void) | undefined } | null | undefined
  /** Names the open item after Toolkit when there is no `from` (T10, How it works). */
  named?: boolean | undefined
  /** Back to the list. */
  onBack?: (() => void) | undefined
  /** Discuss and Show on map. */
  actions: ReactNode
}

export function ToolkitItemBack({ name, from, named = false, onBack, actions }: ToolkitItemBackProps) {
  const hasFrom = from !== undefined && from !== null
  if (!hasFrom && !named) {
    return (
      <div data-figma="back row">
        <BackRow label="Toolkit" onBack={onBack}>
          {actions}
        </BackRow>
      </div>
    )
  }
  return (
    <div className={row} data-figma="back row">
      <nav
        aria-label="Breadcrumb"
        className={trail}
        data-figma={hasFrom ? `breadcrumb · Toolkit › ${from.name} › ${name}` : undefined}
      >
        <BackRow label="Toolkit" onBack={onBack} />
        {hasFrom ? (
          <>
            <span className={separator} aria-hidden="true">
              ›
            </span>
            <button type="button" className={crumb} onClick={from.onOpen}>
              {from.name}
            </button>
          </>
        ) : null}
        <span className={separator} aria-hidden="true">
          ›
        </span>
        <span className={current} aria-current="page">
          {name}
        </span>
      </nav>
      {actions}
    </div>
  )
}
