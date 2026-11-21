// For a browser test that checks a label that shows for a few seconds, such as "Copied" for 2 s. On the real clock a
// busy runner can spend that time in one click (2.8 s on the-bridge #311, CI run 44856821777), and the label is gone
// before the test looks.
import { onTestFinished, vi } from 'vitest'

/**
 * Fakes the page's setTimeout and clearTimeout from now, so a timer the app starts waits until the test moves the
 * clock (`vi.advanceTimersByTime`). Vitest moves it too: each page action (click, fill, keyboard) advances it by
 * 50 ms every 50 ms while the action runs, and each failed expect.element or expect.poll try by its interval. A step
 * that must not let a timer fire uses neither: `clickNow()` or another DOM event, and `renderedUntil()`
 * (`rendering.ts`), which waits by rendering steps. Call the returned release once the test no longer needs it, before any step that waits on the
 * app's own timers; the test's end releases it too.
 */
export function holdTimers(): () => void {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  const release = () => {
    vi.useRealTimers()
  }
  onTestFinished(release)
  return release
}

/** Clicks `element` with a DOM click, which moves no held clock, as a Vitest page action does. */
export function clickNow(element: Element): void {
  if (!(element instanceof HTMLElement)) throw new Error('only an HTML element takes a click')
  element.click()
}
