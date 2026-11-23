// Tests for pngReview.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseReview, pngLabel, pngReviewGate } from './pngReview.ts'

const record = (
  findings: { priority: string; kind: string }[],
  verdict = findings.length > 0 ? 'differences' : 'match',
) =>
  parseReview(
    {
      verdict,
      viewport: '390x844 phone',
      findings: findings.map((f, i) => ({ id: `F${String(i + 1)}`, region: 'mode switch', ...f })),
    },
    'review.json',
  )

void test('a planted visual difference, a P1 or P2 finding, fails a PNG frame', () => {
  for (const [priority, kind] of [
    ['P1', 'missing'],
    ['P2', 'colour'],
  ] as const) {
    const gate = pngReviewGate(record([{ priority, kind }]), true)
    assert.equal(gate.ok, false)
    assert.equal(gate.problem, 'findings')
    assert.equal(gate.blocking.length, 1)
  }
})

void test('a PNG frame fails with no review, a changed render or an unreviewable verdict', () => {
  assert.equal(pngReviewGate(undefined, true).problem, 'noReview')
  assert.equal(pngReviewGate(record([]), false).problem, 'renderChanged')
  assert.equal(pngReviewGate(record([], 'unreviewable'), true).problem, 'unreviewable')
})

void test('a PNG frame passes a review of its own render with P3 findings at most', () => {
  assert.equal(pngReviewGate(record([]), true).ok, true)
  assert.equal(pngReviewGate(record([{ priority: 'P3', kind: 'polish' }]), true).ok, true)
})

void test('parseReview refuses a record that is not the reviewer agent', () => {
  assert.throws(
    () => parseReview({ verdict: 'fine', findings: [] }, 'review.json'),
    /review\.json: not a fidelity-reviewer record/,
  )
  assert.throws(() => parseReview({ verdict: 'match' }, 'review.json'), /findings/)
})

void test('the label names the checks a PNG frame leaves out', () => {
  assert.equal(pngLabel, 'PNG reference: text, position and icons not checked')
})
