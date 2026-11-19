import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkTrace, slideSamples } from './keyboardSlideLib.ts'

// The samples of the owner's trace of screen review R27 (2026-11-19T23-13-36-563Z, iPhone 14, standalone) around the
// keyboard's report: one frame has the layout viewport at the visible area's height and the document scrolled by the
// keyboard's height. That trace has no scrollTop, rootTop or composerTop yet.
const r27 = [
  { t: 0, type: 'focusin', innerHeight: 797, vvHeight: 797, vvOffsetTop: 0, vvPageTop: 0, scrollY: 0, keyboard: '' },
  { t: 178, type: 'vv-resize', innerHeight: 797, vvHeight: 394, vvOffsetTop: 0, vvPageTop: 0, scrollY: 0, keyboard: '' },
  { t: 182, type: 'raf', innerHeight: 797, vvHeight: 394, vvOffsetTop: 0, vvPageTop: 0, scrollY: 0, keyboard: '369px' },
  { t: 214, type: 'scroll', innerHeight: 394, vvHeight: 394, vvOffsetTop: 403, vvPageTop: 403, scrollY: 403, keyboard: '369px' },
  { t: 215, type: 'vv-scroll', innerHeight: 394, vvHeight: 394, vvOffsetTop: 0, vvPageTop: 0, scrollY: 0, keyboard: '369px' },
  { t: 248, type: 'raf', innerHeight: 797, vvHeight: 394, vvOffsetTop: 0, vvPageTop: 0, scrollY: 0, keyboard: '369px' },
]

void test('the R27 trace shows the scroll: the scrolled frame and the short layout after it', () => {
  assert.deepEqual(slideSamples(r27), [
    { t: 214, type: 'scroll', why: ['scrollY 403', 'vvOffsetTop 403', 'innerHeight 394, 797 at the start'] },
    { t: 215, type: 'vv-scroll', why: ['innerHeight 394, 797 at the start'] },
  ])
})

void test('an open with no scroll shows nothing: the keyboard only shrinks the visual viewport', () => {
  const clean = r27.filter((sample) => sample.innerHeight === 797)
  assert.deepEqual(slideSamples(clean), [])
  assert.deepEqual(slideSamples([]), [])
})

void test('the new sample fields show a moved page on their own', () => {
  const base = { type: 'raf', innerHeight: 797, vvOffsetTop: 0, scrollY: 0, scrollTop: 0, rootTop: 0, composerTop: 700 }
  const found = slideSamples([
    { ...base, t: 1 },
    { ...base, t: 2, scrollTop: 403 },
    { ...base, t: 3, rootTop: -403 },
    // The composer's top moves with the dock, so it is never a sign; a rounding pixel and a null are not either.
    { ...base, t: 4, composerTop: 331, scrollY: 0.5, rootTop: null },
  ])
  assert.deepEqual(found, [
    { t: 2, type: 'raf', why: ['scrollTop 403'] },
    { t: 3, type: 'raf', why: ['rootTop -403'] },
  ])
})

void test('a trace file gives its experiment and count; anything else is no trace', () => {
  assert.deepEqual(checkTrace({ kbExperiment: 'prevent', samples: r27.slice(0, 2) }), {
    kbExperiment: 'prevent',
    samples: 2,
    slide: [],
  })
  assert.equal(checkTrace({ kbExperiment: null, samples: r27 })?.slide.length, 2)
  assert.equal(checkTrace({ samples: 'x' }), undefined)
  assert.equal(checkTrace(null), undefined)
  assert.deepEqual(slideSamples(['x', null, 3]), [])
})
