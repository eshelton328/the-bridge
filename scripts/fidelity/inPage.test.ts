// Tests for the pure helpers of inPage.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { renderViewport } from './checkPosition.ts'
import { checkText } from './checkText.ts'
import { statusBarReason, type Layer } from './figmaMetadata.ts'
import { collectPageScript, fieldText, fullyVisible, isPortalRoot, scrollBars, type PageMeasure } from './inPage.ts'

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

void test('the page script calls collectPage with its helpers', () => {
  const script = collectPageScript('#storybook-root')
  assert.match(script, /^\(function collectPage\(/)
  assert.match(script, /fullyVisible: function fullyVisible\(/)
  assert.match(script, /isPortalRoot: function isPortalRoot\(/)
  assert.match(script, /fieldText: function fieldText\(/)
  assert.match(script, /scrollBars: function scrollBars\(/)
})

void test('a checkbox, radio, hidden or password value is not field text; a text value is', () => {
  const field = (tagName: string, type: string, value: string, placeholder = '') => ({
    tagName,
    type,
    value,
    placeholder,
  })
  // A visually hidden radio or checkbox carries a form value, not text a viewer reads.
  assert.equal(fieldText(field('INPUT', 'radio', 'hono-rpc')), '')
  assert.equal(fieldText(field('INPUT', 'checkbox', 'on')), '')
  assert.equal(fieldText(field('INPUT', 'hidden', 'csrf-token')), '')
  assert.equal(fieldText(field('INPUT', 'password', 'hunter2')), '')
  // A password field still shows its placeholder.
  assert.equal(fieldText(field('INPUT', 'password', '', 'Password')), 'Password')
  // A filled password field hides its placeholder.
  assert.equal(fieldText(field('INPUT', 'password', 'hunter2', 'Password')), '')
  // Text inputs and text areas keep their value, then their placeholder.
  assert.equal(fieldText(field('INPUT', 'text', '  Find   a task ')), 'Find a task')
  assert.equal(fieldText(field('INPUT', 'search', '', 'Search…')), 'Search…')
  assert.equal(fieldText(field('TEXTAREA', 'textarea', 'A note')), 'A note')
})

// fidelity.ts renders a frame in renderViewport's size and measures every
// text run in it. A phone frame (390 × 844) with Figma's 38 px status bar
// renders at 390 × 806 (d-102), so a row in the bottom 38 px of the full
// frame is off screen, as on a device, and the text check says so.
const textLayer = (id: string, text: string, y: number, path = ''): Layer => ({
  id,
  name: text,
  type: 'text',
  text,
  x: 16,
  y,
  w: 200,
  h: 20,
  path,
})
const phone = {
  w: 390,
  h: 844,
  layers: [
    { id: '2:1', name: 'Frame', type: 'frame', x: 0, y: 0, w: 390, h: 38, path: '' },
    { ...textLayer('2:2', '9:41', 12, 'Frame'), w: 40, h: 16 },
    textLayer('2:3', 'Inbox', 50),
    textLayer('2:4', 'Running row title', 810),
  ],
  exclude: [{ id: '2:2', text: '9:41', reason: statusBarReason }],
}
// The row sits 812 px down the page: on screen at 844 px, under the fold at 806.
const page = `<body style="margin:0"><div id="storybook-root"><div style="position:relative;height:100vh">
<p style="position:absolute;top:12px;left:16px;margin:0;font:16px/20px sans-serif">Inbox</p>
<p style="position:absolute;top:812px;left:16px;margin:0;font:16px/20px sans-serif">Running row title</p>
</div></div></body>`

async function measureIn(viewport: { w: number; h: number }): Promise<PageMeasure> {
  const browser = await chromium.launch()
  try {
    const tab = await browser.newPage({ viewport: { width: viewport.w, height: viewport.h } })
    await tab.setContent(page)
    return await tab.evaluate<PageMeasure>(collectPageScript('#storybook-root'))
  } finally {
    await browser.close()
  }
}

void test('text in the bottom status-bar band of a phone frame counts as not shown (d-102)', async () => {
  const viewport = renderViewport(phone)
  assert.deepEqual(viewport, { w: 390, h: 806, statusBar: 38 })
  const none = { missing: [], extra: [] }
  const below = checkText(phone, none, await measureIn(viewport))
  assert.deepEqual(below.notVisible, [{ id: '2:4', text: 'Running row title' }])
  // At the full 844 px the same row was counted as shown.
  assert.deepEqual(checkText(phone, none, await measureIn(phone)).notVisible, [])
})

void test('a desktop frame without a status bar renders at its full size', () => {
  const desktop = { w: 1512, h: 982, layers: [textLayer('1:1', 'Inbox', 20)], exclude: [] }
  assert.deepEqual(renderViewport(desktop), { w: 1512, h: 982, statusBar: 0 })
})

// checkRules' scrollBar rule. Chrome leaves an input's padding out of its
// clientWidth: a 498 px input with 2 px of border has a clientWidth of 476,
// which offsetWidth less clientWidth read as a 20 px scroll bar.
const box = {
  overflowX: 'visible',
  overflowY: 'visible',
  scrollWidth: 476,
  scrollHeight: 36,
  clientWidth: 476,
  clientHeight: 36,
  barWidth: 0,
  barHeight: 0,
}

void test('a padded input has no scroll bar', () => {
  assert.equal(scrollBars({ ...box, overflowX: 'clip', overflowY: 'clip', barWidth: 20 }), '')
})

void test('a box that scrolls its overflow, or a classic bar on overflow scroll, is a scroll bar', () => {
  assert.equal(
    scrollBars({ ...box, overflowY: 'auto', scrollHeight: 900, clientHeight: 400 }),
    'vertical: scrollHeight 900 > clientHeight 400, overflow-y auto',
  )
  assert.equal(
    scrollBars({ ...box, overflowX: 'scroll', scrollWidth: 700 }),
    'horizontal: scrollWidth 700 > clientWidth 476, overflow-x scroll',
  )
  assert.equal(scrollBars({ ...box, overflowY: 'scroll', barWidth: 15 }), 'vertical: 15 px, overflow-y scroll')
  // Overflow that the box does not scroll, or a scroll box whose content fits, shows no bar.
  assert.equal(scrollBars({ ...box, overflowY: 'hidden', scrollHeight: 900 }), '')
  assert.equal(scrollBars({ ...box, overflowY: 'auto', scrollHeight: 37 }), '')
})

async function rulesOf(html: string): Promise<PageMeasure['rules']> {
  const browser = await chromium.launch()
  try {
    const tab = await browser.newPage({ viewport: { width: 800, height: 600 } })
    await tab.setContent(`<body style="margin:0"><div id="storybook-root">${html}</div></body>`)
    return (await tab.evaluate<PageMeasure>(collectPageScript('#storybook-root'))).rules
  } finally {
    await browser.close()
  }
}

void test('in Chromium a padded input passes the scrollBar rule and a scrolling box fails it', async () => {
  const input =
    '<input placeholder="Search" style="box-sizing:border-box;width:498px;padding:0 10px;border:1px solid gray">'
  assert.deepEqual(
    (await rulesOf(input)).filter((r) => r.rule === 'scrollBar'),
    [],
  )
  const list = `<section style="height:100px;overflow-y:auto"><div style="height:400px"></div></section>`
  assert.deepEqual(
    (await rulesOf(list)).filter((r) => r.rule === 'scrollBar').map((r) => [r.selector, r.detail]),
    [['section', 'vertical: scrollHeight 400 > clientHeight 100, overflow-y auto']],
  )
})
