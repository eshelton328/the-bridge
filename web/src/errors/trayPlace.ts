// Where the dev ErrorTray sits (W1, bridge-coord): at the window's bottom
// right, as before, unless that covers a part the owner must reach. Then it
// moves straight up until it covers none of them. The parts are every
// library composer (`.composer__root`, its Send and Stop) and every alert,
// which holds each error line with Retry: a send's or a stop's line under a
// composer, a transcript's line, the live notice, and the button to a
// chat's newest message (`[data-newest-slot]`, NewestButton). The place comes from the
// boxes the page draws now, so it follows a composer's real height (a long
// draft, the phone's keyboard) with no fixed offset. A tray that cannot clear
// them all stops at the window's top.

/** A box in window coordinates. */
export type Box = { readonly top: number; readonly right: number; readonly bottom: number; readonly left: number }

/** The parts the tray must never cover. */
const keepClearSelector = '.composer__root, [role="alert"], [data-newest-slot]'

/** The tray's distance from the window's edges at rest, in px: the `12` of its CSS. */
export const trayInset = 12
/** The room the tray keeps above a part it moved over, in px. */
const gap = 8

const meets = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

/**
 * The tray's distance from the window's bottom, in px: `trayInset` when its place at rest covers none of `clear`,
 * else the least distance at which it sits above each part it would cover, `gap` over it.
 */
export function trayBottom(
  tray: { readonly width: number; readonly height: number },
  window: { readonly width: number; readonly height: number },
  clear: readonly Box[],
): number {
  const right = window.width - trayInset
  const left = right - tray.width
  let bottom = trayInset
  // Each step moves the tray above one more part, so it ends within one step for each part.
  for (let step = 0; step <= clear.length; step++) {
    const box = { left, right, bottom: window.height - bottom, top: window.height - bottom - tray.height }
    const hit = clear.find((part) =>
      meets(box, { left: part.left, right: part.right, top: part.top - gap, bottom: part.bottom + gap }),
    )
    if (hit === undefined) return bottom
    bottom = window.height - hit.top + gap
    // No room above it: the tray stops at the window's top.
    if (window.height - bottom - tray.height < trayInset)
      return Math.max(trayInset, window.height - trayInset - tray.height)
  }
  return bottom
}

/** The boxes of the parts in `doc` that the tray must not cover, leaving out `tray`'s own and those not drawn. */
export function keepClearBoxes(doc: Document, tray: Element): Box[] {
  return (
    [...doc.querySelectorAll(keepClearSelector)]
      .filter((part) => !tray.contains(part))
      .map((part) => part.getBoundingClientRect())
      .filter((box) => box.width > 0 && box.height > 0)
      // A DOMRect's sides are getters, which a spread leaves out: copy them.
      .map((box) => ({ top: box.top, right: box.right, bottom: box.bottom, left: box.left }))
  )
}
