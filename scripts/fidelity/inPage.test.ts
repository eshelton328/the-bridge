// Tests for the pure helpers of inPage.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { renderViewport } from './checkPosition.ts'
import { checkText } from './checkText.ts'
import { statusBarReason, type Layer } from './figmaMetadata.ts'
import {
  collectPageScript,
  coveredAt,
  fieldText,
  fieldTextLines,
  fullyVisible,
  isPortalRoot,
  paints,
  samplePoints,
  scrollBars,
  type PageMeasure,
} from './inPage.ts'

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
  assert.match(script, /samplePoints: function samplePoints\(/)
  assert.match(script, /paints: function paints\(/)
  assert.match(script, /fieldTextLines: function fieldTextLines\(/)
  assert.match(script, /coveredAt: function coveredAt\(/)
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
const box = { overflowX: 'visible', overflowY: 'visible', clientHeight: 36, barWidth: 0, barHeight: 0 }

void test('a padded input has no scroll bar', () => {
  assert.equal(scrollBars({ ...box, overflowX: 'clip', overflowY: 'clip', barWidth: 20 }), '')
})

void test('a bar that takes space on an axis whose overflow is auto or scroll is a scroll bar', () => {
  assert.equal(scrollBars({ ...box, overflowY: 'auto', barWidth: 12 }), 'vertical 12 px, overflow-y auto')
  assert.equal(
    scrollBars({ ...box, overflowX: 'scroll', overflowY: 'scroll', barWidth: 15, barHeight: 15 }),
    'vertical 15 px, overflow-y scroll, horizontal 15 px, overflow-x scroll',
  )
  // The space on an axis that does not scroll is no bar; a box with no height has none.
  assert.equal(scrollBars({ ...box, overflowX: 'auto', barWidth: 12 }), '')
  assert.equal(scrollBars({ ...box, overflowY: 'auto', barWidth: 12, clientHeight: 0 }), '')
})

void test('a box that scrolls its overflow with no bar that takes space has no scroll bar (d-107)', () => {
  assert.equal(scrollBars({ ...box, overflowY: 'auto' }), '')
  assert.equal(scrollBars({ ...box, overflowX: 'scroll', barHeight: 0.4 }), '')
})

/**
 * The rule findings of `html`. Playwright launches Chromium with
 * --hide-scrollbars, under which no bar takes space; `classicBars` leaves
 * that flag out, so a bar styled with ::-webkit-scrollbar takes its width.
 */
async function rulesOf(html: string, classicBars = false): Promise<PageMeasure['rules']> {
  const browser = await chromium.launch(classicBars ? { ignoreDefaultArgs: ['--hide-scrollbars'] } : {})
  try {
    const tab = await browser.newPage({ viewport: { width: 800, height: 600 } })
    await tab.setContent(`<body style="margin:0"><div id="storybook-root">${html}</div></body>`)
    return (await tab.evaluate<PageMeasure>(collectPageScript('#storybook-root'))).rules
  } finally {
    await browser.close()
  }
}

void test('in Chromium a padded input passes the scrollBar rule and a classic scroll bar fails it', async () => {
  const input =
    '<input placeholder="Search" style="box-sizing:border-box;width:498px;padding:0 10px;border:1px solid gray">'
  assert.deepEqual(
    (await rulesOf(input, true)).filter((r) => r.rule === 'scrollBar'),
    [],
  )
  // A classic bar, forced so the test does not depend on the OS's scroll bars.
  const bar = `<style>.bar::-webkit-scrollbar { width: 12px; height: 12px }</style>
<section class="bar" style="height:100px;overflow-y:auto"><div style="height:400px"></div></section>`
  assert.deepEqual(
    (await rulesOf(bar, true)).filter((r) => r.rule === 'scrollBar').map((r) => [r.selector, r.detail]),
    [['section.bar', 'vertical 12 px, overflow-y auto']],
  )
})

void test('in Chromium a box that scrolls but draws no bar that takes space passes the scrollBar rule', async () => {
  const overlay = `<style>.quiet::-webkit-scrollbar { width: 0; height: 0 }</style>
<section class="quiet" style="height:100px;overflow-y:auto"><div style="height:400px"></div></section>`
  assert.deepEqual(
    (await rulesOf(overlay, true)).filter((r) => r.rule === 'scrollBar'),
    [],
  )
})

// Covered text. Workbench D01: an open pane menu covered "…a chat." in the
// render, and the text check passed.
void test('a run is sampled at three points along the middle of each line it draws', () => {
  assert.deepEqual(samplePoints([edges(0, 10, 100, 30), edges(5, 5, 5, 20)]), [
    { x: 10, y: 20 },
    { x: 50, y: 20 },
    { x: 90, y: 20 },
  ])
})

void test('a field is tested only where its text is, not over its whole box', () => {
  // Inbox T12: a menu covers the right end of "Add a note for yourself…", not its text.
  const field = {
    box: edges(20, 700, 740, 740),
    startInset: 13,
    endInset: 13,
    topInset: 9,
    bottomInset: 9,
    lineHeight: 22,
    paragraphWidths: [150],
    multiline: false,
  }
  assert.deepEqual(fieldTextLines({ ...field, textAlign: 'start' }), [edges(33, 700, 183, 740)])
  assert.deepEqual(fieldTextLines({ ...field, textAlign: 'right' }), [edges(577, 700, 727, 740)])
  assert.deepEqual(fieldTextLines({ ...field, textAlign: 'center' }), [edges(305, 700, 455, 740)])
  // Text wider than the field stops at its padding.
  assert.deepEqual(fieldTextLines({ ...field, paragraphWidths: [900], textAlign: 'left' }), [edges(33, 700, 727, 740)])
})

void test('a text area is tested on the lines its text takes from the top, not at its middle', () => {
  // A 300 px text area: content box 33–727 wide, from y 109; 22 px lines.
  const area = {
    box: edges(20, 100, 740, 400),
    startInset: 13,
    endInset: 13,
    topInset: 9,
    bottomInset: 9,
    lineHeight: 22,
    multiline: true,
    textAlign: 'start',
  }
  // One paragraph that wraps once, a blank line, then a short one.
  assert.deepEqual(fieldTextLines({ ...area, paragraphWidths: [900, 0, 120] }), [
    edges(33, 109, 727, 131),
    edges(33, 131, 239, 153),
    edges(33, 175, 153, 197),
  ])
  // Lines below the content box are scrolled away, so they are not tested.
  assert.deepEqual(fieldTextLines({ ...area, box: edges(20, 100, 740, 150), paragraphWidths: [80, 80, 80] }), [
    edges(33, 109, 113, 131),
  ])
})

void test("in Chromium an overlay over a text area's blank space does not cover its text; one over its text does", async () => {
  const page = (overlayTop: number) => `<body style="margin:0;font:16px/20px sans-serif">
<div id="storybook-root"><div><textarea style="position:absolute;top:20px;left:20px;width:400px;height:300px;padding:8px;border:1px solid gray;font:16px/20px sans-serif;resize:none">A short note</textarea></div></div>
<div style="position:fixed;top:${String(overlayTop)}px;left:0;width:500px;height:60px;background:rgb(30,30,40)"></div></body>`
  const coveredOf = async (overlayTop: number) =>
    (await measureHtml(page(overlayTop))).visibleTexts.find((v) => v.text === 'A short note')?.covered
  // Over the middle of the box, where it has no text.
  assert.equal(await coveredOf(150), false)
  // Over its first line, at the top of the box.
  assert.equal(await coveredOf(20), true)
})

void test('an element paints when it has a background, an image or replaced content', () => {
  const el = (backgroundColor: string, tagName = 'DIV', backgroundImage = 'none', backdropFilter = 'none') => ({
    tagName,
    backgroundColor,
    backgroundImage,
    backdropFilter,
  })
  assert.equal(paints(el('rgb(20, 22, 30)')), true)
  assert.equal(paints(el('rgba(0, 0, 0, 0.5)')), true)
  assert.equal(paints(el('rgba(0, 0, 0, 0)')), false)
  assert.equal(paints(el('rgb(0 0 0 / 0)')), false)
  assert.equal(paints(el('color(srgb 0.1 0.1 0.1 / 0.9)')), true)
  assert.equal(paints(el('transparent')), false)
  assert.equal(paints(el('rgba(0, 0, 0, 0)', 'svg')), true)
  assert.equal(paints(el('rgba(0, 0, 0, 0)', 'DIV', 'linear-gradient(red, blue)')), true)
  assert.equal(paints(el('rgba(0, 0, 0, 0)', 'DIV', 'none', 'blur(8px)')), true)
})

void test('a run is covered when an unrelated element that shows and paints is above it at a point', () => {
  const own = { related: true, shown: true, paints: false }
  const menu = { related: false, shown: true, paints: true }
  const positioner = { related: false, shown: true, paints: false }
  const invisible = { related: false, shown: false, paints: true }
  assert.equal(coveredAt([[own]]), false)
  assert.equal(coveredAt([[own], [menu, own]]), true)
  assert.equal(coveredAt([[positioner, own]]), false)
  assert.equal(coveredAt([[invisible, own]]), false)
  assert.equal(coveredAt([[positioner, menu, own]]), true)
  // Below the run's own element nothing counts; no element at all is not covered.
  assert.equal(coveredAt([[own, menu], []]), false)
})

async function measureHtml(html: string, viewport = { w: 600, h: 400 }): Promise<PageMeasure> {
  const browser = await chromium.launch()
  try {
    const tab = await browser.newPage({ viewport: { width: viewport.w, height: viewport.h } })
    await tab.setContent(html)
    return await tab.evaluate<PageMeasure>(collectPageScript('#storybook-root'))
  } finally {
    await browser.close()
  }
}

void test('in Chromium a run under an open menu is covered; under a transparent box or nothing it is not', async () => {
  const measured = await measureHtml(`<body style="margin:0;font:16px/20px sans-serif">
<div id="storybook-root"><div style="position:relative;height:100vh">
<p style="position:absolute;top:20px;left:20px;margin:0">Start a chat.</p>
<p style="position:absolute;top:80px;left:20px;margin:0">Under a positioner</p>
<p style="position:absolute;top:140px;left:20px;margin:0;pointer-events:none">Not covered</p>
<div style="position:absolute;top:60px;left:0;width:400px;height:60px"></div>
<input placeholder="Add a note" style="position:absolute;top:200px;left:20px;width:500px;padding:4px 12px">
</div></div>
<div style="position:fixed;top:190px;left:300px;width:200px;height:60px;background:rgb(30,30,40)"></div>
<div><input placeholder="Search chats" style="position:fixed;top:300px;left:20px;width:500px;padding:4px 12px"></div>
<div style="position:fixed;top:290px;left:0;width:200px;height:60px;background:rgb(30,30,40)"></div>
<div style="position:fixed;top:10px;left:60px;width:200px;height:40px;background:rgb(30,30,40)"><span>Rename</span></div>
</body>`)
  const covered = Object.fromEntries(measured.visibleTexts.map((v) => [v.text, v.covered]))
  assert.deepEqual(covered, {
    'Start a chat.': true,
    'Under a positioner': false,
    'Not covered': false,
    'Add a note': false,
    'Search chats': true,
    Rename: false,
  })
  // The text check fails the covered run where Figma draws nothing over it.
  const rename: Layer = { ...textLayer('3:4', 'Rename', 20), x: 70 }
  const layers: Layer[] = [
    { ...textLayer('3:1', 'Start a chat.', 20), x: 20 },
    { ...textLayer('3:2', 'Under a positioner', 80), x: 20 },
    { ...textLayer('3:3', 'Not covered', 140), x: 20 },
  ]
  const text = checkText(
    { w: 600, h: 400, layers: [...layers, rename], exclude: [] },
    { missing: [], extra: [] },
    measured,
  )
  assert.deepEqual(text.notVisible, [{ id: '3:1', text: 'Start a chat.', covered: true }])
  // With the menu in Figma too (a later layer over the text), it passes.
  const menu: Layer = { id: '3:5', name: 'menu', type: 'frame', x: 60, y: 10, w: 200, h: 40, path: '' }
  const both = checkText(
    { w: 600, h: 400, layers: [...layers, menu, { ...rename, path: 'menu' }], exclude: [] },
    { missing: [], extra: [] },
    measured,
  )
  assert.deepEqual(both.notVisible, [])
})

void test('in Chromium a child that paints over the text of its parent covers it', async () => {
  const measured = await measureHtml(`<body style="margin:0;font:16px/20px sans-serif">
<div id="storybook-root"><p style="position:relative;margin:20px">Parent text
<span style="position:absolute;left:0;top:0;width:200px;height:20px;background:rgb(30,30,40)">Badge</span></p>
<p style="margin:20px">Plain <b>bold</b> text</p></div></body>`)
  const covered = Object.fromEntries(measured.visibleTexts.map((v) => [v.text, v.covered]))
  assert.deepEqual(covered, { 'Parent text': true, Badge: false, Plain: false, bold: false, text: false })
})
