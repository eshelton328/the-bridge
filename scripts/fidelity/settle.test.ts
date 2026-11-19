// Tests for settle.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { waitForAnimations, waitForLayout } from './settle.ts'

const page = `<style>
  @keyframes fade { from { opacity: 0 } to { opacity: 1 } }
  @keyframes spin { to { rotate: 360deg } }
  #sheet { animation: fade 600ms linear both }
  #spinner { animation: spin 1s linear infinite }
</style>
<div id="sheet">Suggested prompt</div><div id="spinner">o</div>`

void test('waits for a fade to end, and not for an animation that never ends', async () => {
  const browser = await chromium.launch()
  try {
    const tab = await browser.newPage()
    await tab.setContent(page)
    const opacity = () =>
      tab.evaluate(() => getComputedStyle(document.getElementById('sheet') ?? document.body).opacity)
    assert.notEqual(await opacity(), '1', 'the fade has not ended yet when the page is loaded')
    await waitForAnimations(tab)
    assert.equal(await opacity(), '1')
    const states = await tab.evaluate(() => document.getAnimations().map((a) => a.playState))
    assert.deepEqual(states.toSorted(), ['finished', 'running'], 'the fade ended and the spinner still runs')
  } finally {
    await browser.close()
  }
})

// A field that sizes itself as zag's autoresizeTextarea does: a ResizeObserver
// note, then a frame, then the height in the frame after it.
const grow = `<textarea id="field" rows="2" style="width: 200px; font: 13px/20px sans-serif; padding: 8px; border: 0; box-sizing: border-box"></textarea>`

void test('waits in frames until a field that sizes itself has its height', async () => {
  const browser = await chromium.launch()
  try {
    const tab = await browser.newPage()
    await tab.setContent(grow)
    // Fill the field and start its sizing; the height it has now is the one a measure before the frames sees.
    const before = await tab.evaluate(() => {
      const el = document.getElementById('field')
      if (!(el instanceof HTMLTextAreaElement)) return 0
      el.value = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen'
      new ResizeObserver(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.height = 'auto'
            el.style.height = `${String(el.scrollHeight)}px`
          })
        })
      }).observe(el)
      return el.clientHeight
    })
    await waitForLayout(tab)
    const after = await tab.evaluate(() => {
      const el = document.getElementById('field')
      return el === null ? null : { client: el.clientHeight, scroll: el.scrollHeight }
    })
    assert.ok(after !== null)
    assert.ok(after.client > before, `the field grew from ${String(before)} px`)
    assert.equal(after.scroll, after.client, 'no text is hidden in the field')
  } finally {
    await browser.close()
  }
})

void test('stops with an error when the layout never settles', async () => {
  const browser = await chromium.launch()
  try {
    const tab = await browser.newPage()
    await tab.setContent(`<div id="box" style="height: 1px"></div><script>
      const box = document.getElementById('box')
      const step = () => { box.style.height = (box.offsetHeight % 50) + 1 + 'px'; requestAnimationFrame(step) }
      requestAnimationFrame(step)
    </script>`)
    await assert.rejects(waitForLayout(tab), /still changed/)
  } finally {
    await browser.close()
  }
})
