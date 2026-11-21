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
 * How long after the press ends its click may come, in ms; past it, or after a cancelled press (a scroll), the
 * paperclip opens the input again, so Enter or Space on it still works.
 */
const CLICK_WAIT_MS = 500

/**
 * For the composer box around the paperclip (`attachLabel` names its button): `onPointerDownCapture` goes on the
 * box, and the paperclip's handler opens the input only when `opens()` is true.
 */
export function useKeyboardFirst(attachLabel: string) {
  const closeOnlyRef = useRef(false)
  const endRef = useRef<(() => void) | undefined>(undefined)
  const clear = () => {
    closeOnlyRef.current = false
    endRef.current?.()
    endRef.current = undefined
  }
  const onPointerDownCapture = (event: PointerEvent<HTMLElement>) => {
    clear()
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return
    const target = event.target
    if (!(target instanceof Element)) return
    if (target.closest(`button[aria-label="${CSS.escape(attachLabel)}"]`) === null) return
    if (!keyboardUp(target)) return
    closeOnlyRef.current = true
    // Only this press's own click is held back: a cancelled press clears it at once, an ended one after its click.
    const doc = target.ownerDocument
    const win = doc.defaultView ?? window
    let timer: number | undefined
    const onUp = () => {
      timer = win.setTimeout(clear, CLICK_WAIT_MS)
    }
    doc.addEventListener('pointerup', onUp, true)
    doc.addEventListener('pointercancel', clear, true)
    endRef.current = () => {
      doc.removeEventListener('pointerup', onUp, true)
      doc.removeEventListener('pointercancel', clear, true)
      win.clearTimeout(timer)
    }
    const focused = doc.activeElement
    if (focused instanceof HTMLElement) focused.blur()
  }
  /** Whether this click opens the input: false once, for the press that closed the keyboard. */
  const opens = () => {
    const closeOnly = closeOnlyRef.current
    clear()
    return !closeOnly
  }
  return { onPointerDownCapture, opens }
}
