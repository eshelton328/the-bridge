// Tests for settle.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { waitForAnimations } from './settle.ts'

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
