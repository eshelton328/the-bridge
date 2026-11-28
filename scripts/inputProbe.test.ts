// Tests for inputProbe.ts. Run with `pnpm test:scripts`.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { appViewportMeta, inputLands, inputProblem, probePage, probePoint } from './inputProbe.ts'

void test('an event lands when it arrives at the point it was sent to, within the slack', () => {
  assert.equal(inputLands(probePoint, probePoint), true)
  assert.equal(inputLands(probePoint, { x: probePoint.x + 0.6, y: probePoint.y - 0.4 }), true)
})

void test("WebKit's points on the owner's Mac do not land (NCC-179)", () => {
  // mouse.click(40, 30) in headless WebKit 27.2: 10/9 of the point plus the window's place.
  assert.equal(inputLands(probePoint, { x: -1152, y: 1118 }), false)
  // A tap on a page with no viewport meta in a mobile profile: the point scaled by about 2.5.
  assert.equal(inputLands(probePoint, { x: 100, y: 75 }), false)
  assert.equal(inputLands(probePoint, { x: probePoint.x + 2, y: probePoint.y }), false)
  assert.equal(inputLands(probePoint, undefined), false)
})

void test('the message names the browser, the input, where it arrived and the issue', () => {
  const text = inputProblem('webkit', 'tap', { x: 100, y: 75 })
  assert.match(text, /^webkit put a tap at \(40, 30\) on a blank page at \(100, 75\)/)
  assert.match(text, /NCC-179/)
  assert.match(inputProblem('webkit', 'click', undefined), /at no event/)
})

void test("the probe's page has the app's viewport meta, so a mobile profile lays it out as it lays out the app", () => {
  const html = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8')
  assert.ok(html.includes(appViewportMeta))
  assert.match(appViewportMeta, /width=device-width/)
  assert.ok(probePage.includes(appViewportMeta))
})
