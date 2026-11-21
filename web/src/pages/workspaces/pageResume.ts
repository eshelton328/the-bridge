// The page's trips to the background, for the live transcript streams. iOS
// closes a page's open connections while the phone keeps the page in the
// background, and the page sees that close only when it shows again: a stream
// that ends then is expected, not an outage (the served log of 2026-11-21:
// each "ended" report came 0.4 to 1.5 s before the page read its workspaces
// again, and the server logged no failure). `liveTranscript.ts` asks
// `resumeMark()` when a connection starts and `fromBackground(mark)` when it
// misses.

/** How long after the page shows again a connection that starts still counts as part of the return. */
export const resumeGraceMs = 5000

/**
 * How many times the page went to the background, whether it is there now, and when it last came back
 * (performance.now()). Safari sends both visibilitychange and pagehide or pageshow for one trip: a trip counts once.
 */
const page = { hides: 0, away: false, shownAt: Number.NEGATIVE_INFINITY }
const showListeners = new Set<() => void>()

/** The page is in the background now. */
export const isHidden = (): boolean => document.visibilityState === 'hidden'

function onHide() {
  if (page.away) return
  page.away = true
  page.hides += 1
}

function onShow() {
  if (!page.away || isHidden()) return
  page.away = false
  page.shownAt = performance.now()
  for (const listener of [...showListeners]) listener()
}

function onVisibility() {
  if (isHidden()) onHide()
  else onShow()
}

let listening = false

/** Starts following the page's visibility, once; the transcript module calls it when it loads. */
export function followPageVisibility(): void {
  if (listening || typeof document === 'undefined') return
  listening = true
  document.addEventListener('visibilitychange', onVisibility)
  // Safari sends pagehide and pageshow too, and a page back from its cache may send only those.
  window.addEventListener('pagehide', onHide)
  window.addEventListener('pageshow', onShow)
}

/** Where the page stands when a connection starts: hidden, just back from the background, or neither. */
export type ResumeMark = { readonly hides: number; readonly resuming: boolean }

export function resumeMark(): ResumeMark {
  return { hides: page.hides, resuming: isHidden() || performance.now() - page.shownAt < resumeGraceMs }
}

/**
 * A miss of the connection that started at `mark` came from a trip to the background: the page is hidden now, it went
 * to the background while the connection was open, or the connection started while it was hidden or just back.
 */
export const fromBackground = (mark: ResumeMark): boolean => isHidden() || page.hides !== mark.hides || mark.resuming

/** The number of the page's trips to the background so far: one quiet miss is allowed for each. */
export const hidesSoFar = (): number => page.hides

/** Resolves when the page is visible: at once if it is, else when it shows again or `signal` ends. */
export function whenVisible(signal: AbortSignal): Promise<void> {
  if (!isHidden() || signal.aborted) return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => {
      showListeners.delete(done)
      signal.removeEventListener('abort', done)
      resolve()
    }
    showListeners.add(done)
    signal.addEventListener('abort', done, { once: true })
  })
}
