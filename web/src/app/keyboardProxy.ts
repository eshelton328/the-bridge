// The composer's focus through a proxy field (screen reviews R26, R27 and
// R37). When a tap gives the composer the focus, iOS scrolls the document to
// bring the field above the keyboard: for one frame the layout viewport is
// the visible area with scrollY at the keyboard's height, and the whole page,
// its top bar too, is drawn low and slides back (the recording of R27). The
// shell's scroll reset cannot stop that slide. So a touch tap on a composer
// with no focus focuses a transparent field that is already where the
// composer docks above the keyboard, and iOS has nothing to scroll into view.
// Once the keyboard is up and the shell's dock has stopped, the focus (and
// any text typed meanwhile) moves to the composer; an IME composition holds
// the move until it ends. iOS keeps the keyboard open when the focus moves
// between fields. The proxy is aria-hidden with tabindex -1, so VoiceOver
// reaches only the real field.
// A press on a control (Send, Stop, Attach), a mouse or a pen, a touch that
// moves (a scroll), a long press and a field that already has the focus are
// left alone. main.ts starts it where an on-screen keyboard slides in and
// out (a touch screen with no VirtualKeyboard API: iOS), in every build. It
// ran as the dev-only 'proxy' experiment from 2026-11-19 to 2026-11-21; the
// iPhone 17 Simulator showed the R27 slide on each open without it.

import { token } from '../../styled-system/tokens/index.js'
import { KEYBOARD_PROXY_EVENT } from '../lib/keyboardProxyEvent.ts'

/** The attribute of the proxy field, which the chat trace takes as the composer (keyboardChatTrace.ts). */
const KEYBOARD_PROXY_ATTRIBUTE = 'data-keyboard-proxy'

type Field = HTMLTextAreaElement | HTMLInputElement

/** A text area, or a text or search input: a field the composer types in. */
function textField(element: Element | null): Field | null {
  if (element instanceof HTMLTextAreaElement) return element
  if (element instanceof HTMLInputElement && (element.type === 'text' || element.type === 'search')) return element
  return null
}

/** The elements in a composer box that do their own action on a tap: Send, Stop, Attach, the model chip, a chip's remove. */
const CONTROL = 'button, a[href], select, summary, [role="button"], [role="link"], [role="menuitem"], [role="option"]'

/**
 * The composer field that a press on 'target' would focus: a text area or text input in a ScrollFrame footer, pressed
 * itself or through its composer box. The composer's field and its Send, Stop and Attach controls sit in one
 * 'data-keyboard-keep' wrapper, the box the owner sees. Its field is one line (20 px) in a box about 112 px tall, so a
 * finger often lands on the box beside the line; iOS then moves the tap's click to the field and focuses it with its
 * own scroll into view (screen review R27, the prevent traces of 2026-11-20). A press on the box takes the box's one
 * field; a press on a control, or in a box with no field or more than one, is never one on a field.
 */
export function pressedField(target: EventTarget | null): Field | null {
  if (!(target instanceof Element)) return null
  if (target.closest('.scroll-frame__footer') === null) return null
  const own = target.closest('textarea, input')
  if (own !== null) return textField(own)
  if (target.closest(CONTROL) !== null) return null
  const box = target.closest('[data-keyboard-keep]')
  if (box === null) return null
  const fields = [...box.querySelectorAll('textarea, input')].flatMap((element) => textField(element) ?? [])
  return fields.length === 1 ? (fields[0] ?? null) : null
}

/** How far the visual viewport must be under its height at the press to count as the keyboard up, in px. */
const KEYBOARD_UP_PX = 100
/** How far a touch may move and still be a tap, in px; past it the touch is a scroll. */
const TAP_SLOP_PX = 10
/**
 * How long a touch may stay down and still be a tap, in ms. iOS starts its long press (the magnifier, the paste menu) at
 * 500 ms, so a longer touch keeps its default.
 */
const TAP_MAX_MS = 450
/**
 * How long the proxy waits, after the keyboard's report, for the shell's dock to stop with the composer above the
 * keyboard, in ms: the dock moves for `durations.keyboard` (300) from about the report.
 */
const DOCK_WAIT_MS = 500
/** The attributes that pick the keyboard iOS draws, copied to the proxy so the keyboard does not change at the move. */
const KEYBOARD_ATTRIBUTES = ['inputmode', 'enterkeyhint', 'autocapitalize', 'autocorrect', 'autocomplete', 'spellcheck']

/** The keyboard's height at its last open in this page, in px; undefined before the first. */
let lastKeyboard: number | undefined

/** The keyboard expected before the first open: the library's 'sizes.shell.keyboard' (Figma's keyboard, 380), as AppShell expects. */
const tokenKeyboard = Number.parseFloat(token('sizes.shell.keyboard'))

/** The box, in the layout viewport, where 'field' will be once the shell docks it on a keyboard 'keyboard' px tall. */
// The shell moves the detail's footer up by how far the keyboard covers the detail, which is less than the keyboard
// where a tab bar or a safe area lies under the detail.
export function dockedBox(
  field: Element,
  keyboard: number,
  win: Window = window,
): { top: number; left: number; width: number; height: number } {
  const rect = field.getBoundingClientRect()
  const detail = field.closest('.app-shell__detail')
  const foot = detail === null ? rect.bottom : detail.getBoundingClientRect().bottom
  const covered = Math.max(0, foot - (win.innerHeight - keyboard))
  return { top: rect.top - covered, left: rect.left, width: rect.width, height: rect.height }
}

/**
 * Gives 'field' the proxy's text and selection. The proxy starts as a copy of the field's draft, so typing, Backspace
 * and a paste in the proxy all edit that draft. The text goes in as typing does, so React's change handler sees it.
 */
function takeEdits(field: Field, proxy: Field): void {
  if (proxy.value !== field.value) {
    field.setRangeText(proxy.value, 0, field.value.length, 'end')
    field.dispatchEvent(new Event('input', { bubbles: true }))
  }
  field.setSelectionRange(proxy.selectionStart, proxy.selectionEnd, proxy.selectionDirection ?? 'none')
}

/** Tells the composer of 'field' that a proxy holds the focus for it (true) or went without giving it (false). */
function tell(field: Field, holding: boolean): void {
  field.dispatchEvent(new CustomEvent(KEYBOARD_PROXY_EVENT, { bubbles: true, detail: holding }))
}

/**
 * Focuses 'field' through a transparent field at its docked place; resolves when the proxy is gone: after the focus
 * moved to 'field', or when the proxy lost the focus to something else first.
 */
function focusThroughProxy(win: Window, field: Field, waitMs: number): Promise<void> {
  const doc = win.document
  const vv = win.visualViewport
  const proxy = doc.createElement(field instanceof HTMLTextAreaElement ? 'textarea' : 'input')
  proxy.setAttribute(KEYBOARD_PROXY_ATTRIBUTE, '')
  // Hidden from VoiceOver and out of the tab order, so assistive technology only ever reaches the real field.
  proxy.setAttribute('aria-hidden', 'true')
  proxy.tabIndex = -1
  for (const name of KEYBOARD_ATTRIBUTES) {
    const value = field.getAttribute(name)
    if (value !== null) proxy.setAttribute(name, value)
  }
  const box = dockedBox(field, lastKeyboard ?? tokenKeyboard, win)
  // Outside the design: fixed where the composer docks, 16 px so iOS does not zoom to it,
  // transparent (not hidden, which iOS does not focus) and never hit by a tap.
  proxy.style.cssText =
    'position:fixed;margin:0;padding:0;border:0;outline:0;resize:none;background:transparent;color:transparent;' +
    'caret-color:transparent;font-size:16px;pointer-events:none;z-index:2147483646;' +
    'top:' +
    String(box.top) +
    'px;left:' +
    String(box.left) +
    'px;width:' +
    String(box.width) +
    'px;height:' +
    String(box.height) +
    'px'
  // A copy of the draft with the caret at its end, as a tap at the end of the composer puts it.
  proxy.value = field.value
  doc.body.append(proxy)
  proxy.setSelectionRange(proxy.value.length, proxy.value.length)
  const openHeight = vv?.height ?? win.innerHeight
  // The composer expands now, as on its own focus, so the hand-off below changes no layout.
  tell(field, true)
  proxy.focus({ preventScroll: true })
  return new Promise((done) => {
    let finished = false
    let timer = 0
    let frame = 0
    // An IME composition (kana, pinyin, dictation) in the proxy: the move waits for its end, so no text is lost.
    let composing = false
    let moveAfterComposition = false
    const end = () => {
      finished = true
      win.clearTimeout(timer)
      win.cancelAnimationFrame(frame)
      vv?.removeEventListener('resize', onResize)
      proxy.removeEventListener('focusout', onLost)
      proxy.removeEventListener('compositionstart', onCompositionStart)
      proxy.removeEventListener('compositionend', onCompositionEnd)
      proxy.remove()
      done()
    }
    const move = () => {
      if (finished) return
      if (composing) {
        moveAfterComposition = true
        return
      }
      if (doc.activeElement === proxy && field.isConnected && !field.disabled) {
        proxy.removeEventListener('focusout', onLost)
        field.focus({ preventScroll: true })
        takeEdits(field, proxy)
      }
      end()
    }
    // The proxy lost the focus to something that is not the composer (a tap outside, the keyboard's Done, a blur from
    // code): no focus move, but its edits still go to the composer, so nothing typed is lost.
    const onLost = () => {
      if (finished) return
      if (field.isConnected && !field.disabled) takeEdits(field, proxy)
      end()
      tell(field, false)
    }
    // The composer is above the keyboard (its foot is in the visible area) and the shell's dock has stopped. iOS draws
    // no frame of the page for 40 to 56 ms after the focus moves between the fields (the iPhone and iPad traces of
    // 2026-11-21: one frame of 36 to 56 ms at the move, 17 ms around it), so the move waits for a still page, where
    // that frame shows nothing late. AppShell writes the time its dock's move ends on its root (`keyboardEnd`).
    const docked = () => vv === null || field.getBoundingClientRect().bottom <= vv.offsetTop + vv.height + 1
    const stopped = () => {
      const end = Number(field.closest<HTMLElement>('.app-shell__root')?.dataset.keyboardEnd)
      return !Number.isFinite(end) || win.performance.now() >= end
    }
    const whenDocked = (deadline: number) => {
      if ((docked() && stopped()) || win.performance.now() >= deadline) move()
      else
        frame = win.requestAnimationFrame(() => {
          whenDocked(deadline)
        })
    }
    const onResize = () => {
      if (vv === null || vv.height >= openHeight - KEYBOARD_UP_PX) return
      vv.removeEventListener('resize', onResize)
      win.clearTimeout(timer)
      whenDocked(win.performance.now() + DOCK_WAIT_MS)
    }
    const onCompositionStart = () => {
      composing = true
    }
    const onCompositionEnd = () => {
      composing = false
      if (moveAfterComposition) move()
    }
    proxy.addEventListener('compositionstart', onCompositionStart)
    proxy.addEventListener('compositionend', onCompositionEnd)
    proxy.addEventListener('focusout', onLost)
    vv?.addEventListener('resize', onResize)
    timer = win.setTimeout(move, waitMs)
  })
}

export type KeyboardProxyOptions = {
  win?: Window
  /** How long the proxy waits for the keyboard's report before it moves the focus, in ms. */
  proxyWaitMs?: number
}

/** Starts the tap handler that focuses a composer through the proxy; returns a function that stops it. */
export function installKeyboardProxy({ win = window, proxyWaitMs = 600 }: KeyboardProxyOptions = {}): () => void {
  const doc = win.document
  // The touch that is down on a composer field with no focus, until it moves, is cancelled or ends.
  let press: { field: Field; x: number; y: number; at: number } | undefined
  let proxying = false
  const onPointerDown = (event: PointerEvent) => {
    press = undefined
    if (event.pointerType !== 'touch') return
    const field = pressedField(event.target)
    if (field === null || field === doc.activeElement || field.disabled) return
    press = { field, x: event.clientX, y: event.clientY, at: event.timeStamp }
  }
  const onPointerMove = (event: PointerEvent) => {
    if (press !== undefined && Math.hypot(event.clientX - press.x, event.clientY - press.y) > TAP_SLOP_PX)
      press = undefined
  }
  const onPointerCancel = () => {
    press = undefined
  }
  // 'touchend' is the event whose default is the tap's click and focus on iOS, and a focus from script inside it
  // opens the keyboard.
  const onTouchEnd = (event: Event) => {
    const taken = press
    press = undefined
    if (taken === undefined || !event.cancelable) return
    // A long press keeps its default: iOS's magnifier and paste menu.
    if (event.timeStamp - taken.at > TAP_MAX_MS) return
    const { field } = taken
    if (!field.isConnected || field.disabled || field === doc.activeElement) return
    event.preventDefault()
    if (proxying) return
    proxying = true
    void focusThroughProxy(win, field, proxyWaitMs).then(() => {
      proxying = false
    })
  }
  // The keyboard's height, kept for the proxy's place at the next open.
  const vv = win.visualViewport
  const onViewport = () => {
    if (
      vv === null ||
      !(doc.activeElement instanceof HTMLTextAreaElement || doc.activeElement instanceof HTMLInputElement)
    )
      return
    const keyboard = win.innerHeight - vv.height
    if (keyboard > KEYBOARD_UP_PX) lastKeyboard = keyboard
  }
  const capture = { capture: true }
  doc.addEventListener('pointerdown', onPointerDown, capture)
  doc.addEventListener('pointermove', onPointerMove, capture)
  doc.addEventListener('pointercancel', onPointerCancel, capture)
  doc.addEventListener('touchend', onTouchEnd, { capture: true, passive: false })
  vv?.addEventListener('resize', onViewport)
  return () => {
    doc.removeEventListener('pointerdown', onPointerDown, capture)
    doc.removeEventListener('pointermove', onPointerMove, capture)
    doc.removeEventListener('pointercancel', onPointerCancel, capture)
    doc.removeEventListener('touchend', onTouchEnd, capture)
    vv?.removeEventListener('resize', onViewport)
  }
}

/**
 * Whether the composer takes its focus through the proxy here: where an on-screen keyboard slides in and out that only
 * the visual viewport reports, a touch screen whose browser has no VirtualKeyboard API (iOS Safari and the installed
 * app), as AppShell's dock reads it. Chromium on Android has the API and resizes the layout for its keyboard.
 */
export function proxyFocusApplies(
  win: { matchMedia: (query: string) => { matches: boolean }; navigator: object } = window,
): boolean {
  return win.matchMedia('(pointer: coarse)').matches && Reflect.get(win.navigator, 'virtualKeyboard') === undefined
}
