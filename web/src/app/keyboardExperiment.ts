// The keyboard experiments of screen review R26, dev only. iOS scrolls the
// document for one frame as it reports the keyboard (the layout viewport
// shrinks to the visible area with scrollY at the keyboard's height). Two
// ways to take the composer's focus without that scroll are tried on the
// owner's phone:
// - `prevent`: a touch press on a composer field that is not focused
//   cancels the press's default and focuses the field with
//   `preventScroll`, inside the gesture.
// - `proxy`: the same press focuses a hidden input fixed at the top of the
//   screen, which needs no scroll, and moves the focus to the field once
//   the keyboard is up (or after `proxyWaitMs`); iOS keeps the keyboard
//   open when the focus moves between fields.
// A press on a `data-keyboard-keep` control (Send, Stop, Attach), a mouse
// or a pen, or a field that already has the focus, is left alone. main.ts
// imports this module only in development, so a build has none of it.

/** An experiment's name, from `?kb-experiment=` or the dev server's switch. */
export type KeyboardExperiment = 'proxy' | 'prevent'

/** The URL param that picks an experiment in a browser. */
export const KEYBOARD_EXPERIMENT_PARAM = 'kb-experiment'

/** `value` as an experiment, or null for anything else. */
export function parseExperiment(value: unknown): KeyboardExperiment | null {
  return value === 'proxy' || value === 'prevent' ? value : null
}

/** The experiment that `search` (a URL's query string) picks, or null. */
export function experimentFromSearch(search: string): KeyboardExperiment | null {
  return parseExperiment(new URLSearchParams(search).get(KEYBOARD_EXPERIMENT_PARAM))
}

/** The composer field that a press on `target` would focus: a text area or text input in a ScrollFrame footer. */
export function pressedField(target: EventTarget | null): HTMLTextAreaElement | HTMLInputElement | null {
  if (!(target instanceof Element)) return null
  if (target.closest('[data-keyboard-keep]') !== null) return null
  if (target.closest('.scroll-frame__footer') === null) return null
  const field = target.closest('textarea, input')
  if (field instanceof HTMLTextAreaElement) return field
  if (field instanceof HTMLInputElement && (field.type === 'text' || field.type === 'search')) return field
  return null
}

export type ExperimentOptions = {
  win?: Window
  /** The experiment in force at the press; null runs none. */
  current: () => KeyboardExperiment | null
  /** How long the proxy waits for the keyboard before it moves the focus, in ms. */
  proxyWaitMs?: number
}

/** How far the visual viewport must be under the layout's height to count as the keyboard up, in px. */
const KEYBOARD_UP_PX = 100

/** Focuses `field` through a hidden input at the top of the screen; resolves when the field has the focus. */
function focusThroughProxy(win: Window, field: HTMLElement, waitMs: number): Promise<void> {
  const doc = win.document
  const proxy = doc.createElement('input')
  proxy.type = 'text'
  proxy.tabIndex = -1
  proxy.setAttribute('aria-hidden', 'true')
  proxy.setAttribute('data-keyboard-experiment-proxy', '')
  // 16 px, so iOS does not zoom to it; fixed at the top, so focusing it needs no scroll.
  proxy.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;border:0;padding:0'
  doc.body.append(proxy)
  proxy.focus({ preventScroll: true })
  return new Promise((done) => {
    const vv = win.visualViewport
    let timer = 0
    const finish = () => {
      win.clearTimeout(timer)
      vv?.removeEventListener('resize', onResize)
      field.focus({ preventScroll: true })
      proxy.remove()
      done()
    }
    const onResize = () => {
      if (vv !== null && vv.height < win.innerHeight - KEYBOARD_UP_PX) finish()
    }
    vv?.addEventListener('resize', onResize)
    timer = win.setTimeout(finish, waitMs)
  })
}

/** Starts the experiments' press handler; returns a function that stops it. */
export function installKeyboardExperiment({ win = window, current, proxyWaitMs = 600 }: ExperimentOptions): () => void {
  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') return
    const experiment = current()
    if (experiment === null) return
    const field = pressedField(event.target)
    if (field === null || field === win.document.activeElement || field.disabled) return
    event.preventDefault()
    if (experiment === 'prevent') field.focus({ preventScroll: true })
    else void focusThroughProxy(win, field, proxyWaitMs)
  }
  win.document.addEventListener('pointerdown', onPointerDown, { capture: true })
  return () => {
    win.document.removeEventListener('pointerdown', onPointerDown, { capture: true })
  }
}
