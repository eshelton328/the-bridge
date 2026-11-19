// Whether to run the keyboard trace, asked once on load in dev only. With
// `?keyboard-trace` it traces the whole page with the overlay
// (keyboardTrace.ts). Without the param it asks the dev server's switch
// (`GET /__keyboard-trace/enabled`, scripts/keyboardTracePlugin.ts) and, when
// the switch is on, runs the chat sessions with no overlay
// (keyboardChatTrace.ts): one short trace per keyboard open in a Workspaces
// chat, so bridge-coord can trace the installed Home Screen app, where no one
// can type a URL. A failed, slow or odd answer means off, with no error
// shown. main.ts calls this only under `import.meta.env.DEV`, and both trace
// modules are dynamic imports, so a build has none of them.
import type { ChatTraceOptions, RouteSource } from './keyboardChatTrace.ts'
import type { TraceOptions } from './keyboardTrace.ts'

/** How the trace runs: `overlay` from the URL param, `quiet` from the switch, or `off`. */
export type KeyboardTraceMode = 'overlay' | 'quiet' | 'off'

/** The switch the app asks when the URL has no param. */
export const KEYBOARD_TRACE_SWITCH_URL = '/__keyboard-trace/enabled'
/** How long the switch may take before the answer counts as off, in ms. */
const SWITCH_TIMEOUT_MS = 2000

export type SwitchOptions = {
  win?: Window
  fetchSwitch?: (url: string, init: RequestInit) => Promise<Response>
  timeoutMs?: number
  /** The router's location and its changes, for the chat sessions; the page's URL with no changes when not set. */
  route?: RouteSource
  /** Passed to the trace, beside the overlay choice; for tests. */
  trace?: Omit<TraceOptions, 'overlay' | 'win'> & Pick<ChatTraceOptions, 'closeDelayMs'>
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

/** The page's own URL, which changes only on a load; main.ts passes the router's instead. */
const windowRoute = (win: Window): RouteSource => ({
  current: () => ({ pathname: win.location.pathname, search: win.location.search }),
  subscribe: () => () => undefined,
})

/**
 * Starts the whole-page trace for the param, or the chat sessions for the switch; undefined when it is off. Returns
 * the function that stops it.
 */
export async function startKeyboardTraceIfOn(options: SwitchOptions = {}): Promise<{ stop: () => void } | undefined> {
  const mode = await keyboardTraceMode(options)
  const win = options.win ?? window
  const { closeDelayMs, ...trace } = options.trace ?? {}
  if (mode === 'overlay') {
    const { startKeyboardTrace } = await import('./keyboardTrace.ts')
    return startKeyboardTrace({ ...trace, win, overlay: true })
  }
  if (mode === 'off') return undefined
  const { startChatKeyboardTrace } = await import('./keyboardChatTrace.ts')
  return startChatKeyboardTrace({
    ...trace,
    ...(closeDelayMs === undefined ? {} : { closeDelayMs }),
    win,
    route: options.route ?? windowRoute(win),
  })
}
