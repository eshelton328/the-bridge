// Tests for the pure parts of the text size check. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addCounts,
  layoutOf,
  newProblems,
  outBy,
  overlapBy,
  overlapPairs,
  coversByDesign,
  overlapsOf,
  shownBox,
  problemsOf,
  type SizeCounts,
  type TextMeasure,
  type TopRun,
} from './textSizesLib.ts'

const edges = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom })

const measure = (over: Partial<TextMeasure>): TextMeasure => ({
  key: 'div:1/span:2',
  text: 'Projects',
  box: edges(10, 10, 60, 26),
  holder: edges(10, 10, 60, 26),
  holderVisible: true,
  clippers: [],
  truncated: false,
  truncatedCuts: false,
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

void test('an ellipsis or a line clamp that shows all its text is no problem', () => {
  assert.deepEqual(
    problemsOf([measure({ box: edges(10, 10, 90, 26), clippers: [edges(0, 0, 60, 26)], truncated: true })]),
    [],
  )
})

void test('an ellipsis that hides text is new at a larger size unless Small hides it there too', () => {
  const cut = measure({
    box: edges(10, 10, 90, 26),
    clippers: [edges(0, 0, 60, 26)],
    truncated: true,
    truncatedCuts: true,
  })
  assert.deepEqual(problemsOf([cut]), [{ key: 'div:1/span:2', text: 'Projects', kind: 'truncated', by: 0 }])
  assert.deepEqual(newProblems([], problemsOf([cut])).length, 1)
  assert.deepEqual(newProblems(problemsOf([cut]), problemsOf([cut])), [])
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

void test('a cut planted at Small shows in the Small count, and the counts add up by page', () => {
  const smallCut = problemsOf([measure({ box: edges(10, 10, 60, 30), clippers: [edges(0, 0, 100, 26)] })])
  const counts: Record<string, SizeCounts> = {}
  addCounts(counts, 'inbox', smallCut, { default: [], large: [] })
  assert.deepEqual(counts, { inbox: { small: 1, default: 0, large: 0 } })
  const spill = problemsOf([measure({ key: 'b', box: edges(10, 10, 72, 26) })])
  addCounts(counts, 'inbox', [], { default: [], large: newProblems(smallCut, spill) })
  addCounts(counts, 'toolkit', [], { default: [], large: [] })
  assert.deepEqual(counts, { inbox: { small: 1, default: 0, large: 1 }, toolkit: { small: 0, default: 0, large: 0 } })
})

void test('a word broken across lines is a problem, with the number of such words', () => {
  assert.deepEqual(problemsOf([measure({ brokenWords: 2 })]), [
    { key: 'div:1/span:2', text: 'Projects', kind: 'broken-word', by: 2 },
  ])
  assert.deepEqual(problemsOf([measure({ brokenWords: 0 })]), [])
})

void test('a form field shorter than its line is clipped, a field that fits is not', () => {
  assert.deepEqual(problemsOf([measure({ text: 'Reply to Codex', fieldShort: 5.6 })]), [
    { key: 'div:1/span:2', text: 'Reply to Codex', kind: 'field-clipped', by: 6 },
  ])
  assert.deepEqual(problemsOf([measure({ fieldShort: 0.5 })]), [])
})

void test('overlapBy gives the shared size on the smaller axis', () => {
  assert.equal(overlapBy(edges(0, 0, 10, 10), edges(20, 0, 30, 10)), 0)
  assert.equal(overlapBy(edges(0, 0, 100, 20), edges(90, 5, 200, 15)), 10)
})

void test('a run painted over text is an overlap, keyed by the run on top, once', () => {
  const line = measure({ key: 'div:0/p:1', text: 'The workbench suits long', box: edges(0, 100, 300, 120) })
  const chip = measure({ key: 'div:0/div:2/span:0', text: '60 : 40', box: edges(280, 102, 400, 118) })
  const pairs = overlapPairs([line, chip])
  assert.deepEqual(
    pairs.map((p) => [p.by, p.x, p.y]),
    [[16, 290, 110]],
  )
  assert.deepEqual(overlapsOf(pairs, [run('div:0/div:2/span:0')]), [
    { key: 'div:0/div:2/span:0', text: '60 : 40 over The workbench suits long', kind: 'overlap', by: 16 },
  ])
  const second = measure({ key: 'div:0/p:3', text: 'line two', box: edges(280, 104, 320, 118) })
  const three = overlapPairs([line, chip, second])
  const onTop = three.map((p) => run(p.a.key === 'div:0/p:1' && p.b.key === 'div:0/p:3' ? null : 'div:0/div:2/span:0'))
  assert.equal(three.length, 3)
  assert.equal(overlapsOf(three, onTop).length, 1)
  assert.deepEqual(overlapsOf(three, [run('div:9/span:0'), run('div:9/span:0'), run('div:9/span:0')]), [])
})

void test('a pair that a third element covers, as an open menu does, is no overlap', () => {
  const line = measure({ key: 'div:0/p:1', box: edges(0, 100, 300, 120) })
  const other = measure({ key: 'div:0/p:2', box: edges(0, 104, 300, 124) })
  assert.deepEqual(overlapsOf(overlapPairs([line, other]), [run(null)]), [])
})

void test('the same run on top at Small makes the overlap not new, wherever the text under it moved', () => {
  const chip = measure({ key: 'menu:0/span:0', text: 'Side chat', box: edges(0, 100, 100, 120) })
  const small = overlapsOf(overlapPairs([chip, measure({ key: 'p:1', box: edges(0, 100, 300, 120) })]), [
    run('menu:0/span:0'),
  ])
  const large = overlapsOf(overlapPairs([chip, measure({ key: 'p:2', box: edges(0, 100, 300, 120) })]), [
    run('menu:0/span:0'),
  ])
  assert.equal(small.length, 1)
  assert.deepEqual(newProblems(small, large), [])
})

void test('touching line boxes, nested holders, fields and ellipsis text make no pair', () => {
  const a = measure({ key: 'div:0/p:1', box: edges(0, 100, 300, 120) })
  assert.deepEqual(overlapPairs([a, measure({ key: 'div:0/p:2', box: edges(0, 118, 300, 138) })]), [])
  assert.deepEqual(overlapPairs([a, measure({ key: 'div:0/p:1/b:0', box: edges(10, 100, 50, 120) })]), [])
  assert.deepEqual(
    overlapPairs([a, measure({ key: 'div:0/input:3', box: edges(0, 100, 300, 120), fieldShort: 0 })]),
    [],
  )
  assert.deepEqual(overlapPairs([a, measure({ key: 'div:0/p:4', box: edges(0, 100, 300, 120), truncated: true })]), [])
})

void test('only the shown part of a run counts: text scrolled out of view or clipped overlaps nothing', () => {
  const header = measure({ key: 'header:0/span:0', text: 'Source', box: edges(0, 0, 100, 20) })
  const row = measure({ key: 'main:1/p:0', box: edges(0, 5, 300, 25), scroller: edges(0, 30, 400, 800) })
  assert.equal(shownBox(row), null)
  assert.deepEqual(overlapPairs([header, row]), [])
  const half = measure({ key: 'main:1/p:1', box: edges(0, 10, 300, 40), scroller: edges(0, 15, 400, 800) })
  assert.deepEqual(shownBox(half), edges(0, 15, 300, 40))
  assert.equal(overlapPairs([header, half]).length, 1)
})
/** The run on top in a layer of the page's own flow, unless a test names the layer. */
function run(key: string | null, layer: TopRun['layer'] = null, pointerEvents = 'auto'): TopRun {
  return { key, layer, pointerEvents }
}

void test('a named drag-time layer that takes no pointer covers text by design', () => {
  assert.equal(coversByDesign(run('x', 'resizeReadout', 'none')), true)
  assert.equal(coversByDesign(run('x', 'paneDropZone', 'none')), true)
  assert.equal(coversByDesign(run('x', 'sidebarDrag', 'none')), true)
  assert.equal(coversByDesign(run('x', 'sidebarDrag', 'auto')), false)
  assert.equal(coversByDesign(run('x', 'tabBar')), true)
})

void test('a planted overlay over text that is no named drag-time layer still counts', () => {
  const chip = measure({ key: 'div:0/div:4/span:0', text: 'Saved', box: edges(0, 100, 80, 120) })
  const line = measure({ key: 'div:0/p:1', text: 'the pane text', box: edges(0, 100, 300, 120) })
  const pairs = overlapPairs([chip, line])
  // A toast placed over the page that takes no pointer, as the readout does, but not named.
  assert.deepEqual(
    overlapsOf(pairs, [run(chip.key, 'other', 'none')]).map((p) => p.kind),
    ['overlap'],
  )
  // The readout's own part that takes the pointer is no drag-time layer: it would stay over the text.
  assert.deepEqual(
    overlapsOf(pairs, [run(chip.key, 'resizeReadout', 'auto')]).map((p) => p.kind),
    ['overlap'],
  )
  assert.deepEqual(
    overlapsOf(pairs, [run(chip.key, 'paneDropZone', 'auto')]).map((p) => p.kind),
    ['overlap'],
  )
  assert.deepEqual(overlapsOf(pairs, [run(chip.key, 'resizeReadout', 'none')]), [])
})
