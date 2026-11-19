import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkFrames, cubicBezier, type Frame, servedUrl, sheetArgs } from './keyboardCheckLib.ts'

const frame = (over: Partial<Frame>): Frame => ({
  t: 0,
  phase: 'open',
  keyboard: 0,
  headerTop: 0,
  scrollY: 0,
  lastBottom: 300,
  footerTop: 500,
  footerBottom: 600,
  keyboardTop: 852,
  opacity: 1,
  ...over,
})

const failed = (frames: Frame[]) =>
  checkFrames(frames)
    .filter((r) => !r.ok)
    .map((r) => r.name)

void test('a still header, no scroll, the last message above the composer and no fade pass', () => {
  assert.deepEqual(failed([frame({}), frame({ t: 16, keyboard: 100, footerTop: 400 })]), [])
})

void test('a header that moves fails, with the frame that moved most', () => {
  const header = checkFrames([frame({}), frame({ t: 16, headerTop: -3 }), frame({ t: 33, headerTop: -40 })]).at(0)
  assert.ok(header)
  assert.equal(header.ok, false)
  assert.equal(header.bad, 2)
  assert.deepEqual(header.worst, { t: 33, phase: 'open', value: -40 })
})

void test('a window scroll, a message under the composer and a fade each fail', () => {
  assert.deepEqual(failed([frame({}), frame({ scrollY: 336 })]), ['window scrollY is 0'])
  assert.deepEqual(failed([frame({ lastBottom: 501 })]), ['last message above the composer (px under it)'])
  assert.deepEqual(failed([frame({ opacity: 0.9 })]), ['no fade on the shell (lowest opacity)'])
})

void test('a composer the open keyboard covers fails', () => {
  const opened = { phase: 'open' as const, keyboard: 336, keyboardTop: 516 }
  assert.deepEqual(failed([frame({}), frame({ ...opened, footerTop: 400, footerBottom: 516 })]), [])
  assert.deepEqual(failed([frame({}), frame({ ...opened, footerBottom: 600 })]), [
    'composer above the open keyboard (px under its top)',
  ])
})

void test('the fade rule names the lowest opacity', () => {
  const fade = checkFrames([frame({ opacity: 0.9 }), frame({ t: 16, opacity: 0 })]).at(3)
  assert.ok(fade)
  assert.deepEqual(fade.worst, { t: 16, phase: 'open', value: 0 })
})

void test('no frames fail', () => {
  assert.deepEqual(failed([]), ['frames'])
})

void test('cubicBezier keeps its ends and matches a linear curve', () => {
  const linear = cubicBezier(0, 0, 1, 1)
  assert.equal(linear(0), 0)
  assert.equal(linear(1), 1)
  assert.ok(Math.abs(linear(0.3) - 0.3) < 1e-6)
  const keyboard = cubicBezier(0.38, 0.7, 0.125, 1)
  assert.ok(keyboard(0.5) > 0.8)
})

void test('sheetArgs tiles the frames over the time span', () => {
  const args = sheetArgs({ video: 'v.webm', out: 's.png', start: 1, seconds: 2, count: 24, columns: 8, width: 160 })
  assert.deepEqual(args.slice(3, 9), ['-ss', '1.000', '-t', '2.000', '-i', 'v.webm'])
  assert.equal(args[10], 'fps=12.0000,scale=160:-1,tile=8x3:padding=4:color=white')
})

void test('the served URL comes from --url, then SERVED_APP_URL, and is required', () => {
  assert.deepEqual(servedUrl('https://flag.example:5180', 'https://env.example:5180'), {
    ok: true,
    url: 'https://flag.example:5180',
  })
  assert.deepEqual(servedUrl(undefined, 'https://env.example:5180/'), { ok: true, url: 'https://env.example:5180' })
  const missing = servedUrl(undefined, undefined)
  if (missing.ok) assert.fail('no URL must be an error')
  assert.match(missing.error, /--url <url> or set SERVED_APP_URL/)
  assert.equal(servedUrl(undefined, '  ').ok, false)
})
