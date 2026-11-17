// Which layout a screen of a given width takes. The library has no
// breakpoint tokens (LIBRARY_GAPS.md), so the widths come from the shell's
// size tokens: the desktop layout needs the rail, a list pane and the
// detail column side by side (64 + 420 + 748 = 1232 px), and a screen
// narrower than one list pane (420 px) is a phone. The Figma frames are
// 1512 (desktop), 756 (tablet) and 390 (phone) wide.
import { token } from '../../styled-system/tokens/index.js'
import type { Viewport } from './screenState.ts'

const px = (value: string) => Number.parseFloat(value)

/** The narrowest desktop layout: the rail, the list pane and the detail column. */
export const desktopMinWidth =
  px(token('sizes.shell.rail')) + px(token('sizes.shell.listPane')) + px(token('sizes.shell.detail'))

/** The narrowest tablet layout: one list pane. */
export const tabletMinWidth = px(token('sizes.shell.listPane'))

/** The layout for a screen `width` px wide. */
export function viewportForWidth(width: number): Viewport {
  if (width >= desktopMinWidth) return 'desktop'
  if (width >= tabletMinWidth) return 'tablet'
  return 'phone'
}
