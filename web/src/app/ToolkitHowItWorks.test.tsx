import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The How it works tab of an open skill through the real route, with the app's styles and fonts as in main.ts. On
// the desktop (D14) the steps sit four to a row; on a narrow screen (T10 and M12 draw them in a column) four columns
// would leave each card about 50 px wide, so the steps stack in one column, each card as wide as the list.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let unmount: (() => Promise<void>) | undefined
afterEach(async () => {
  await unmount?.()
  resetAllStores()
  await page.viewport(1512, 982)
})

async function renderSteps(width: number, height: number) {
  await page.viewport(width, height)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/toolkit?state=skillHowItWorks'] }),
  })
  ;({ unmount } = await testRender(<RouterProvider router={router} />))
  await expect.poll(() => document.querySelectorAll('[data-figma^="step "]').length).toBeGreaterThan(4)
  const list = document.querySelector('[data-figma="steps"]')?.getBoundingClientRect()
  const cards = [...document.querySelectorAll('[data-figma^="step "]')].map((c) => c.getBoundingClientRect())
  return { list, cards }
}

describe('the How it works steps', () => {
  it('stack in one column on the phone, each card as wide as the list', async () => {
    const { list, cards } = await renderSteps(390, 844)
    expect(list).toBeDefined()
    for (const c of cards) expect(Math.round(c.width)).toBe(Math.round(list?.width ?? 0))
    for (let i = 1; i < cards.length; i++) expect(cards[i]?.top ?? 0).toBeGreaterThanOrEqual(cards[i - 1]?.bottom ?? 0)
  })

  it('stay four to a row on the desktop (D14)', async () => {
    const { cards } = await renderSteps(1512, 982)
    const top = Math.round(cards[0]?.top ?? -1)
    expect(cards.filter((c) => Math.round(c.top) === top)).toHaveLength(4)
  })
})

// T10: on a tablet the tab has no box, header, legend or source line; when the item loads spans the item, and a step's
// uses sit side by side, beside the step's number.
describe('the How it works tab on a tablet (T10)', () => {
  it('draws the trigger across the item, then the steps as rows, with no header', async () => {
    await page.viewport(756, 1129)
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/toolkit?state=skillHowItWorksTablet'] }),
    })
    ;({ unmount } = await testRender(<RouterProvider router={router} />))
    await expect.poll(() => document.querySelectorAll('[data-figma^="step "]').length).toBe(8)
    const list = document.querySelector('[data-figma="steps"]')?.getBoundingClientRect()
    const trigger = document.querySelector('[data-figma="trigger"]')?.getBoundingClientRect()
    expect(Math.round(trigger?.width ?? 0)).toBe(Math.round(list?.width ?? -1))
    expect(document.querySelector('[aria-label="Legend"]')).toBeNull()
    expect(document.querySelector('[data-figma="how it works"]')).toBeNull()
    const file = document.querySelector('[data-figma="uses · references/<form>.md"]')?.getBoundingClientRect()
    const rule = document.querySelector('[data-figma="uses · ste100"]')?.getBoundingClientRect()
    expect(Math.round(rule?.top ?? -1)).toBe(Math.round(file?.top ?? 0))
    expect(rule?.left ?? 0).toBeGreaterThan(file?.right ?? 0)
  })
})

// M12: on the phone the tab is T10's column; the back row names the item, and the title is the smaller title style
// with the rows under it 10 apart.
describe('the How it works tab on the phone (M12)', () => {
  it('draws the column under a smaller title, with the rows 10 apart', async () => {
    await page.viewport(390, 806)
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/toolkit?state=skillHowItWorksPhone'] }),
    })
    ;({ unmount } = await testRender(<RouterProvider router={router} />))
    await expect.poll(() => document.querySelectorAll('[data-figma^="step "]').length).toBe(8)
    expect(document.querySelector('[aria-label="Legend"]')).toBeNull()
    expect(document.querySelector('nav[aria-label="Breadcrumb"]')?.textContent).toContain('writer')
    const title = document.querySelector('[data-figma="461:560"]')?.getBoundingClientRect()
    expect(Math.round(title?.height ?? 0)).toBe(28)
    const list = document.querySelector('[data-figma="steps"]')?.getBoundingClientRect()
    const trigger = document.querySelector('[data-figma="trigger"]')?.getBoundingClientRect()
    expect(Math.round(trigger?.width ?? 0)).toBe(Math.round(list?.width ?? -1))
    const tabs = document.querySelector('[role="tablist"]')?.getBoundingClientRect()
    expect(Math.round((tabs?.top ?? 0) - (title?.bottom ?? -1))).toBe(10)
  })
})

// T36: a rule's How it works on a tablet keeps the item's header, as on its Overview (T17): the back row to Toolkit
// with no breadcrumb, the kind badge and the path row; then T10's column, with nothing under the steps.
describe('the How it works tab of a rule on a tablet (T36)', () => {
  it('keeps the kind badge and path row over the column, with no breadcrumb', async () => {
    await page.viewport(756, 1129)
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/toolkit?state=ruleHowItWorksTablet'] }),
    })
    ;({ unmount } = await testRender(<RouterProvider router={router} />))
    await expect.poll(() => document.querySelectorAll('[data-figma^="step "]').length).toBe(4)
    expect(document.querySelector('nav[aria-label="Breadcrumb"]')).toBeNull()
    expect(document.querySelector('[data-figma="kind badge"]')).not.toBeNull()
    expect(document.querySelector('[data-figma="path row"]')).not.toBeNull()
    expect(document.querySelector('[data-figma="chat path"]')).toBeNull()
    const list = document.querySelector('[data-figma="steps"]')?.getBoundingClientRect()
    const trigger = document.querySelector('[data-figma="trigger"]')?.getBoundingClientRect()
    expect(Math.round(trigger?.width ?? 0)).toBe(Math.round(list?.width ?? -1))
    // Figma's trigger starts 14 under the tabs (495:1923 ends at 253, 495:1936 starts at 267); `ItemTabs` pads its
    // list 2 below the tabs (LIBRARY_GAPS.md, Item tab spacing), so the trigger is 12 under the tab list.
    const tabs = document.querySelector('[role="tablist"]')?.getBoundingClientRect()
    expect(Math.round((trigger?.top ?? 0) - (tabs?.bottom ?? -1))).toBe(12)
  })
})
