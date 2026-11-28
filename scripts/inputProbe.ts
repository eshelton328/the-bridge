// The input guard of a script that clicks or taps in Playwright (NCC-179). On the owner's Mac, Playwright 1.65.1's
// WebKit 27.2 puts a mouse click at 10/9 of its point plus the window's place, and scales a tap, so the event lands
// on <html> or on another control; Chromium puts both at the point. `probeInput` sends one click or tap to a blank
// page and reads where the page got it, so a script stops before it reports a result from input that missed.
import type { Browser, BrowserContextOptions } from 'playwright'

export type Point = { readonly x: number; readonly y: number }

/** The point the probe sends its click or tap to: inside the probe's 200 × 120 page. */
export const probePoint: Point = { x: 40, y: 30 }

/** Whether the page got the event at the point it was sent to, within `slack` px (a tap reports a fraction). */
export function inputLands(sent: Point, got: Point | undefined, slack = 1): boolean {
  return got !== undefined && Math.abs(got.x - sent.x) <= slack && Math.abs(got.y - sent.y) <= slack
}

/** The message a script prints when the probe's event did not land at its point. */
export function inputProblem(browserName: string, input: 'click' | 'tap', got: Point | undefined): string {
  const at = got === undefined ? 'no event' : `(${String(Math.round(got.x))}, ${String(Math.round(got.y))})`
  return `${browserName} put a ${input} at (${String(probePoint.x)}, ${String(probePoint.y)}) on a blank page at ${at}: its input misses on this machine (NCC-179). Click and tap in Chromium with device emulation instead.`
}

/**
 * Sends one click to a blank page in a new context of `browser`, or one tap when `options` has touch, and reads where
 * the page got it. `options` is the script's own device profile (the error depends on it); the page is 200 × 120.
 * Gives `undefined` when the event landed at its point, else the message of `inputProblem`.
 */
export async function probeInput(browser: Browser, options: BrowserContextOptions = {}): Promise<string | undefined> {
  const tap = options.hasTouch === true
  const context = await browser.newContext({ ...options, viewport: { width: 200, height: 120 } })
  try {
    const page = await context.newPage()
    await page.setContent(
      '<body style="margin:0;width:200px;height:120px"><script>document.addEventListener("pointerdown", (e) => { document.body.dataset.got = e.clientX + " " + e.clientY })</script></body>',
    )
    if (tap) await page.touchscreen.tap(probePoint.x, probePoint.y)
    else await page.mouse.click(probePoint.x, probePoint.y)
    const text = await page.evaluate(() => document.body.dataset.got)
    const [x, y] = (text ?? '').split(' ').map(Number)
    const got = x === undefined || y === undefined || Number.isNaN(x) || Number.isNaN(y) ? undefined : { x, y }
    return inputLands(probePoint, got)
      ? undefined
      : inputProblem(browser.browserType().name(), tap ? 'tap' : 'click', got)
  } finally {
    await context.close()
  }
}
