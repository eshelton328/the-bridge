// Whether to run the keyboard trace, asked once on load in dev only. With
// `?keyboard-trace` it traces with the overlay. Without the param it asks the
// dev server's switch (`GET /__keyboard-trace/enabled`,
// scripts/keyboardTracePlugin.ts) and, when the switch is on, traces with no
// overlay, so bridge-coord can trace the installed Home Screen app, where no
// one can type a URL. A failed, slow or odd answer means off, with no error
// shown. main.ts calls this only under `import.meta.env.DEV`, and the trace
// itself (keyboardTrace.ts) is a dynamic import, so a build has neither.
import type { startKeyboardTrace, TraceOptions } from './keyboardTrace.ts'

/** How the trace runs: `overlay` from the URL param, `quiet` from the switch, or `off`. */
export type KeyboardTraceMode = 'overlay' | 'quiet' | 'off'

/** The switch the app asks when the URL has no param. */
export const KEYBOARD_TRACE_SWITCH_URL = '/__keyboard-trace/enabled'
/** How long the switch may take before the answer counts as off, in ms. */
const SWITCH_TIMEOUT_MS = 2000

type Running = ReturnType<typeof startKeyboardTrace>

export type SwitchOptions = {
  win?: Window
  fetchSwitch?: (url: string, init: RequestInit) => Promise<Response>
  timeoutMs?: number
  /** Passed to the trace, beside the overlay choice; for tests. */
  trace?: Omit<TraceOptions, 'overlay'>
}

/** Asks the switch; true only for a 200 with `{ "enabled": true }` within the timeout. */
async function switchIsOn(fetchSwitch: NonNullable<SwitchOptions['fetchSwitch']>, timeoutMs: number) {
  const abort = new AbortController()
  const timer = setTimeout(() => {
    abort.abort()
  }, timeoutMs)
  try {
    const res = await fetchSwitch(KEYBOARD_TRACE_SWITCH_URL, { cache: 'no-store', signal: abort.signal })
    if (!res.ok) return false
    const body: unknown = await res.json()
    return typeof body === 'object' && body !== null && Reflect.get(body, 'enabled') === true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/** The trace's mode: the URL param first, else the dev server's switch. */
export async function keyboardTraceMode({
  win = window,
  fetchSwitch = (url, init) => win.fetch(url, init),
  timeoutMs = SWITCH_TIMEOUT_MS,
}: SwitchOptions = {}): Promise<KeyboardTraceMode> {
  if (new URLSearchParams(win.location.search).has('keyboard-trace')) return 'overlay'
  return (await switchIsOn(fetchSwitch, timeoutMs)) ? 'quiet' : 'off'
}

/** Starts the trace when the param or the switch asks for it; undefined when it is off. */
export async function startKeyboardTraceIfOn(options: SwitchOptions = {}): Promise<Running | undefined> {
  const mode = await keyboardTraceMode(options)
  if (mode === 'off') return undefined
  const { startKeyboardTrace } = await import('./keyboardTrace.ts')
  return startKeyboardTrace({
    ...options.trace,
    win: options.trace?.win ?? options.win ?? window,
    overlay: mode === 'overlay',
  })
}
