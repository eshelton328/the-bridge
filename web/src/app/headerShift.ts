// The R57 shift, a dev-only experiment beside the chat header dump (headerTrace.ts). It asks the dev server's shift
// (`GET /__keyboard-trace/shift`, scripts/keyboardTracePlugin.ts) every few seconds and moves the app's root down by
// the `shiftTop` it answers, with no reload, so a blurred band at the top of the iPad's web view can be told apart:
// a band that stays where it was belongs to the system, one that moves with the app is drawn by the page.
// keyboardTraceSwitch.ts starts it with the trace and imports it dynamically, so a build leaves it out. It moves
// `#root` with `top` only (fixed, `inset: 0` under `html[data-app]`), never a transform, which would put the app
// on a layer of its own. With the answer 0, a failed or odd answer, it puts `#root` back as it was.

/** The shift the app asks. */
export const SHIFT_URL = '/__keyboard-trace/shift'

export type ShiftOptions = {
  win?: Window
  fetchShift?: (url: string, init: RequestInit) => Promise<Response>
  /** How often it asks, in ms. */
  everyMs?: number
}

/** The answer's `shiftTop` when it is a whole number from 0 to 200, else 0. */
async function readShift(fetchShift: NonNullable<ShiftOptions['fetchShift']>): Promise<number> {
  try {
    const res = await fetchShift(SHIFT_URL, { cache: 'no-store' })
    if (!res.ok) return 0
    const body: unknown = await res.json()
    const value: unknown = typeof body === 'object' && body !== null ? Reflect.get(body, 'shiftTop') : undefined
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 200 ? value : 0
  } catch {
    return 0
  }
}

/** Asks the shift at once and every `everyMs`, and applies each answer to `#root`; returns the function that stops it and puts `#root` back. */
export function startHeaderShift({
  win = window,
  fetchShift = (url, init) => win.fetch(url, init),
  everyMs = 2000,
}: ShiftOptions = {}): { stop: () => void } {
  let applied = 0
  let stopped = false
  const apply = (shift: number) => {
    if (stopped || shift === applied) return
    const root = win.document.getElementById('root')
    if (root === null) return
    if (shift === 0) root.style.removeProperty('top')
    else root.style.setProperty('top', `${String(shift)}px`)
    applied = shift
  }
  // Asks can overlap on a slow link: an answer older than one already applied is dropped, so an old 40 never moves
  // the app again after a newer 0.
  let asked = 0
  let newest = 0
  const ask = () => {
    const n = ++asked
    void readShift(fetchShift).then((shift) => {
      if (n < newest) return
      newest = n
      apply(shift)
    })
  }
  ask()
  const timer = win.setInterval(ask, everyMs)
  return {
    stop: () => {
      win.clearInterval(timer)
      apply(0)
      stopped = true
    },
  }
}
