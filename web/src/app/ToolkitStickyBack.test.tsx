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

  it('opens the hook commit-msg under Back, its four cards in one row and its files above the tab bar (T19)', async () => {
    await page.viewport(756, 1158)
    const view = await renderToolkit('hookOpenTablet')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="facts"]')).not.toBeNull()
    const backRow = root.querySelector('[data-figma="back row"]')
    const item = root.querySelector('article[aria-label="commit-msg"]')
    const cards = [...root.querySelectorAll('[data-figma^="fact · "]')]
    const lastFile = root.querySelector('[data-figma="file · test-commit-msg"]')
    const tabBar = root.querySelector('[data-figma="tab bar"]')
    if (backRow === null || item === null || lastFile === null || tabBar === null) {
      throw new Error('no back row, item, file or tab bar')
    }
    expect(box(backRow).bottom).toBeLessThanOrEqual(box(item).top)
    // The four When it runs cards share one row and one height, as T19's 170 × 109 cards (487:1130 to 487:1156), and
    // none is taller than Figma's by a line: each value and caption keeps Figma's lines.
    expect(cards).toHaveLength(4)
    const [first] = cards
    if (first === undefined) throw new Error('no card')
    for (const card of cards) {
      expect(box(card).top).toBe(box(first).top)
      expect(box(card).height).toBe(box(first).height)
    }
    expect(box(first).height).toBeLessThan(109 + 4)
    // The hook's last file line ends above the tab bar, so the item needs no scroll to show it (487:1214).
    expect(box(lastFile).bottom).toBeLessThanOrEqual(box(tabBar).top)
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

  it('opens the rule skills under Back, its load box across the item and its file above the tab bar (M19)', async () => {
    await page.viewport(390, 806)
    const view = await renderToolkit('ruleOpenPhone')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="when it loads"]')).not.toBeNull()
    const backRow = root.querySelector('[data-figma="back row"]') ?? document.body
    const discuss = root.querySelector('button[aria-label="Discuss"]')
    const map = root.querySelector('button[aria-label="Show on map"]')
    const item = root.querySelector('article[aria-label="skills"]')
    const loads = root.querySelector('[data-figma="when it loads"]')
    const last = [...root.querySelectorAll('[data-figma="rendered markdown"] p')].at(-1)
    const tabBar = root.querySelector('[data-figma="tab bar"]')
    if (discuss === null || map === null || item === null || loads === null || last === undefined || tabBar === null) {
      throw new Error('no actions, item, load box, file or tab bar')
    }
    // The actions are icon buttons in the back row, and the item is under it (M19 496:5, 487:1252).
    expect(backRow.contains(discuss)).toBe(true)
    expect(backRow.contains(map)).toBe(true)
    expect(discuss.textContent).toBe('')
    expect(box(backRow).bottom).toBeLessThanOrEqual(box(item).top)
    // The load box spans the item (487:1404, 366 wide), and its condition wraps beside the label in the box.
    expect(box(loads).width).toBe(box(item).width)
    expect(box(loads).height).toBeLessThan(80)
    // The file's last line ends above the tab bar, as Figma's (487:1427) does.
    expect(box(last).bottom).toBeLessThanOrEqual(box(tabBar).top)
    await view.unmount()
  })

  it('keeps Back in view while the agent scrolls, its facts in two columns: writing-reviewer (M20)', async () => {
    await page.viewport(390, 844)
    const view = await renderToolkit('agentOpenPhone')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="back row"]')).not.toBeNull()
    const backRow = root.querySelector('[data-figma="back row"]') ?? document.body
    const back = root.querySelector('button[aria-label="Back to Toolkit"]')
    const map = root.querySelector('button[aria-label="Show on map"]')
    const item = root.querySelector('article[aria-label="writing-reviewer"]')
    if (back === null || map === null || item === null) throw new Error('no Back, Show on map or item')
    expect(backRow.contains(map)).toBe(true)
    // M20 487:1616: the four How it runs cards sit two across, in two rows of the same width.
    const fact = (label: string) => item.querySelector(`[data-figma="fact · ${label}"]`) ?? document.body
    const [claude, codex, tools, context] = ['Claude', 'Codex', 'Tools', 'Context'].map((l) => box(fact(l)))
    if (claude === undefined || codex === undefined || tools === undefined || context === undefined) {
      throw new Error('no fact cards')
    }
    expect(codex.top).toBe(claude.top)
    expect(codex.left).toBeGreaterThan(claude.right)
    expect(tools.left).toBe(claude.left)
    expect(tools.top).toBeGreaterThan(claude.bottom)
    expect(context.left).toBe(codex.left)
    expect(codex.width).toBe(claude.width)
    expect(codex.right).toBeLessThanOrEqual(box(item).right)
    // The prompt and the files run under the tab bar, so the item scrolls under Back.
    const bodies = [...root.querySelectorAll<HTMLElement>('.scroll-frame__body')].filter((b) => b.contains(item))
    expect(bodies).toHaveLength(1)
    const body = bodies[0] ?? document.body
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
    const before = { back: box(back).top, row: box(backRow).top, item: box(item).top }
    body.scrollTop = body.scrollHeight
    await expect.poll(() => body.scrollTop).toBeGreaterThan(0)
    expect(root.querySelector('.app-shell__detail')?.scrollTop ?? 0).toBe(0)
    expect(document.scrollingElement?.scrollTop ?? 0).toBe(0)
    expect(box(item).top).toBeLessThan(before.item)
    expect(box(back).top).toBe(before.back)
    expect(box(backRow).top).toBe(before.row)
    expect(box(backRow).bottom).toBeLessThanOrEqual(box(body).top)
    // The agent's one file, the last part of the item, scrolls into view above the tab bar.
    const file = root.querySelector('[data-figma="file · writing-reviewer.md"]')
    const tabBar = root.querySelector('[data-figma="tab bar"]')
    if (file === null || tabBar === null) throw new Error('no file line or tab bar')
    expect(box(file).bottom).toBeLessThanOrEqual(box(tabBar).top)
    await view.unmount()
  })

  it('opens the hook commit-msg under Back, its cards two by two, and scrolls its script under Back (M22)', async () => {
    await page.viewport(390, 806)
    const view = await renderToolkit('hookOpenPhone')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="facts"]')).not.toBeNull()
    const backRow = root.querySelector('[data-figma="back row"]') ?? document.body
    const back = root.querySelector('button[aria-label="Back to Toolkit"]')
    const discuss = root.querySelector('button[aria-label="Discuss"]')
    const item = root.querySelector('article[aria-label="commit-msg"]')
    const cards = [...root.querySelectorAll('[data-figma^="fact · "]')]
    const lastFile = root.querySelector('[data-figma="file · test-commit-msg"]')
    const tabBar = root.querySelector('[data-figma="tab bar"]')
    if (back === null || discuss === null || item === null || lastFile === null || tabBar === null) {
      throw new Error('no Back, actions, item, file or tab bar')
    }
    // The actions are icon buttons in the back row, and the item is under it (M22 496:14, 487:2024).
    expect(backRow.contains(discuss)).toBe(true)
    expect(discuss.textContent).toBe('')
    expect(box(backRow).bottom).toBeLessThanOrEqual(box(item).top)
    // The four When it runs cards sit two by two, each half the item less the 10 between (487:2186 to 487:2212,
    // 178 wide), and the second row starts under the first.
    expect(cards).toHaveLength(4)
    const [event, state, enforces, test] = cards
    if (event === undefined || state === undefined || enforces === undefined || test === undefined) {
      throw new Error('no card')
    }
    expect(box(state).top).toBe(box(event).top)
    expect(box(test).top).toBe(box(enforces).top)
    expect(box(enforces).top).toBeGreaterThan(box(event).bottom)
    expect(box(event).width).toBe((box(item).width - 10) / 2)
    // The script runs under the tab bar, as Figma's does: the item scrolls its files into view, under Back.
    const bodies = [...root.querySelectorAll<HTMLElement>('.scroll-frame__body')].filter((b) => b.contains(item))
    expect(bodies).toHaveLength(1)
    const body = bodies[0] ?? document.body
    expect(box(lastFile).top).toBeGreaterThan(box(tabBar).top)
    const before = { back: box(back).top, row: box(backRow).top }
    body.scrollTop = body.scrollHeight
    await expect.poll(() => body.scrollTop).toBeGreaterThan(0)
    expect(document.scrollingElement?.scrollTop ?? 0).toBe(0)
    expect(box(back).top).toBe(before.back)
    expect(box(backRow).top).toBe(before.row)
    expect(box(lastFile).bottom).toBeLessThanOrEqual(box(tabBar).top)
    await view.unmount()
  })

  it('cuts the workflow’s one-line rows at the item’s edge, with no flow: skill-eval-round (M21)', async () => {
    await page.viewport(390, 844)
    const view = await renderToolkit('workflowOpenPhone')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="back row"]')).not.toBeNull()
    const backRow = root.querySelector('[data-figma="back row"]') ?? document.body
    const map = root.querySelector('button[aria-label="Show on map"]')
    const item = root.querySelector('article[aria-label="skill-eval-round"]')
    if (map === null || item === null) throw new Error('no Show on map or item')
    expect(backRow.contains(map)).toBe(true)
    // M21 487:1863: the phone draws no steps by phase; the line under the agents says where they are.
    expect(item.querySelector('[data-figma="flow · by phase"]')).toBeNull()
    expect(item.textContent).toContain('The steps, gates and loop are on How it works.')
    // The header and the agents' row are one line each, longer than the item: each scrolls sideways inside the item's
    // width, so the item itself never scrolls sideways.
    const bodies = [...root.querySelectorAll<HTMLElement>('.scroll-frame__body')].filter((b) => b.contains(item))
    expect(bodies).toHaveLength(1)
    const body = bodies[0] ?? document.body
    for (const key of ['steps header', 'runs']) {
      const row = item.querySelector<HTMLElement>(`[data-figma="${key}"]`)
      if (row === null) throw new Error(`no ${key}`)
      expect(row.scrollWidth).toBeGreaterThan(row.clientWidth)
      expect(box(row).right).toBeLessThanOrEqual(box(item).right)
      expect(box(row).height).toBeLessThan(40)
    }
    expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth)
    // The workflow's one file, the last part of the item, is above the tab bar.
    const file = root.querySelector('[data-figma="file · skill-eval-round.md"]')
    const tabBar = root.querySelector('[data-figma="tab bar"]')
    if (file === null || tabBar === null) throw new Error('no file line or tab bar')
    expect(box(file).bottom).toBeLessThanOrEqual(box(tabBar).top)
    await view.unmount()
  })
})
