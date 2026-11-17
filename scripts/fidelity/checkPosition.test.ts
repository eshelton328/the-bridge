// Tests for checkPosition.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkPosition, findLayer } from './checkPosition.ts'
import type { Layer } from './figmaMetadata.ts'

const layer = (id: string, name: string, x: number, y: number, w: number, h: number): Layer => ({
  id,
  name,
  type: 'frame',
  x,
  y,
  w,
  h,
  path: '',
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
const ref = { layers, tolerance: 4 }
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
