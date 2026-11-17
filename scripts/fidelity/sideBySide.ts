// The side-by-side picture that the second review reads: Figma's frame
// left, the render right, both at 1:1.
import { readFileSync } from 'node:fs'
import type { Page } from 'playwright'

/** Height of the caption above each picture, in px. */
export const sideBySideLabel = 28
/** Space between the two pictures, in px. */
export const sideBySideGap = 24

/**
 * Draws `left` and `right` (PNG files of `w` × `h`) on one PNG at `out`.
 * It draws in a new page of the story tab's browser context: the story's
 * scripts keep running after `setContent`, and an open popover or menu
 * puts its portal back into the replaced document, unstyled, over the
 * Figma half.
 */
export async function composeSideBySide(
  storyTab: Page,
  left: string,
  right: string,
  out: string,
  w: number,
  h: number,
) {
  const src = (f: string) => `data:image/png;base64,${readFileSync(f).toString('base64')}`
  const tab = await storyTab.context().newPage()
  try {
    await tab.setViewportSize({ width: w * 2 + sideBySideGap, height: h + sideBySideLabel })
    await tab.setContent(
      `<body style="margin:0;background:#fff;font:14px system-ui;display:flex;gap:${String(sideBySideGap)}px">` +
        `<figure style="margin:0"><figcaption style="height:${String(sideBySideLabel)}px">Figma</figcaption><img src="${src(left)}" width="${String(w)}" height="${String(h)}"></figure>` +
        `<figure style="margin:0"><figcaption style="height:${String(sideBySideLabel)}px">Render</figcaption><img src="${src(right)}" width="${String(w)}" height="${String(h)}"></figure>` +
        '</body>',
    )
    await tab.evaluate(() => Promise.all([...document.images].map((i) => i.decode())).then(() => undefined))
    await tab.screenshot({ path: out })
  } finally {
    await tab.close()
  }
}
