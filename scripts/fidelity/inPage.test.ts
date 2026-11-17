// Tests for the pure helpers of inPage.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { collectPageScript, fullyVisible, isPortalRoot } from './inPage.ts'

const edges = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom })
const viewport = edges(0, 0, 1280, 800)

void test('a string fully inside its scroll box and the viewport is visible', () => {
  const lines = [edges(20, 100, 300, 116), edges(20, 116, 180, 132)]
  assert.equal(fullyVisible(lines, [edges(10, 50, 320, 400)], viewport), true)
})

void test('a sentence clipped inside a scroll box is not visible, though part of it shows', () => {
  // Second line runs below the scroll box's bottom edge (y 120).
  const lines = [edges(20, 100, 300, 116), edges(20, 116, 180, 132)]
  assert.equal(fullyVisible(lines, [edges(10, 50, 320, 120)], viewport), false)
  // Cut at the right edge, as an ellipsis or a narrow box does.
  assert.equal(fullyVisible([edges(20, 100, 300, 116)], [edges(10, 50, 200, 400)], viewport), false)
})

void test('every clipping ancestor and the viewport count', () => {
  const line = [edges(20, 780, 300, 812)]
  assert.equal(fullyVisible(line, [], viewport), false)
  const inner = edges(0, 0, 400, 900)
  const outer = edges(0, 0, 400, 500)
  assert.equal(fullyVisible([edges(20, 600, 300, 616)], [inner, outer], viewport), false)
})

void test('an axis that does not clip is infinite; 1 px of slack is allowed', () => {
  const clipX = edges(10, -Infinity, 320, Infinity)
  assert.equal(fullyVisible([edges(20, 100, 300, 116)], [clipX], viewport), true)
  assert.equal(fullyVisible([edges(20, 99.5, 300, 116.5)], [edges(10, 100, 320, 116)], viewport), true)
  assert.equal(fullyVisible([edges(20, 98, 300, 116)], [edges(10, 100, 320, 116)], viewport), false)
})

void test('a string that draws no rect is not visible', () => {
  assert.equal(fullyVisible([], [], viewport), false)
  assert.equal(fullyVisible([edges(5, 5, 5, 20)], [], viewport), false)
})

void test('any portal content in body counts, Storybook chrome does not', () => {
  const el = (tagName: string, id = '', classes: string[] = [], holdsStoryRoot = false) => ({
    tagName,
    id,
    classes,
    holdsStoryRoot,
  })
  // Ark/Zag positioners and a dialog backdrop.
  assert.equal(isPortalRoot(el('DIV')), true)
  // A portal of another library, with no data-scope.
  assert.equal(isPortalRoot(el('DIV', '', ['dialog-overlay'])), true)
  assert.equal(isPortalRoot(el('DIV', '', [], true)), false)
  assert.equal(isPortalRoot(el('DIV', 'storybook-root', [], true)), false)
  assert.equal(isPortalRoot(el('DIV', 'storybook-docs')), false)
  assert.equal(isPortalRoot(el('DIV', '', ['sb-preparing-story', 'sb-wrapper'])), false)
  assert.equal(isPortalRoot(el('SCRIPT')), false)
})

void test('the page script calls collectPage with both helpers', () => {
  const script = collectPageScript('#storybook-root')
  assert.match(script, /^\(function collectPage\(/)
  assert.match(script, /fullyVisible: function fullyVisible\(/)
  assert.match(script, /isPortalRoot: function isPortalRoot\(/)
})
