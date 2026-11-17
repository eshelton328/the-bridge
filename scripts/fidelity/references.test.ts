// Tests for references.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseExceptions, parseFrameRef, parseTolerance } from './references.ts'

void test('parseTolerance takes a plain number of px, 0 or more', () => {
  assert.equal(parseTolerance('4', '--tolerance'), 4)
  assert.equal(parseTolerance('2.5', '--tolerance'), 2.5)
  assert.equal(parseTolerance('0', '--tolerance'), 0)
})

void test('parseTolerance rejects 4px, an empty, negative or infinite value', () => {
  for (const v of ['4px', '', ' ', '-1', 'Infinity', 'NaN', '1e999'])
    assert.throws(() => parseTolerance(v, '--tolerance'), /--tolerance: the tolerance must be a number of px/)
})

void test('a frame.json tolerance must be a number, 0 or more', () => {
  const frame = (tolerance: unknown) => ({
    frameId: 'D01',
    code: 'D1',
    name: 'x',
    node: '1:1',
    fileKey: 'k',
    device: 'desktop',
    w: 1280,
    h: 800,
    tolerance,
    source: 's',
    layers: [],
    exclude: [],
    skipped: {},
  })
  assert.equal(parseFrameRef(frame(4), 'frame.json').tolerance, 4)
  for (const t of [-1, '4px', null, Infinity])
    assert.throws(() => parseFrameRef(frame(t), 'frame.json'), /frame\.json: .*tolerance/s)
})

void test('a missing exception names the Figma text layers it covers (d-101)', () => {
  const ok = parseExceptions(
    { missing: [{ text: 'Inbox', layers: ['403:664'], reason: 'under the task pane' }] },
    'e.json',
  )
  assert.deepEqual(ok.missing[0]?.layers, ['403:664'])
  for (const layers of [undefined, []])
    assert.throws(
      () => parseExceptions({ missing: [{ text: 'Inbox', layers, reason: 'under the task pane' }] }, 'e.json'),
      /e\.json: .*layers/s,
    )
})
