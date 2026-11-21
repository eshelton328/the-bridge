// The paperclip's first tap while the phone's keyboard is up only closes the keyboard (screen review R29). iOS opens
// the file menu (Photo Library, Take Photo or Video, Choose Files) at the point of the last touch, and opening it closes
// the keyboard: the composer then drops to the bottom and the menu stays mid-screen, where the paperclip was. A tap
// that opens the input later, once the keyboard has closed, still opens the menu at the first touch (the Simulator
// probe of R29), so the first tap only blurs the box. The next tap, with the keyboard closed, lands on the paperclip
// at its closed-keyboard place and opens the input at once.
//
// The keyboard counts as up while AppShell docks the footer on it (`--app-shell-keyboard` on its root), the state
// its own tap rule reads (library beta.68, R19). Only a touch or pen press counts: a mouse or the keys open the
// input at once, and so does a tap with the keyboard closed.
import { type PointerEvent, useRef } from 'react'

/** Whether AppShell has the footer of `el`'s page docked on an on-screen keyboard. */
function keyboardUp(el: Element): boolean {
  const shell = el.closest('.app-shell__root')
  return shell instanceof HTMLElement && shell.style.getPropertyValue('--app-shell-keyboard') !== ''
}

/**
 * For the composer box around the paperclip (`attachLabel` names its button): `onPointerDownCapture` goes on the
 * box, and the paperclip's handler opens the input only when `opens()` is true.
 */
export function useKeyboardFirst(attachLabel: string) {
  const closeOnlyRef = useRef(false)
  const onPointerDownCapture = (event: PointerEvent<HTMLElement>) => {
    closeOnlyRef.current = false
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return
    const target = event.target
    if (!(target instanceof Element)) return
    if (target.closest(`button[aria-label="${CSS.escape(attachLabel)}"]`) === null) return
    if (!keyboardUp(target)) return
    closeOnlyRef.current = true
    const focused = target.ownerDocument.activeElement
    if (focused instanceof HTMLElement) focused.blur()
  }
  /** Whether this click opens the input: false once, for the press that closed the keyboard. */
  const opens = () => {
    const closeOnly = closeOnlyRef.current
    closeOnlyRef.current = false
    return !closeOnly
  }
  return { onPointerDownCapture, opens }
}
