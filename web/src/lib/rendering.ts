// Waits for the browser's rendering steps in a Vitest browser test. A size
// change (page.viewport(), or a new width on a box) reaches the code that
// watches it only in the next rendering step: Chromium delivers
// ResizeObserver notes there, after that step's animation frame callbacks,
// and the observer then sets React state (ViewportFrame) or a scroll
// (useTabInView). On a 2-vCPU CI runner, headless Chromium can hold the
// test iframe's next rendering step for seconds while timers still run:
// in the Playwright Linux image with 2 CPUs, a full test:unit run showed
// animation frame gaps of 1 to 10 s with the page visible. A wait that
// counts clock time, such as expect.poll's 1 s, then fails at random.
// These helpers wait for the steps themselves, however long they take, so
// only the test's own time limit bounds them.
import { page } from 'vitest/browser'

/**
 * Resolves after two rendering steps have run: the second animation frame
 * comes after the first step's ResizeObserver callbacks.
 */
export function afterRendering(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })
}

/** Sets the test iframe's size, then waits until the page's size observers have seen it (`afterRendering`). */
export async function setViewport(width: number, height: number): Promise<void> {
  await page.viewport(width, height)
  await afterRendering()
}
