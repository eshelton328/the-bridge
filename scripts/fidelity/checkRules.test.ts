// Tests for checkRules.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkRules } from './checkRules.ts'

const ref = { h: 844, device: 'phone' as const, tolerance: 4 }
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
