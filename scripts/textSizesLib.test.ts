// Tests for the pure parts of the text size check. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { layoutOf, newProblems, outBy, problemsOf, type TextMeasure } from './textSizesLib.ts'

const edges = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom })

const measure = (over: Partial<TextMeasure>): TextMeasure => ({
  key: 'div:1/span:2',
  text: 'Projects',
  box: edges(10, 10, 60, 26),
  holder: edges(10, 10, 60, 26),
  holderVisible: true,
  clippers: [],
  truncated: false,
  ...over,
})

void test('the layout comes from the first frame of a state file', () => {
  assert.equal(layoutOf("frames: [{ id: 'M1', node: '1:2', viewport: 'phone' }]"), 'phone')
  assert.equal(layoutOf('frames: [{ id: "T3", viewport: "tablet" }, { viewport: "desktop" }]'), 'tablet')
  assert.equal(layoutOf('no frame'), undefined)
})

void test('outBy gives the worst side', () => {
  assert.equal(outBy(edges(0, 0, 10, 10), edges(0, 0, 10, 10)), 0)
  assert.equal(outBy(edges(-3, 0, 14, 10), edges(0, 0, 10, 10)), 4)
  assert.equal(outBy(edges(0, 0, 10, 19), edges(0, 0, 10, 10)), 9)
})

void test('text inside its holder and its clippers is no problem', () => {
  assert.deepEqual(problemsOf([measure({ clippers: [edges(0, 0, 100, 40)] })]), [])
})

void test('text an ancestor cuts is clipped, also by a few px at the bottom', () => {
  const cut = problemsOf([measure({ box: edges(10, 10, 60, 30), clippers: [edges(0, 0, 100, 26)] })])
  assert.deepEqual(cut, [{ key: 'div:1/span:2', text: 'Projects', kind: 'clipped', by: 4 }])
})

void test('less than a px of rounding is no problem', () => {
  assert.deepEqual(problemsOf([measure({ box: edges(10, 10, 60.6, 26), clippers: [edges(0, 0, 60, 26)] })]), [])
})

void test('text that spills out of a visible holder overflows; a hidden holder is a clipper instead', () => {
  assert.deepEqual(problemsOf([measure({ box: edges(10, 10, 72, 26) })]), [
    { key: 'div:1/span:2', text: 'Projects', kind: 'overflow', by: 12 },
  ])
  assert.deepEqual(problemsOf([measure({ box: edges(10, 10, 72, 26), holderVisible: false })]), [])
})

void test('an ellipsis or a line clamp is the design, not a problem', () => {
  assert.deepEqual(
    problemsOf([measure({ box: edges(10, 10, 90, 26), clippers: [edges(0, 0, 60, 26)], truncated: true })]),
    [],
  )
})

void test('only the problems Small does not have are new', () => {
  const small = [{ key: 'a', text: 'x', kind: 'clipped' as const, by: 3 }]
  const large = [
    { key: 'a', text: 'x', kind: 'clipped' as const, by: 6 },
    { key: 'a', text: 'x', kind: 'overflow' as const, by: 2 },
    { key: 'b', text: 'y', kind: 'clipped' as const, by: 2 },
  ]
  assert.deepEqual(
    newProblems(small, large).map((p) => `${p.kind} ${p.key}`),
    ['overflow a', 'clipped b'],
  )
})
