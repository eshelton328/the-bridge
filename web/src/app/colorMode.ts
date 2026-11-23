// Applies the colour mode setting (d-119): the library's dark values sit
// under Panda's `dark` condition, the `dark` class on <html>, which
// index.html sets by default. Light removes the class, Dark keeps it and
// System follows the device's prefers-color-scheme and changes with it.
// index.html's inline script applies the saved mode before the first paint
// with the same rule; this keeps it applied after each change
// (startSettingsStorage's onChange, main.ts). The theme-color meta, which
// colours the iOS status bar and the browser's bar, follows the class: it
// takes the bg.canvas value the class gives.
import type { Mode } from '../lib/deviceSettings.ts'

/** Whether `mode` draws the dark values when the device prefers dark (`deviceDark`). */
export function isDark(mode: Mode, deviceDark: boolean): boolean {
  return mode === 'system' ? deviceDark : mode !== 'light'
}

/** The part of a MediaQueryList this file uses. */
type SchemeQuery = {
  readonly matches: boolean
  addEventListener: (type: 'change', listener: () => void) => void
  removeEventListener: (type: 'change', listener: () => void) => void
}

type ModeWindow = {
  readonly matchMedia: (query: string) => SchemeQuery
  readonly document: Pick<Document, 'documentElement' | 'querySelector'>
  readonly getComputedStyle: (element: Element) => Pick<CSSStyleDeclaration, 'getPropertyValue'>
}

/** The CSS variable Panda generates for the library's bg.canvas token. */
export const canvasVariable = '--colors-bg-canvas'

/**
 * Follows the mode in `win`: `apply(mode)` sets the class and the
 * theme-color now, and while the mode is System a change of the device's
 * scheme sets them again. Returns the stop.
 */
export function followColorMode(win: ModeWindow = window): { apply: (mode: Mode) => void; stop: () => void } {
  const query = win.matchMedia('(prefers-color-scheme: dark)')
  let mode: Mode = 'dark'
  const set = () => {
    const root = win.document.documentElement
    root.classList.toggle('dark', isDark(mode, query.matches))
    const canvas = win.getComputedStyle(root).getPropertyValue(canvasVariable).trim()
    if (canvas !== '') win.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', canvas)
  }
  query.addEventListener('change', set)
  return {
    apply: (next) => {
      mode = next
      set()
    },
    stop: () => {
      query.removeEventListener('change', set)
    },
  }
}
