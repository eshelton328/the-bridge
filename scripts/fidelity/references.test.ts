// Tests for references.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  checksForPng,
  frameKind,
  gateResults,
  parseChecks,
  parseExceptions,
  parseFrameRef,
  parsePngRef,
  parseTolerance,
} from './references.ts'

void test('parseChecks takes one or more check names, comma-separated', () => {
  assert.deepEqual(parseChecks('text,rules', '--checks'), ['text', 'rules'])
  assert.deepEqual(parseChecks('position', '--checks'), ['position'])
  assert.deepEqual(parseChecks('text,rules,icons', '--checks'), ['text', 'rules', 'icons'])
  assert.deepEqual(parseChecks('text, position ,rules', '--checks'), ['text', 'position', 'rules'])
})

void test('parseChecks rejects an empty, unknown or repeated name', () => {
  for (const v of ['', ',', 'text,', 'colour', 'text,text', 'TEXT'])
    assert.throws(() => parseChecks(v, '--checks'), /--checks: name each check once/)
})

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

void test('the icons gate fails on an iconSize diff alone, whatever the other position diffs', () => {
  const ok = { ok: true }
  const offBy = { problem: 'offBy' }
  const iconSize = { problem: 'iconSize' }
  const at = (...diffs: { problem: string }[]) =>
    gateResults({ text: ok, position: { ok: diffs.length === 0, diffs }, rules: ok })
  assert.deepEqual(at(), { text: true, position: true, rules: true, icons: true })
  assert.deepEqual(at(offBy), { text: true, position: false, rules: true, icons: true })
  assert.deepEqual(at(offBy, iconSize), { text: true, position: false, rules: true, icons: false })
})

const pngReference = (over: Record<string, unknown> = {}) => ({
  frameId: 'M01',
  code: 'M1',
  name: 'Settings · phone · dark',
  device: 'phone',
  w: 390,
  h: 844,
  mode: 'dark',
  tolerance: 4,
  source: 'lab a52ab2d4 + d-119',
  original: { file: 'settings-phone-dark.png', w: 780, h: 1688, sha256: 'a'.repeat(64) },
  ...over,
})

void test('parsePngRef takes a PNG reference with its source and original', () => {
  const ref = parsePngRef(pngReference(), 'reference.json')
  assert.equal(ref.frameId, 'M01')
  assert.equal(ref.mode, 'dark')
})

void test('parsePngRef rejects a code of another frame, a wrong device letter, an odd aspect or a missing source', () => {
  for (const [over, message] of [
    [{ code: 'M2' }, /code M2 is not frame M01/],
    [{ device: 'tablet' }, /a tablet frame id starts with T/],
    [{ original: { file: 'x.png', w: 780, h: 1600, sha256: 'a'.repeat(64) } }, /aspect ratio/],
    [{ source: '' }, /source/],
    [{ mode: 'system' }, /mode/],
    [{ layers: [] }, /layers/],
  ] as const)
    assert.throws(() => parsePngRef(pngReference(over), 'reference.json'), message)
})

void test('frameKind tells a Figma frame from a PNG reference and refuses a folder with both', () => {
  const dir = mkdtempSync(join(tmpdir(), 'frame-kind-'))
  try {
    assert.equal(frameKind(dir), undefined)
    writeFileSync(join(dir, 'reference.json'), '{}')
    assert.equal(frameKind(dir), 'png')
    writeFileSync(join(dir, 'frame.json'), '{}')
    assert.throws(() => frameKind(dir), /both frame\.json and reference\.json/)
    rmSync(join(dir, 'reference.json'))
    assert.equal(frameKind(dir), 'figma')
  } finally {
    rmSync(dir, { recursive: true })
  }
})

void test('checksForPng runs the rule check and refuses a check that needs Figma layers', () => {
  assert.deepEqual(checksForPng(undefined), ['rules'])
  assert.deepEqual(checksForPng(['rules']), ['rules'])
  for (const picked of [['text', 'rules'], ['position'], ['rules', 'icons']] as const)
    assert.throws(() => checksForPng([...picked]), /has no Figma layers, so it cannot run/)
})
