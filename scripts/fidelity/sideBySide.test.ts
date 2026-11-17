// Tests for sideBySide.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, type Page } from 'playwright'
import { composeSideBySide, sideBySideGap, sideBySideLabel } from './sideBySide.ts'

const w = 120
const h = 80

/** A story tab with an open popover: a script puts its portal back in `body` whenever it is gone. */
const storyWithPortal = `<body style="margin:0;background:#123">
<div id="storybook-root">story</div>
<script>
  const portal = () => {
    if (document.getElementById('portal') !== null || document.body === null) return
    const el = document.createElement('div')
    el.id = 'portal'
    el.style.cssText = 'position:fixed;inset:0;background:#000'
    el.textContent = 'Clear'
    document.body.append(el)
  }
  new MutationObserver(portal).observe(document, { childList: true, subtree: true })
  setInterval(portal, 1)
  portal()
</script>
</body>`

async function screenshotOf(tab: Page, html: string, path: string, height = h) {
  await tab.setViewportSize({ width: w, height })
  await tab.setContent(html)
  await tab.screenshot({ path })
}

/** RGBA pixels of a PNG file, read in the browser. */
async function pixels(tab: Page, file: string, x: number, y: number) {
  const src = `data:image/png;base64,${readFileSync(file).toString('base64')}`
  return tab.evaluate(
    async ({ src, x, y, w, h }) => {
      const img = new Image()
      img.src = src
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (ctx === null) throw new Error('no 2d context')
      ctx.drawImage(img, 0, 0)
      return [...ctx.getImageData(x, y, w, h).data]
    },
    { src, x, y, w, h },
  )
}

void test('draws the Figma frame unchanged when the story tab has an open portal', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'side-by-side-'))
  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ deviceScaleFactor: 1 })
    const helper = await context.newPage()
    const figma = join(dir, 'frame.png')
    const render = join(dir, 'render.png')
    await screenshotOf(
      helper,
      '<body style="margin:0;background:linear-gradient(90deg,#e33,#3e3 50%,#33e)"></body>',
      figma,
    )
    await screenshotOf(helper, '<body style="margin:0;background:#888"></body>', render)

    const story = await context.newPage()
    await story.setViewportSize({ width: w, height: h })
    await story.setContent(storyWithPortal)
    assert.equal(await story.locator('#portal').count(), 1)

    const out = join(dir, 'sideBySide.png')
    await composeSideBySide(story, figma, render, out, w, h)

    assert.deepEqual(await pixels(helper, out, 0, sideBySideLabel), await pixels(helper, figma, 0, 0))
    assert.deepEqual(await pixels(helper, out, w + sideBySideGap, sideBySideLabel), await pixels(helper, render, 0, 0))
    assert.equal(context.pages().length, 2, 'the compose page is closed')
  } finally {
    await browser.close()
    rmSync(dir, { recursive: true })
  }
})

void test('draws the render below the status bar, so its layers line up with Figma and both end at the bottom', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'side-by-side-'))
  const browser = await chromium.launch()
  const statusBar = 10
  try {
    const context = await browser.newContext({ deviceScaleFactor: 1 })
    const helper = await context.newPage()
    const figma = join(dir, 'frame.png')
    const render = join(dir, 'render.png')
    await screenshotOf(helper, '<body style="margin:0;background:#3e3"></body>', figma)
    // Taken w × (h − statusBar), as fidelity.ts takes a phone or tablet render.
    await screenshotOf(
      helper,
      '<body style="margin:0;background:linear-gradient(#e33,#33e)"></body>',
      render,
      h - statusBar,
    )
    const out = join(dir, 'sideBySide.png')
    await composeSideBySide(helper, figma, render, out, w, h, statusBar)

    // The whole render, from its first row, starts statusBar px lower: the
    // area below it in both reads as empty, past the bottom of each image.
    assert.deepEqual(
      await pixels(helper, out, w + sideBySideGap, sideBySideLabel + statusBar),
      await pixels(helper, render, 0, 0),
    )
    // Above it, where Figma draws the status bar, an empty white band.
    const band = await pixels(helper, out, w + sideBySideGap, sideBySideLabel)
    assert.deepEqual(band.slice(0, 4 * w), Array.from({ length: w }, () => [255, 255, 255, 255]).flat())
    assert.deepEqual(await pixels(helper, out, 0, sideBySideLabel), await pixels(helper, figma, 0, 0))
  } finally {
    await browser.close()
    rmSync(dir, { recursive: true })
  }
})
