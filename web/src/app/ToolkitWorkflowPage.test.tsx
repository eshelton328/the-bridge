import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { setViewport } from '../lib/rendering.ts'

// A workflow on a page of its own (D13) through the real route, with the app's styles and fonts as in main.ts. On
// the desktop the stages run left to right: the single steps sit level with each other, and the two parallel steps
// (4 and 5) one over the other, level with the gap between them. On a phone the stages stand in one column and the
// parallel steps side by side; the page has no list beside it at any width.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let unmount: (() => Promise<void>) | undefined
afterEach(async () => {
  await unmount?.()
  resetAllStores()
  await setViewport(1512, 982)
})

async function renderPage(width: number, height: number) {
  await setViewport(width, height)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/toolkit?state=workflowFullPage'] }),
  })
  ;({ unmount } = await testRender(<RouterProvider router={router} />))
  await expect.poll(() => document.querySelectorAll('[data-figma^="step · "]').length).toBe(9)
  const box = (title: string) => document.querySelector(`[data-figma="step · ${title}"]`)?.getBoundingClientRect()
  return { box }
}

describe('a workflow on its own page', () => {
  it('runs the stages left to right on the desktop, the parallel steps level with the gap between them (D13)', async () => {
    const { box } = await renderPage(1512, 982)
    const runs = box('Runs')
    const facts = box('Facts')
    const primary = box('Primary grades')
    const second = box('Second grades')
    expect(Math.round(facts?.top ?? -1)).toBe(Math.round(runs?.top ?? 0))
    expect(facts?.left ?? 0).toBeGreaterThan(runs?.right ?? 0)
    expect(Math.round(primary?.left ?? -1)).toBe(Math.round(second?.left ?? 0))
    expect(second?.top ?? 0).toBeGreaterThan(primary?.bottom ?? 0)
    // The single steps sit level with the middle of the gap between the parallel ones.
    const gap = ((primary?.bottom ?? 0) + (second?.top ?? 0)) / 2
    const middle = ((runs?.top ?? 0) + (runs?.bottom ?? 0)) / 2
    expect(Math.abs(middle - gap)).toBeLessThan(1)
    // Every card has one height.
    expect(Math.round(primary?.height ?? -1)).toBe(Math.round(runs?.height ?? 0))
    expect(document.querySelector('[data-figma="toolkit list"]')).toBeNull()
  })

  it('stands the stages in one column on the phone, the parallel steps side by side', async () => {
    const { box } = await renderPage(390, 844)
    const runs = box('Runs')
    const facts = box('Facts')
    const primary = box('Primary grades')
    const second = box('Second grades')
    expect(facts?.top ?? 0).toBeGreaterThan(runs?.bottom ?? 0)
    expect(Math.round(primary?.top ?? -1)).toBe(Math.round(second?.top ?? 0))
    expect(second?.left ?? 0).toBeGreaterThan(primary?.right ?? 0)
    expect(document.querySelector('[data-figma="toolkit list"]')).toBeNull()
  })
})

// The same page on a tablet (T8, workflowFullPageTablet): the steps stand in one column as wide as the item, with no
// panel or header over them; an arrow points at each of the parallel steps (the fork) and one arrow comes out of them
// (the join); the breadcrumb row is the back row, and the selected step's panel comes under the column.
async function renderTablet() {
  await setViewport(756, 1129)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/toolkit?state=workflowFullPageTablet'] }),
  })
  ;({ unmount } = await testRender(<RouterProvider router={router} />))
  await expect.poll(() => document.querySelectorAll('[data-figma^="step · "]').length).toBe(9)
  const box = (key: string) => document.querySelector(`[data-figma="${key}"]`)?.getBoundingClientRect()
  return { box }
}

describe('a workflow on its own page on a tablet', () => {
  it('stands the steps in a column as wide as the item, forked into the parallel steps and joined out of them (T8)', async () => {
    const { box } = await renderTablet()
    const item = box('toolkit item')
    const runs = box('step · Runs')
    const facts = box('step · Facts')
    const primary = box('step · Primary grades')
    const second = box('step · Second grades')
    expect(Math.round(runs?.width ?? -1)).toBe(Math.round(item?.width ?? 0))
    expect(facts?.top ?? 0).toBeGreaterThan(runs?.bottom ?? 0)
    expect(Math.round(primary?.top ?? -1)).toBe(Math.round(second?.top ?? 0))
    expect(second?.left ?? 0).toBeGreaterThan(primary?.right ?? 0)
    // The fork has an arrow over each parallel step; the join one arrow in the middle of the column.
    const fork = document.querySelector('[data-figma="fork · 4 and 5"]')
    const join = document.querySelector('[data-figma="join · 4 and 5"]')
    expect(fork?.querySelectorAll('.flow-branch__head').length).toBe(2)
    expect(join?.querySelectorAll('.flow-branch__head').length).toBe(1)
    const forkTop = fork?.getBoundingClientRect().top ?? 0
    expect(forkTop).toBeGreaterThanOrEqual(box('step · Blinding')?.bottom ?? Number.POSITIVE_INFINITY)
    expect(primary?.top ?? 0).toBeGreaterThanOrEqual(fork?.getBoundingClientRect().bottom ?? Number.POSITIVE_INFINITY)
    // No panel or header over the steps, and the selected step's panel under them.
    expect(document.querySelector('[data-figma="panel · flow"]')).toBeNull()
    expect(document.querySelector('[data-figma="breadcrumb row"]')).not.toBeNull()
    expect(box('step 4 details')?.top ?? 0).toBeGreaterThan(box('step · Owner decides')?.bottom ?? 0)
    expect(document.querySelector('[data-figma="toolkit list"]')).toBeNull()
  })
})

// The same page on the phone (M9, workflowFullPagePhone, T8's data): the steps stand in one column as wide as the
// phone's item, with an arrow over each parallel step and one out of them; the breadcrumb names only the workflow after
// Toolkit, and the page ends with the steps, with no details panel under them.
async function renderPhone() {
  await setViewport(390, 806)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/toolkit?state=workflowFullPagePhone'] }),
  })
  ;({ unmount } = await testRender(<RouterProvider router={router} />))
  await expect.poll(() => document.querySelectorAll('[data-figma^="step · "]').length).toBe(9)
  const box = (key: string) => document.querySelector(`[data-figma="${key}"]`)?.getBoundingClientRect()
  return { box }
}

describe('a workflow on its own page on the phone', () => {
  it('stands the steps in a column as wide as the item, with no details panel under them (M9)', async () => {
    const { box } = await renderPhone()
    const item = box('toolkit')
    const runs = box('step · Runs')
    const primary = box('step · Primary grades')
    const second = box('step · Second grades')
    expect(Math.round(runs?.width ?? -1)).toBe(Math.round(item?.width ?? 0))
    expect(Math.round(primary?.top ?? -1)).toBe(Math.round(second?.top ?? 0))
    expect(second?.left ?? 0).toBeGreaterThan(primary?.right ?? 0)
    // The parallel cards are as high as the taller one, whose note wraps.
    expect(Math.round(primary?.height ?? -1)).toBe(Math.round(second?.height ?? 0))
    expect(second?.height ?? 0).toBeGreaterThan(runs?.height ?? Number.POSITIVE_INFINITY)
    const fork = document.querySelector('[data-figma="arrows · into 4 and 5"]')
    const join = document.querySelector('[data-figma="arrows · out of 4 and 5"]')
    expect(fork?.querySelectorAll('.flow-branch__head').length).toBe(2)
    expect(join?.querySelectorAll('.flow-branch__head').length).toBe(1)
    expect(Math.round(fork?.getBoundingClientRect().height ?? -1)).toBe(24)
    // The breadcrumb is Toolkit › skill-eval-round; the page has no path row, details panel or list.
    const trail = document.querySelector('nav[aria-label="Breadcrumb"]')
    expect(trail?.textContent).toContain('skill-eval-round')
    expect(trail?.textContent).not.toContain('Workflows')
    expect(document.querySelector('[data-figma="path row"]')).toBeNull()
    expect(document.querySelector('[data-figma="step 4 details"]')).toBeNull()
    expect(document.querySelector('[data-figma="toolkit list"]')).toBeNull()
  })
})

// M9's note: on the phone a tap on a step shows its details. The page as loaded (M9) shows none; a tap on a step puts
// that step's panel under the column, with its fields (input, output, model, what happens when it fails), and a tap on
// another step shows that one's.
describe('a tap on a step of a workflow on its own page on the phone', () => {
  it('shows the step’s details under the steps (M9)', async () => {
    const { box } = await renderPhone()
    expect(document.querySelector('[data-figma="step 4 details"]')).toBeNull()
    const primary = document.querySelector('[data-figma="step · Primary grades"] button')
    if (!(primary instanceof HTMLElement)) throw new Error('step 4 has no button')
    await page.elementLocator(primary).click()
    await expect.poll(() => document.querySelector('[data-figma="step 4 details"]')).not.toBeNull()
    const details = document.querySelector('[data-figma="step 4 details"]')
    for (const label of ['Input', 'Output', 'Model', 'If it fails'])
      expect(details?.querySelector(`[data-figma="field · ${label}"]`)?.textContent).toContain(label)
    expect(box('step 4 details')?.top ?? 0).toBeGreaterThan(box('step · Owner decides')?.bottom ?? 0)
    expect(Math.round(box('step 4 details')?.width ?? -1)).toBe(Math.round(box('step · Runs')?.width ?? 0))
    // Only the step's panel: the phone shows no gates or rounds.
    expect(document.querySelector('[data-figma="panel · gates"]')).toBeNull()
    const runs = document.querySelector('[data-figma="step · Runs"] button')
    if (!(runs instanceof HTMLElement)) throw new Error('step 1 has no button')
    await page.elementLocator(runs).click()
    await expect.poll(() => document.querySelector('[data-figma="step 1 details"]')).not.toBeNull()
    expect(document.querySelector('[data-figma="step 4 details"]')).toBeNull()
  })
})

// The connectors are the library's (FlowLine, FlowBranch and FlowLoop, library #133 and #137): each joins two steps,
// or a gate and the stop, and its tip ends short of the box it points at, so no tip touches a step or the stop.
type Way = 'right' | 'down' | 'left'

/** The gap from a tip to the nearest step or stop box it points at, or null when none is in its way. */
function tipGap(head: DOMRect, way: Way): number | null {
  const targets = [...document.querySelectorAll('[data-figma^="step · "], [data-figma^="stop · "]')].map((el) =>
    el.getBoundingClientRect(),
  )
  const across = (t: DOMRect) =>
    way === 'down' ? t.left < head.right && t.right > head.left : t.top < head.bottom && t.bottom > head.top
  const gap = (t: DOMRect) =>
    way === 'right' ? t.left - head.right : way === 'down' ? t.top - head.bottom : head.left - t.right
  const gaps = targets
    .filter(across)
    .map(gap)
    .filter((g) => g > -12)
  return gaps.length === 0 ? null : Math.min(...gaps)
}

function expectTips(selector: string, way: Way, count: number) {
  const heads = [...document.querySelectorAll(selector)].map((el) => el.getBoundingClientRect())
  expect(heads.length).toBe(count)
  for (const head of heads) {
    const gap = tipGap(head, way)
    expect(gap).not.toBeNull()
    expect(gap ?? 0).toBeGreaterThanOrEqual(1)
    expect(gap ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(8)
  }
}

describe('the connectors of a workflow on its own page', () => {
  it('draws the library’s lines, fork, join and loop on the desktop, each tip clear of its step (D13)', async () => {
    await renderPage(1512, 982)
    const flow = document.querySelector('[data-figma="flow"]')
    expect(flow?.querySelectorAll('.flow-line__root[data-direction="right"]').length).toBe(5)
    expect(flow?.querySelectorAll('.flow-branch__root[data-kind="fork"][data-direction="right"]').length).toBe(1)
    expect(flow?.querySelectorAll('.flow-branch__root[data-kind="join"][data-direction="right"]').length).toBe(1)
    expect(flow?.querySelectorAll('.flow-loop__root').length).toBe(1)
    expect(flow?.querySelectorAll('svg').length).toBe(1)
    expectTips('[data-figma="flow"] .flow-line__root[data-direction="right"] .flow-line__head', 'right', 5)
    expectTips('[data-figma="flow"] .flow-branch__head', 'right', 3)
    // The gate's way out runs down to the stop, with its label beside it; the loop comes back into the stop.
    const exit = flow?.querySelector('.flow-line__root[data-direction="down"]')
    expect(exit?.textContent).toBe('no')
    expectTips('[data-figma="flow"] .flow-line__root[data-direction="down"] .flow-line__head', 'down', 1)
    expectTips('[data-figma="flow"] .flow-loop__head', 'left', 1)
    const loop = flow?.querySelector('.flow-loop__root')?.getBoundingClientRect()
    const stop = document.querySelector('[data-figma^="stop · "]')?.getBoundingClientRect()
    const owner = document.querySelector('[data-figma="step · Owner decides"]')?.getBoundingClientRect()
    expect(Math.abs((loop?.left ?? 0) - (stop?.right ?? -9))).toBeLessThan(1)
    expect(Math.abs((loop?.right ?? 0) - ((owner?.left ?? 0) + (owner?.right ?? 0)) / 2)).toBeLessThan(1)
    expect(Math.abs((loop?.top ?? 0) - (owner?.bottom ?? -9))).toBeLessThan(1)
    expect(Math.abs((loop?.bottom ?? 0) - ((stop?.top ?? 0) + (stop?.bottom ?? 0)) / 2)).toBeLessThan(1)
  })

  it('draws the library’s lines, fork and join down the column on a tablet, each tip clear of its step (T8)', async () => {
    await renderTablet()
    const steps = document.querySelector('[data-figma="steps"]')
    expect(steps?.querySelectorAll('.flow-line__root[data-direction="down"]').length).toBe(5)
    expect(document.querySelectorAll('[data-figma="fork · 4 and 5"] .flow-branch__root[data-kind="fork"]').length).toBe(
      1,
    )
    expect(document.querySelectorAll('[data-figma="join · 4 and 5"] .flow-branch__root[data-kind="join"]').length).toBe(
      1,
    )
    expectTips('[data-figma="steps"] .flow-line__head', 'down', 5)
    expectTips('[data-figma="steps"] .flow-branch__head', 'down', 3)
  })

  it('draws the library’s lines, fork and join down the column on the phone, each tip clear of its step (M9)', async () => {
    await renderPhone()
    const steps = document.querySelector('[data-figma="steps"]')
    expect(steps?.querySelectorAll('.flow-line__root[data-direction="down"]').length).toBe(5)
    expect(
      document.querySelectorAll('[data-figma="arrows · into 4 and 5"] .flow-branch__root[data-kind="fork"]').length,
    ).toBe(1)
    expect(
      document.querySelectorAll('[data-figma="arrows · out of 4 and 5"] .flow-branch__root[data-kind="join"]').length,
    ).toBe(1)
    expectTips('[data-figma="steps"] .flow-line__head', 'down', 5)
    expectTips('[data-figma="steps"] .flow-branch__head', 'down', 3)
  })
})

// The loop and the other connectors are drawn over the flow, so none of them may catch a click meant for a step:
// a click anywhere on "Second grades", which the loop's box crosses, selects that step (D13).
describe('a click on a step of a workflow on its own page on the desktop', () => {
  it('selects the step at its middle and its lower part, under the loop’s box (D13)', async () => {
    const { box } = await renderPage(1512, 982)
    const second = box('Second grades')
    if (second === undefined) throw new Error('step 5 has no box')
    const x = (second.left + second.right) / 2
    for (const share of [0.5, 0.75, 0.9]) {
      const y = second.top + second.height * share
      const hit = document.elementFromPoint(x, y)
      expect(hit?.closest('[data-figma="step · Second grades"]')).not.toBeNull()
    }
    const lower = document.elementFromPoint(x, second.top + second.height * 0.75)
    if (!(lower instanceof HTMLElement)) throw new Error('nothing at the lower part of step 5')
    lower.click()
    await expect
      .poll(() => document.querySelector('[data-figma="step · Second grades"] button')?.getAttribute('aria-pressed'))
      .toBe('true')
  })
})
