// Tests for checkRules.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkRules } from './checkRules.ts'
import { statusBarReason, type Layer } from './figmaMetadata.ts'

const ref = { w: 390, h: 844, device: 'phone' as const, tolerance: 4, layers: [], exclude: [] }
const full = { x: 0, y: 0, w: 390, h: 844 }
const none = { rules: [] }

void test('passes with no findings and a full-height render', () => {
  assert.equal(checkRules(ref, none, { rules: [], rootBox: full }).ok, true)
})

void test('a render shorter than the frame fails fullHeight', () => {
  const r = checkRules(ref, none, { rules: [], rootBox: { ...full, h: 700 } })
  assert.deepEqual(
    r.findings.map((f) => f.rule),
    ['fullHeight'],
  )
})

void test('browser findings fail unless an exception names the rule and selector', () => {
  const finding = { rule: 'scrollBar', selector: 'section', detail: 'vertical 15 px' }
  assert.equal(checkRules(ref, none, { rules: [finding], rootBox: full }).ok, false)
  const r = checkRules(
    ref,
    { rules: [{ rule: 'scrollBar', selector: 'section', reason: 'x' }] },
    { rules: [finding], rootBox: full },
  )
  assert.deepEqual([r.ok, r.excepted.length], [true, 1])
})

// A phone frame (390 × 844) with Figma's 38 px status bar renders in a
// 390 × 806 viewport for every check (d-102), so the render fills its
// height at 806 px, and 844 px is no longer what it must cover.
const bar: Layer = { id: '2:1', name: 'Frame', type: 'frame', x: 0, y: 0, w: 390, h: 38, path: '' }
const clock: Layer = { id: '2:2', name: '9:41', type: 'text', text: '9:41', x: 30, y: 12, w: 40, h: 16, path: 'Frame' }
const phone = { ...ref, layers: [bar, clock], exclude: [{ id: '2:2', text: '9:41', reason: statusBarReason }] }

void test('on a frame with a status bar the render fills the viewport below the bar (d-102)', () => {
  const below = { ...full, h: 806 }
  assert.deepEqual(checkRules(phone, none, { rules: [], rootBox: below }).findings, [])
  const short = checkRules(phone, none, { rules: [], rootBox: { ...full, h: 760 } })
  assert.deepEqual(
    short.findings.map((f) => [f.rule, f.detail]),
    [['fullHeight', "the phone render covers y 0–760 of the frame's 806 px below its 38 px status bar"]],
  )
})

void test('a frame without a status bar must still fill its full height', () => {
  assert.equal(checkRules(ref, none, { rules: [], rootBox: { ...full, h: 806 } }).ok, false)
  const r = checkRules(ref, none, { rules: [], rootBox: { ...full, h: 700 } })
  assert.equal(r.findings[0]?.detail, "the phone render covers y 0–700 of the frame's 844 px")
})
