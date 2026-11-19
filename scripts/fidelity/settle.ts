import type { Page } from 'playwright'

/**
 * Waits until every animation on the page that ends on its own has
 * finished, so the checks measure the state's last frame. On the CI
 * runner a sheet's open fade was still at time 0 (opacity 0) when the
 * text check measured, so its text counted as not visible. An animation
 * that never ends (a spinner) is not waited for.
 */
export async function waitForAnimations(tab: Page): Promise<void> {
  await tab.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime))
        .map((a) =>
          a.finished.then(
            () => undefined,
            () => undefined,
          ),
        ),
    ).then(() => undefined),
  )
}
