import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// An open toolkit item on a tablet through the real route (d-107), as InboxStickyBars.test.tsx tests the Inbox: the
// item sits in the shared DetailFrame, so its back row (Back to Toolkit, Discuss and Show on map) stays at the top
// while only the item under it scrolls. The app's styles and fonts load as in main.ts, and the root has the theme and
// mode of index.html, so the test measures the real layout.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderToolkit(state: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/toolkit?state=${state}`] }),
  })
  return testRender(<RouterProvider router={router} />)
}

afterEach(async () => {
  resetAllStores()
  await page.viewport(1512, 982)
})

/** The box of an element. */
const box = (el: Element) => el.getBoundingClientRect()

describe('the open item on a tablet (d-107)', () => {
  it('keeps Back in view while the item scrolls: the skill writer (T3)', async () => {
    await page.viewport(756, 1158)
    const view = await renderToolkit('skillOpenTablet')
    onTestFinished(view.unmount)
    // The app's root fills the window, as `#root` does in index.css. Earlier tests leave their renders in the page, so
    // each query looks only in this one.
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="back row"]')).not.toBeNull()
    const backRow = root.querySelector('[data-figma="back row"]') ?? document.body
    const back = root.querySelector('button[aria-label="Back to Toolkit"]')
    const item = root.querySelector('[data-figma="toolkit item"]')
    if (back === null || item === null) throw new Error('no Back or no item')
    // The item that scrolls: the ScrollFrame body, made to overflow, as a long SKILL.md would.
    const bodies = [...root.querySelectorAll<HTMLElement>('.scroll-frame__body')].filter((b) => b.contains(item))
    expect(bodies).toHaveLength(1)
    const body = bodies[0] ?? document.body
    const long = document.createElement('div')
    long.style.height = '3000px'
    long.style.flexShrink = '0'
    item.append(long)
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
    const before = { back: box(back).top, row: box(backRow).top, item: box(item).top }
    body.scrollTop = body.scrollHeight
    await expect.poll(() => body.scrollTop).toBeGreaterThan(0)
    // The page and the AppShell detail do not scroll; only the item, which moves up under Back.
    expect(root.querySelector('.app-shell__detail')?.scrollTop ?? 0).toBe(0)
    expect(document.scrollingElement?.scrollTop ?? 0).toBe(0)
    expect(box(item).top).toBeLessThan(before.item)
    // Back and its row stay where they were, inside the window and above the item's visible part.
    expect(box(back).top).toBe(before.back)
    expect(box(backRow).top).toBe(before.row)
    expect(box(back).top).toBeGreaterThanOrEqual(0)
    expect(box(backRow).bottom).toBeLessThanOrEqual(box(body).top)
    await view.unmount()
  })

  it('opens the rule skills under Back, its load box across the item (T17)', async () => {
    await page.viewport(756, 1158)
    const view = await renderToolkit('ruleOpenTablet')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="when it loads"]')).not.toBeNull()
    const backRow = root.querySelector('[data-figma="back row"]')
    const item = root.querySelector('[data-figma="toolkit item"]')
    const loads = root.querySelector('[data-figma="when it loads"]')
    if (backRow === null || item === null || loads === null) throw new Error('no back row, item or load box')
    // The item is under Back, and on a tablet the load box spans the item, as T17's 712 px box (487:502).
    expect(box(backRow).bottom).toBeLessThanOrEqual(box(item).top)
    expect(box(loads).width).toBe(box(item).width)
    await view.unmount()
  })
})

describe('the open item on the phone (d-107)', () => {
  it('keeps Back and its icon buttons in view while the item scrolls: the skill writer (M2)', async () => {
    await page.viewport(390, 844)
    const view = await renderToolkit('skillOpenPhone')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="back row"]')).not.toBeNull()
    const backRow = root.querySelector('[data-figma="back row"]') ?? document.body
    const back = root.querySelector('button[aria-label="Back to Toolkit"]')
    const discuss = root.querySelector('button[aria-label="Discuss"]')
    const map = root.querySelector('button[aria-label="Show on map"]')
    // On the phone the item's frame is Figma's `toolkit` (M2 429:284).
    const item = root.querySelector('article[aria-label="writer"]')
    if (back === null || discuss === null || map === null || item === null) throw new Error('no Back, actions or item')
    // The actions sit in the back row, as icon buttons with their names (M2 496:2, 429:291).
    expect(backRow.contains(discuss)).toBe(true)
    expect(backRow.contains(map)).toBe(true)
    expect(discuss.textContent).toBe('')
    // On the phone the item is longer than the screen without help: its files and evals run under the tab bar.
    const bodies = [...root.querySelectorAll<HTMLElement>('.scroll-frame__body')].filter((b) => b.contains(item))
    expect(bodies).toHaveLength(1)
    const body = bodies[0] ?? document.body
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
    const before = { back: box(back).top, map: box(map).top, row: box(backRow).top, item: box(item).top }
    body.scrollTop = body.scrollHeight
    await expect.poll(() => body.scrollTop).toBeGreaterThan(0)
    expect(root.querySelector('.app-shell__detail')?.scrollTop ?? 0).toBe(0)
    expect(document.scrollingElement?.scrollTop ?? 0).toBe(0)
    expect(box(item).top).toBeLessThan(before.item)
    // Back, Show on map and their row stay where they were, above the item's visible part.
    expect(box(back).top).toBe(before.back)
    expect(box(map).top).toBe(before.map)
    expect(box(backRow).top).toBe(before.row)
    expect(box(back).top).toBeGreaterThanOrEqual(0)
    expect(box(backRow).bottom).toBeLessThanOrEqual(box(body).top)
    // The evals link, the last part of the item, scrolls into view above the tab bar.
    const evals = root.querySelector('[data-figma="evals link"]')
    const tabBar = root.querySelector('[data-figma="tab bar"]')
    if (evals === null || tabBar === null) throw new Error('no evals link or tab bar')
    expect(box(evals).bottom).toBeLessThanOrEqual(box(tabBar).top)
    await view.unmount()
  })
})
