// Tests for checkIcons.ts and the icon sizes in checkPosition.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { iconSizeDiffs } from './checkIcons.ts'
import { checkPosition } from './checkPosition.ts'
import type { Layer } from './figmaMetadata.ts'
import { collectPageScript, type PageMeasure } from './inPage.ts'

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
const icon = (x: number, y: number, w: number, h: number, selector = 'svg', covered = false) => ({
  selector,
  x,
  y,
  w,
  h,
  covered,
})
const ref = (layers: Layer[]) => ({ layers, h: 982, tolerance: 4 })

void test('an icon drawn at 12 px where Figma has 16 px is a difference (library #217)', () => {
  // A sidebar row's 16 px icon slot, its 12 px icon centred in it.
  const r = iconSizeDiffs(
    ref([layer('105:644', 'kind · claude', 98, 105, 16, 16, 'Frame > Frame')]),
    [icon(100, 107, 12, 12)],
    0,
  )
  assert.equal(r.checked, 1)
  assert.equal(r.diffs.length, 1)
  const diff = r.diffs[0]
  assert.ok(diff)
  assert.equal(diff.key, '105:644')
  assert.equal(diff.problem, 'iconSize')
  assert.deepEqual(diff.delta, { x: 2, y: 2, w: -4, h: -4 })
  assert.match(diff.detail, /kind · claude is 16 × 16 px in Figma and 12 × 12 px in the render/)
})

void test("a size within 2 px of Figma's passes", () => {
  const layers = [layer('1:1', 'icon/inbox', 20, 72, 22, 22), layer('1:2', 'icon/more', 100, 10, 13, 13)]
  const r = iconSizeDiffs(ref(layers), [icon(19, 71, 24, 24), icon(100.5, 10.5, 12, 12)], 0)
  assert.equal(r.checked, 2)
  assert.deepEqual(r.diffs, [])
})

void test('a Figma icon with no render icon near its centre is left to the other checks', () => {
  const r = iconSizeDiffs(ref([layer('1:1', 'icon/inbox', 20, 72, 16, 16)]), [icon(40, 72, 12, 12)], 0)
  assert.deepEqual(r, { checked: 0, diffs: [], excepted: [] })
})

void test('the nearest render icon is the match', () => {
  const r = iconSizeDiffs(
    ref([layer('1:1', 'icon/x', 100, 100, 16, 16)]),
    [icon(103, 102, 12, 12), icon(100, 100, 16, 16)],
    0,
  )
  assert.deepEqual(r, { checked: 1, diffs: [], excepted: [] })
})

void test('a role layer that holds an icon is a container, and its icon is checked', () => {
  const layers = [
    layer('346:196', 'kind · Approval', 86, 168, 28, 28, 'inbox list > row'),
    layer('346:197', 'icon/approve', 92, 174, 16, 16, 'inbox list > row > kind · Approval'),
  ]
  assert.deepEqual(iconSizeDiffs(ref(layers), [icon(93, 175, 16, 16)], 0), { checked: 1, diffs: [], excepted: [] })
  const small = iconSizeDiffs(ref(layers), [icon(95, 177, 12, 12)], 0)
  assert.deepEqual(
    small.diffs.map((d) => d.key),
    ['346:197'],
  )
})

void test('an icon inside an icon, under the status bar or past the frame is not checked', () => {
  const layers = [
    layer('1:1', 'icon/battery', 340, 10, 24, 12),
    layer('1:2', 'icon/inbox', 20, 100, 16, 16),
    layer('1:3', 'icon/dot', 24, 104, 8, 8, 'row > icon/inbox'),
    layer('1:4', 'icon/far', 20, 980, 16, 16),
  ]
  // A 38 px status bar: render y is Figma y less 38.
  const r = iconSizeDiffs(ref(layers), [icon(20, 62, 16, 16), icon(26, 68, 4, 4), icon(340, 0, 12, 12)], 38)
  assert.deepEqual(r, { checked: 1, diffs: [], excepted: [] })
})

void test('the position check reports an icon size difference, and a position exception by node id takes it', () => {
  const layers = [layer('158:9', 'icon/chat', 20, 100, 16, 16)]
  const small = [icon(22, 102, 12, 12)]
  const r = checkPosition({ layers, tolerance: 4, exclude: [], h: 982 }, { position: [] }, [], 4, small)
  assert.equal(r.ok, false)
  assert.equal(r.iconsChecked, 1)
  assert.deepEqual(
    r.diffs.map((d) => [d.key, d.problem]),
    [['158:9', 'iconSize']],
  )
  const excepted = checkPosition(
    { layers, tolerance: 4, exclude: [], h: 982 },
    { position: [{ layer: '158:9', reason: 'a test' }] },
    [],
    4,
    small,
  )
  assert.equal(excepted.ok, true)
  assert.deepEqual(excepted.excepted, ['158:9'])
})

void test('the position check matches icons within its own tolerance, as given by --tolerance', () => {
  // The render icon's centre is 6 px from Figma's: outside the frame's 4 px, inside 8 px.
  const layers = [layer('158:9', 'icon/chat', 20, 100, 16, 16)]
  const r = checkPosition({ layers, tolerance: 4, exclude: [], h: 982 }, { position: [] }, [], 8, [
    icon(28, 102, 12, 12),
  ])
  assert.equal(r.iconsChecked, 1)
  assert.deepEqual(
    r.diffs.map((d) => d.problem),
    ['iconSize'],
  )
})

void test('an icon another element covers is not matched (Workspaces D05: the composer Send under the side chat)', () => {
  const layers = [layer('158:549', 'icon/send', 100, 100, 16, 16)]
  // The covered svg is nearer (1 px) than the one the viewer sees (3 px).
  const r = iconSizeDiffs(ref(layers), [icon(101, 100, 12, 12, 'under', true), icon(103, 100, 16, 16, 'top')], 0)
  assert.deepEqual(r, { checked: 1, diffs: [], excepted: [] })
  assert.deepEqual(iconSizeDiffs(ref(layers), [icon(101, 100, 12, 12, 'under', true)], 0), {
    checked: 0,
    diffs: [],
    excepted: [],
  })
})

void test('a position exception with iconSize passes only that size, give or take 2 px', () => {
  const layers = [layer('402:1', 'icon/artifacts', 20, 100, 20, 20)]
  const at = (size: number) =>
    checkPosition(
      { layers, tolerance: 4, exclude: [], h: 982 },
      { position: [{ layer: '402:1', iconSize: 24, reason: 'the rail draws 24 px icons (d-100)' }] },
      [],
      4,
      [icon(30 - size / 2, 110 - size / 2, size, size)],
    )
  assert.equal(at(24).ok, true)
  assert.deepEqual(at(24).excepted, ['402:1'])
  for (const size of [12, 48]) {
    const r = at(size)
    assert.equal(r.ok, false)
    assert.match(r.diffs[0]?.detail ?? '', /its position exception allows 24 px/)
  }
  // Figma's 20 px, within the slack, no longer passes: only the exception's size does.
  for (const size of [18, 20]) assert.equal(at(size).ok, false)
  // With no iconSize the entry still passes any size.
  const any = checkPosition(
    { layers, tolerance: 4, exclude: [], h: 982 },
    { position: [{ layer: '402:1', reason: 'r' }] },
    [],
    4,
    [icon(24, 104, 12, 12)],
  )
  assert.equal(any.ok, true)
})

void test('the page measure marks an svg that another element draws over as covered', async () => {
  const browser = await chromium.launch()
  try {
    const tab = await browser.newPage({ viewport: { width: 800, height: 600 } })
    // Each icon draws a square path over its whole box.
    const icon16 = (left: number, style = '') =>
      `<svg width="16" height="16" style="position:absolute;left:${String(left)}px;top:10px;${style}"><path d="M0 0h16v16H0z"/></svg>`
    await tab.setContent(
      `<body style="margin:0"><div id="storybook-root">${icon16(10, 'pointer-events:none')}${icon16(100)}${icon16(200)}<div style="position:absolute;left:0;top:0;width:50px;height:50px;background:#000"></div><svg width="60" height="60" style="position:absolute;left:180px;top:0"><circle cx="5" cy="5" r="4"/></svg>${icon16(300)}<svg width="60" height="60" style="position:absolute;left:280px;top:0"><path d="M0 0h60v60H0z"/></svg></div></body>`,
    )
    const measured = await tab.evaluate<PageMeasure>(collectPageScript('#storybook-root'))
    // 10: under an opaque box. 100: nothing over it. 200: under the
    // transparent part of a larger svg, so seen. 300: under another svg's
    // filled shape.
    assert.deepEqual(
      measured.iconBoxes.filter((b) => b.w === 16).map((b) => [b.x, b.covered]),
      [
        [10, true],
        [100, false],
        [200, false],
        [300, true],
      ],
    )
  } finally {
    await browser.close()
  }
})

void test('the page measure lists each outermost svg that is shown, with its box', async () => {
  const browser = await chromium.launch()
  try {
    const tab = await browser.newPage({ viewport: { width: 800, height: 600 } })
    const svg = (style: string, inner = '') => `<svg width="12" height="12" style="${style}">${inner}</svg>`
    await tab.setContent(
      `<body style="margin:0"><div id="storybook-root"><span style="position:absolute;left:10px;top:20px">${svg('display:block', '<svg width="4" height="4"></svg>')}</span>${svg('display:none')}${svg('visibility:hidden')}</div></body>`,
    )
    const measured = await tab.evaluate<PageMeasure>(collectPageScript('#storybook-root'))
    assert.deepEqual(
      measured.iconBoxes.map(({ x, y, w, h }) => ({ x, y, w, h })),
      [{ x: 10, y: 20, w: 12, h: 12 }],
    )
  } finally {
    await browser.close()
  }
})
