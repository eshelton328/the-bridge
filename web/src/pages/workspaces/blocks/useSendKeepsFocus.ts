// Send keeps the keyboard up, as chat apps do (the owner's phone, 2026-11-21: "the
// keyboard closes before the message actually gets sent"). A press on the
// composer's Send would move the focus out of the message box, and iOS closes
// the keyboard when its field loses the focus. So a press on Send cancels the
// default of 'pointerdown', 'mousedown' and 'touchstart' (the focus move) and
// the box keeps the focus through the send, the 204 and the box emptying.
// iOS sends no click for a touch whose 'touchstart' was cancelled, so a touch
// that ends on Send clicks it from script. Tab, Enter and Space on Send, and
// Enter in the box, never press it with a pointer, so they work as before.
// The library's Composer has no prop for this (LIBRARY_GAPS.md: Send keeps
// the focus), so the page listens on the composer's wrapper.

import { type RefObject, useEffect } from 'react'

/** The library Composer's Send button (its aria-label). */
const SEND = 'button[aria-label="Send"]'

/** The Send button of 'box' that 'target' is in, else null. */
function sendOf(box: HTMLElement, target: EventTarget | null): HTMLButtonElement | null {
  if (!(target instanceof Element)) return null
  const button = target.closest(SEND)
  return button instanceof HTMLButtonElement && box.contains(button) ? button : null
}

/** Keeps the focus where it is on a press of the Send button inside 'ref' (the composer's wrapper). */
export function useSendKeepsFocus(ref: RefObject<HTMLElement | null>, remount: unknown): void {
  useEffect(() => {
    const box = ref.current
    if (box === null) return
    // The Send a touch started on, until the touch ends.
    let touched: HTMLButtonElement | null = null
    const keep = (event: Event) => {
      if (sendOf(box, event.target) !== null) event.preventDefault()
    }
    const touchStart = (event: TouchEvent) => {
      touched = event.touches.length === 1 ? sendOf(box, event.target) : null
      if (touched !== null) event.preventDefault()
    }
    const touchEnd = (event: TouchEvent) => {
      const button = touched
      touched = null
      if (button === null) return
      event.preventDefault()
      const touch = event.changedTouches[0]
      // A touch that slid off Send, as a cancelled tap does, sends nothing.
      const at = touch === undefined ? null : box.ownerDocument.elementFromPoint(touch.clientX, touch.clientY)
      if (at !== null && button.contains(at) && !button.disabled) button.click()
    }
    const touchCancel = () => {
      touched = null
    }
    box.addEventListener('pointerdown', keep)
    box.addEventListener('mousedown', keep)
    box.addEventListener('touchstart', touchStart, { passive: false })
    box.addEventListener('touchend', touchEnd, { passive: false })
    box.addEventListener('touchcancel', touchCancel)
    return () => {
      box.removeEventListener('pointerdown', keep)
      box.removeEventListener('mousedown', keep)
      box.removeEventListener('touchstart', touchStart)
      box.removeEventListener('touchend', touchEnd)
      box.removeEventListener('touchcancel', touchCancel)
    }
  }, [ref, remount])
}
