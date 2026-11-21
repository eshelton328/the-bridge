// For a browser test that checks a label that shows for a few seconds, such as "Copied" for 2 s. On the real clock a
// busy runner can spend that time in one click (2.8 s on the-bridge #311, CI run 44856821777), and the label is gone
// before the test looks.
import { onTestFinished, vi } from 'vitest'

/**
 * Fakes the page's setTimeout and clearTimeout from now, so a timer the app starts waits until the test moves the
 * clock (`vi.advanceTimersByTime`). Call the returned release once the test no longer needs it, before any step that
 * waits on the app's own timers; the test's end releases it too.
 */
export function holdTimers(): () => void {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  const release = () => {
    vi.useRealTimers()
  }
  onTestFinished(release)
  return release
}
