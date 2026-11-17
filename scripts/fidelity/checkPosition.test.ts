// Tests for checkPosition.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkPosition, findLayer, statusBarHeight } from './checkPosition.ts'
import { statusBarReason, type Layer } from './figmaMetadata.ts'

const layer = (id: string, name: string, x: number, y: number, w: number, h: number, path = ''): Layer => ({
  id,
  name,
  type: 'frame',
  x,
  y,
  w,
  h,
  path,
})
const layers = [
  layer('1:1', 'inbox list', 64, 0, 420, 982),
  layer('1:2', 'icon', 0, 0, 22, 22),
  layer('1:3', 'icon', 0, 50, 22, 22),
]
const box = (key: string, x: number, y: number, w: number, h: number) => ({
  key,
  selector: `[data-figma="${key}"]`,
  x,
  y,
  w,
  h,
})
const ref = { layers, tolerance: 4, exclude: [] }
const none = { position: [] }

void test('passes within the tolerance and fails beyond it, naming the edge', () => {
  assert.equal(checkPosition(ref, none, [box('inbox list', 66, 3, 418, 982)]).ok, true)
  const r = checkPosition(ref, none, [box('inbox list', 64, 0, 420, 895)])
  assert.equal(r.ok, false)
  assert.equal(r.diffs[0]?.problem, 'offBy')
  assert.deepEqual(r.diffs[0].delta, { x: 0, y: 0, w: 0, h: -87 })
  assert.match(r.diffs[0].detail, /h -87/)
})

void test('a node id key and a per-run tolerance', () => {
  assert.equal(checkPosition(ref, none, [box('1:1', 72, 0, 420, 982)], 8).ok, true)
  assert.equal(checkPosition(ref, none, [box('1:1', 72, 0, 420, 982)]).ok, false)
})

void test('unknown, ambiguous and duplicate keys are problems, not passes', () => {
  const r = checkPosition(ref, none, [
    box('nope', 0, 0, 1, 1),
    box('icon', 0, 0, 22, 22),
    box('1:1', 64, 0, 420, 982),
    box('1:1', 64, 0, 420, 982),
  ])
  assert.deepEqual(
    r.diffs.map((d) => d.problem),
    ['noLayer', 'ambiguousLayer', 'duplicateElement', 'duplicateElement'],
  )
  assert.ok(Array.isArray(findLayer(layers, 'icon')))
})

void test('an exception skips the key', () => {
  const r = checkPosition(ref, { position: [{ layer: 'inbox list', reason: 'gap' }] }, [box('inbox list', 0, 0, 1, 1)])
  assert.deepEqual([r.ok, r.excepted], [true, ['inbox list']])
})

void test('a tolerance that is not a finite number of px, 0 or more, is an error', () => {
  for (const t of [Number.NaN, -1, Infinity])
    assert.throws(() => checkPosition(ref, none, [box('1:1', 64, 0, 420, 982)], t), /tolerance/)
})

// A phone frame (390 × 844) with Figma's 38 px status bar. The app draws no
// status bar (d-089), so fidelity.ts renders it in a 390 × 806 viewport:
// the header sits at render y 0 and the tab bar at the viewport's bottom.
const phone = {
  tolerance: 4,
  layers: [
    layer('2:1', 'Frame', 0, 0, 390, 38),
    { ...layer('2:2', '9:41', 30, 12, 40, 16, 'Frame'), type: 'text', text: '9:41' },
    layer('2:3', 'header', 0, 38, 390, 56),
    layer('2:4', 'tab bar', 0, 761, 390, 83),
  ],
  exclude: [{ id: '2:2', text: '9:41', reason: statusBarReason }],
}

void test('a frame with a status bar compares each render y from below the bar (d-101)', () => {
  assert.equal(statusBarHeight(phone), 38)
  const r = checkPosition(phone, none, [box('header', 0, 0, 390, 56), box('tab bar', 0, 723, 390, 83)])
  assert.deepEqual(r.diffs, [])
  assert.deepEqual([r.ok, r.statusBar, r.passed], [true, 38, ['header', 'tab bar']])
})

void test('a frame without a status bar keeps render y as measured', () => {
  assert.equal(statusBarHeight(ref), 0)
  const r = checkPosition(ref, none, [box('inbox list', 64, 0, 420, 982)])
  assert.deepEqual([r.ok, r.statusBar], [true, 0])
  assert.equal(checkPosition(ref, none, [box('inbox list', 64, 38, 420, 982)]).ok, false)
})

void test('a status bar text that no top-level bar at y 0 holds is an error', () => {
  const broken = { ...phone, layers: phone.layers.filter((l) => l.id !== '2:1') }
  assert.throws(() => statusBarHeight(broken), /status bar text 2:2/)
})
