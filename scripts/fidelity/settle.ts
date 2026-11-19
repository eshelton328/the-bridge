import type { Page } from 'playwright'

/** Frames in a row whose layout must match before `waitForLayout` returns. */
const settledFrames = 5
/** Frames after which `waitForLayout` gives up: the layout still moves. */
const maxFrames = 240

/**
 * Waits in animation frames, not in time, until the layout under `body`
 * (each element's offset box and scroll height) is the same in
 * `settledFrames` frames in a row. Some parts size themselves a frame or
 * two after a change: Ark's autoresize textarea (zag's `autoresizeTextarea`)
 * sets its height in a frame after its ResizeObserver note. On a loaded CI
 * runner Chromium can skip rendering for seconds, so a time-based wait
 * (fonts, network idle) ended first and the rule check measured the prompt
 * editor of Inbox T12 at its two-row height (scrollHeight 76 > clientHeight
 * 56), while the screenshot taken after it showed the grown field. Offsets
 * leave out transforms, so a spinner does not count as a change. Throws when
 * the layout still changes after `maxFrames`.
 */
export async function waitForLayout(tab: Page): Promise<void> {
  const settled = await tab.evaluate(
    ([need, max]) =>
      new Promise<boolean>((resolve) => {
        const layout = () => {
          const parts: string[] = []
          for (const el of document.body.querySelectorAll('*')) {
            if (el instanceof HTMLElement)
              parts.push(
                `${String(el.offsetLeft)},${String(el.offsetTop)},${String(el.offsetWidth)},${String(el.offsetHeight)},${String(el.scrollHeight)}`,
              )
          }
          return parts.join(';')
        }
        let last = layout()
        let same = 0
        let frames = 0
        const step = () => {
          frames += 1
          const now = layout()
          same = now === last ? same + 1 : 0
          last = now
          if (same >= need) resolve(true)
          else if (frames >= max) resolve(false)
          else requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }),
    [settledFrames, maxFrames] as const,
  )
  if (!settled) throw new Error(`The layout still changed after ${String(maxFrames)} frames`)
}

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
