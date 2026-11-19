// The keyboard experiments of screen reviews R26 and R27, dev only. When a
// tap gives the composer the focus, iOS scrolls the document to bring the
// field above the keyboard: for one frame the layout viewport is the visible
// area with scrollY at the keyboard's height, and the whole page, its top bar
// too, is drawn low and slides back (the recording of R27). The shell's
// scroll reset cannot stop that slide. Two ways to take the focus with no
// scroll are tried on the owner's phone:
// - 'prevent': the tap's default (the browser's own focus) is cancelled at
//   'touchend' and the field is focused by script with 'preventScroll',
//   inside the gesture. WebKit honours 'preventScroll' for the keyboard's
//   scroll only for a focus from script (WebKit bug 236584).
// - 'proxy': the same tap focuses a transparent field that is already where
//   the composer docks above the keyboard, so iOS has nothing to scroll into
//   view, and moves the focus (and any text typed meanwhile) to the composer
//   once the keyboard is up and the composer is above it (after an IME
//   composition ends). iOS keeps the keyboard open when the focus moves
//   between fields. The proxy is aria-hidden with tabindex -1, so VoiceOver
//   reaches only the real field.
// A press on a control (Send, Stop, Attach), a mouse or a pen, a touch that
// moves (a scroll) and a field that already has the focus are left alone.
// The experiment comes from '?kb-experiment=' or, without the param, from
// the dev server's switch (scripts/keyboardTracePlugin.ts), asked every 5 s
// while the page is visible, so bridge-coord changes it in the installed
// Home Screen app with one file. main.ts imports this module only in
// development, so a build has none of it.

import { token } from '../../styled-system/tokens/index.js'

/** An experiment's name, from '?kb-experiment=' or the dev server's switch. */
export type KeyboardExperiment = 'proxy' | 'prevent'

/** The URL param that picks an experiment in a browser. */
export const KEYBOARD_EXPERIMENT_PARAM = 'kb-experiment'
/** The switch the app asks when the URL has no param. */
export const KEYBOARD_EXPERIMENT_SWITCH_URL = '/__keyboard-trace/experiment'
/** The attribute of the proxy field, which the chat trace takes as the composer (keyboardChatTrace.ts). */
export const KEYBOARD_PROXY_ATTRIBUTE = 'data-keyboard-experiment-proxy'

/** 'value' as an experiment, or null for anything else. */
export function parseExperiment(value: unknown): KeyboardExperiment | null {
  return value === 'proxy' || value === 'prevent' ? value : null
}

/** The experiment that 'search' (a URL's query string) picks, or null. */
export function experimentFromSearch(search: string): KeyboardExperiment | null {
  return parseExperiment(new URLSearchParams(search).get(KEYBOARD_EXPERIMENT_PARAM))
}

type Field = HTMLTextAreaElement | HTMLInputElement

/** The composer field that a press on 'target' would focus: a text area or text input in a ScrollFrame footer. */
// The composer's field and its Send, Stop and Attach controls sit in one 'data-keyboard-keep' wrapper, so only the
// pressed element itself counts: a press on a field is taken, and a press on a control is never one on a field.
export function pressedField(target: EventTarget | null): Field | null {
  if (!(target instanceof Element)) return null
  if (target.closest('.scroll-frame__footer') === null) return null
  const field = target.closest('textarea, input')
  if (field instanceof HTMLTextAreaElement) return field
  if (field instanceof HTMLInputElement && (field.type === 'text' || field.type === 'search')) return field
  return null
}

/** How far the visual viewport must be under its height at the press to count as the keyboard up, in px. */
const KEYBOARD_UP_PX = 100
/** How far a touch may move and still be a tap, in px; past it the touch is a scroll. */
const TAP_SLOP_PX = 10
/** How long the proxy waits, after the keyboard's report, for the shell to move the composer above the keyboard, in ms. */
const DOCK_WAIT_MS = 400
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

/** Adds 'typed' at the end of 'field' as typing does, so React's change handler sees it. */
function addTyped(field: Field, typed: string): void {
  const end = field.value.length
  field.setRangeText(typed, end, end, 'end')
  field.dispatchEvent(new Event('input', { bubbles: true }))
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
  // Outside the design, for the experiment only: fixed where the composer docks, 16 px so iOS does not zoom to it,
  // transparent (not hidden, which iOS does not focus) and never hit by a tap.
  proxy.style.cssText =
    'position:fixed;margin:0;padding:0;border:0;outline:0;resize:none;background:transparent;color:transparent;' +
    'caret-color:transparent;font-size:16px;pointer-events:none;z-index:2147483646;' +
    'top:' + String(box.top) + 'px;left:' + String(box.left) + 'px;width:' + String(box.width) + 'px;height:' + String(box.height) + 'px'
  doc.body.append(proxy)
  const openHeight = vv?.height ?? win.innerHeight
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
      const typed = proxy.value
      if (doc.activeElement === proxy && field.isConnected && !field.disabled) {
        proxy.removeEventListener('focusout', onLost)
        field.focus({ preventScroll: true })
        if (typed !== '') addTyped(field, typed)
      }
      end()
    }
    // The proxy lost the focus to something that is not the composer (a tap outside, a blur from code): no move.
    const onLost = () => {
      if (!finished) end()
    }
    // The composer is above the keyboard: its foot is in the visible area.
    const docked = () => vv === null || field.getBoundingClientRect().bottom <= vv.offsetTop + vv.height + 1
    const whenDocked = (deadline: number) => {
      if (docked() || win.performance.now() >= deadline) move()
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

export type ExperimentOptions = {
  win?: Window
  /** The experiment in force at the tap; null runs none. */
  current: () => KeyboardExperiment | null
  /** How long the proxy waits for the keyboard's report before it moves the focus, in ms. */
  proxyWaitMs?: number
}

/** Starts the experiments' tap handler; returns a function that stops it. */
export function installKeyboardExperiment({ win = window, current, proxyWaitMs = 600 }: ExperimentOptions): () => void {
  const doc = win.document
  // The touch that is down on a composer field with no focus, until it moves, is cancelled or ends.
  let press: { field: Field; x: number; y: number } | undefined
  let proxying = false
  const onPointerDown = (event: PointerEvent) => {
    press = undefined
    if (event.pointerType !== 'touch' || current() === null) return
    const field = pressedField(event.target)
    if (field === null || field === doc.activeElement || field.disabled) return
    press = { field, x: event.clientX, y: event.clientY }
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
    const experiment = current()
    if (taken === undefined || experiment === null || !event.cancelable) return
    const { field } = taken
    if (!field.isConnected || field.disabled || field === doc.activeElement) return
    event.preventDefault()
    if (experiment === 'prevent') {
      field.focus({ preventScroll: true })
      return
    }
    if (proxying) return
    proxying = true
    void focusThroughProxy(win, field, proxyWaitMs).then(() => {
      proxying = false
    })
  }
  // The keyboard's height, kept for the proxy's place at the next open.
  const vv = win.visualViewport
  const onViewport = () => {
    if (vv === null || !(doc.activeElement instanceof HTMLTextAreaElement || doc.activeElement instanceof HTMLInputElement))
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

export type ExperimentSwitchOptions = {
  win?: Window
  fetchSwitch?: (url: string, init: RequestInit) => Promise<Response>
  /** How often the switch is asked while the page is visible, in ms. */
  pollMs?: number
  proxyWaitMs?: number
}

/**
 * Runs the experiment that the URL param names, else the one the dev server's switch names, asked at the start, every
 * 'pollMs' while the page is visible and each time it becomes visible. The param wins and stops the asking; automation
 * ('navigator.webdriver') never asks, as for the trace. The experiment in force is on the root element as
 * 'data-kb-experiment', which the trace's header reads. A failed answer keeps the experiment as it is.
 */
export function startKeyboardExperiment({
  win = window,
  fetchSwitch = (url, init) => win.fetch(url, init),
  pollMs = 5000,
  proxyWaitMs,
}: ExperimentSwitchOptions = {}): { stop: () => void; current: () => KeyboardExperiment | null } {
  const doc = win.document
  const fromUrl = experimentFromSearch(win.location.search)
  let active = fromUrl
  const mark = () => {
    if (active === null) delete doc.documentElement.dataset.kbExperiment
    else doc.documentElement.dataset.kbExperiment = active
  }
  mark()
  const stopTaps = installKeyboardExperiment({
    win,
    current: () => active,
    ...(proxyWaitMs === undefined ? {} : { proxyWaitMs }),
  })
  // An object, not a let: the lint narrows a let to false across the await, but stop() can run meanwhile.
  const run = { stopped: false }
  let asking = false
  const ask = async () => {
    if (run.stopped || asking || doc.visibilityState !== 'visible') return
    asking = true
    try {
      const res = await fetchSwitch(KEYBOARD_EXPERIMENT_SWITCH_URL, { cache: 'no-store' })
      if (!res.ok) return
      const body: unknown = await res.json()
      if (run.stopped || typeof body !== 'object' || body === null) return
      active = parseExperiment(Reflect.get(body, 'experiment'))
      mark()
    } catch {
      // The dev server is away for a moment: the experiment stays.
    } finally {
      asking = false
    }
  }
  const onVisible = () => {
    void ask()
  }
  let timer = 0
  if (fromUrl === null && !win.navigator.webdriver) {
    timer = win.setInterval(onVisible, pollMs)
    doc.addEventListener('visibilitychange', onVisible)
    void ask()
  }
  return {
    stop: () => {
      run.stopped = true
      win.clearInterval(timer)
      doc.removeEventListener('visibilitychange', onVisible)
      stopTaps()
      active = null
      mark()
    },
    current: () => active,
  }
}
