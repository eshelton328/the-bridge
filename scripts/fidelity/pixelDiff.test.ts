// Tests for pixelDiff.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { comparePngs, diffPixels, pixelThreshold } from './pixelDiff.ts'

void test('diffPixels counts pixels that differ by more than the threshold in any channel', () => {
  const a = [0, 0, 0, 255, 100, 100, 100, 255, 10, 20, 30, 255]
  const b = [0, 0, 0, 255, 100, 140, 100, 255, 10, 20, 30, 0]
  const out = new Array<number>(a.length).fill(0)
  assert.equal(diffPixels(a, b, out, 32), 2)
  assert.deepEqual(out.slice(4, 8), [255, 0, 0, 255])
  assert.deepEqual(out.slice(8, 12), [255, 0, 0, 255])
  assert.equal(out[0], out[1])
  assert.equal(diffPixels(a, a, out, 0), 0)
})

void test('diffPixels keeps a difference at the threshold as the same pixel', () => {
  const out = new Array<number>(4).fill(0)
  assert.equal(diffPixels([0, 0, 0, 255], [32, 0, 0, 255], out, 32), 0)
  assert.equal(diffPixels([0, 0, 0, 255], [33, 0, 0, 255], out, 32), 1)
})

void test('diffPixels refuses arrays of other lengths', () => {
  assert.throws(() => diffPixels([0, 0, 0, 0], [0, 0, 0], [0, 0, 0, 0], 0), /one length/)
})

void test('comparePngs counts the changed region and refuses a picture of another size', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pixel-diff-'))
  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ viewport: { width: 100, height: 50 }, deviceScaleFactor: 1 })
    const tab = await context.newPage()
    const shot = async (html: string, file: string) => {
      await tab.setContent(`<body style="margin:0;background:#fff">${html}</body>`)
      await tab.screenshot({ path: join(dir, file) })
    }
    await shot('', 'a.png')
    await shot('<div style="width:10px;height:20px;background:#000"></div>', 'b.png')
    const result = await comparePngs(tab, join(dir, 'a.png'), join(dir, 'b.png'), join(dir, 'diff.png'), 100, 50)
    assert.deepEqual(result, { total: 5000, different: 200, ratio: 0.04, threshold: pixelThreshold })
    assert.ok(existsSync(join(dir, 'diff.png')))
    await assert.rejects(
      comparePngs(tab, join(dir, 'a.png'), join(dir, 'b.png'), join(dir, 'x.png'), 100, 60),
      /not 100 x 60/,
    )
  } finally {
    await browser.close()
    rmSync(dir, { recursive: true })
  }
})
