import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The Links tab of an open item through the real route (D19, `links` 482:539): the graph and the two panels side by
// side, a tap on an item opening it from writer, a tap on a link's file and line opening the Files tab, and Show on
// map opening the map with writer selected. The app's styles and fonts load as in main.ts, so the test measures the
// real layout.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

async function renderToolkit(state: string) {
  await page.viewport(1512, 982)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/toolkit?state=${state}`] }),
  })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  // Earlier tests leave their renders in the page, so each query looks only in this one.
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  root.style.height = '100%'
  await expect.poll(() => root.querySelector('[data-figma="links"]')).not.toBeNull()
  await document.fonts.ready
  return { root, router }
}

function box(root: HTMLElement, selector: string) {
  const el = root.querySelector(selector)
  if (el === null) throw new Error(`no ${selector}`)
  return el.getBoundingClientRect()
}

function button(root: HTMLElement, name: string, within = '[data-figma="links"]') {
  const found = [...root.querySelectorAll(`${within} button`)].find((b) => b.textContent.trim() === name)
  if (!(found instanceof HTMLElement)) throw new Error(`no button ${name}`)
  return found
}

afterEach(() => {
  resetAllStores()
})

describe('the Links tab of an open item (D19)', () => {
  it('draws the graph over the two panels, which sit side by side', async () => {
    const { root } = await renderToolkit('skillLinks')
    const graph = box(root, '[data-figma="links graph"]')
    const from = box(root, '[data-figma="panel · linked from"]')
    const to = box(root, '[data-figma="panel · links to"]')
    expect(from.top).toBeGreaterThan(graph.bottom)
    expect(to.top).toBeCloseTo(from.top, 0)
    expect(to.left).toBeGreaterThan(from.right)
    expect(from.width).toBeCloseTo(to.width, 0)
    // The graph's nodes: four on the left, seven on the right and writer in the middle, selected.
    const nodes = root.querySelectorAll('[data-figma="links graph"] button')
    expect(nodes).toHaveLength(12)
    const pressed = [...nodes].filter((n) => n.getAttribute('aria-pressed') === 'true')
    expect(pressed.map((n) => n.textContent)).toEqual(['writer'])
    // Each link of the panels has its own row, its file and line at the end.
    expect(root.querySelectorAll('[data-figma^="link · "]')).toHaveLength(11)
  })

  it('opens an item tapped in the graph, from writer', async () => {
    const { root, router } = await renderToolkit('skillLinks')
    await userEvent.click(button(root, 'audit-slop', '[data-figma="links graph"]'))
    await expect.poll(() => root.querySelector('article[aria-label="audit-slop"]')).not.toBeNull()
    expect(router.state.location.search).toMatchObject({ state: 'skillLinks' })
  })

  it('opens the file of a link’s line: writer’s own on its Files tab, another item’s in that item', async () => {
    const { root } = await renderToolkit('skillLinks')
    // A link out is written in writer's SKILL.md: writer stays open, on Files.
    await userEvent.click(button(root, 'SKILL.md:8'))
    const tab = () => root.querySelector('article[aria-label="writer"] [role="tab"][aria-selected="true"]')
    await expect.poll(() => tab()?.textContent).toBe('Files')
    await userEvent.click(button(root, 'Links', 'article'))
    await expect.poll(() => root.querySelector('[data-figma="links"]')).not.toBeNull()
    // A link in is written in the other item's file: the agent writer opens, its path badge naming its file.
    await userEvent.click(button(root, 'agents/writer.md:11'))
    await expect.poll(() => root.querySelector('[data-figma="links"]')).toBeNull()
    expect(root.querySelector('article[aria-label="writer"]')?.textContent).toContain('toolkit/agents/writer.md')
  })

  it('shows writer selected on the map from Show on map', async () => {
    const { root } = await renderToolkit('skillLinks')
    await userEvent.click(button(root, 'Show on map', 'article'))
    await expect.poll(() => root.querySelector('[role="group"][aria-label="Toolkit map"]')).not.toBeNull()
    const pressed = root.querySelector('[role="group"][aria-label="Toolkit map"] button[aria-pressed="true"]')
    expect(pressed?.textContent).toContain('writer')
  })
})

// The Links tab on a tablet (T15 and on): the item replaces the list in the DetailFrame, the graph is narrower and the
// two panels stand one under the other.
async function renderTablet(state: string, tab: string) {
  await page.viewport(756, 1158)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/toolkit?state=${state}`] }),
  })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  root.style.height = '100%'
  await expect.poll(() => root.querySelector(`[data-figma="${tab}"]`)).not.toBeNull()
  await document.fonts.ready
  return { root, router }
}

describe('the Links tab on a tablet', () => {
  afterEach(async () => {
    await page.viewport(1512, 982)
  })

  it('stands the panels under the graph, each as wide as the item, with no sideways scroll (T15)', async () => {
    const { root } = await renderTablet('skillLinksTablet', '482:908')
    const tab = box(root, '[data-figma="482:908"]')
    const graph = box(root, '[data-figma="links graph"]')
    const from = box(root, '[data-figma="panel · linked from"]')
    const to = box(root, '[data-figma="panel · links to"]')
    expect(from.top).toBeGreaterThan(graph.bottom)
    expect(to.top).toBeGreaterThan(from.bottom)
    for (const b of [graph, from, to]) {
      expect(b.left).toBeCloseTo(tab.left, 0)
      expect(b.width).toBeCloseTo(tab.width, 0)
    }
    const scroller = root.querySelector('[data-figma="links graph"] .map-graph__scroller')
    if (scroller === null) throw new Error('no graph scroller')
    expect(scroller.scrollWidth).toBeLessThanOrEqual(scroller.clientWidth)
    expect(root.querySelectorAll('[data-figma="links graph"] button')).toHaveLength(12)
    expect(root.querySelectorAll('[data-figma^="link · "]')).toHaveLength(11)
  })

  it('names writer in the back row, with no kind badge or path row (T15)', async () => {
    const { root } = await renderTablet('skillLinksTablet', '482:908')
    expect(root.querySelector('nav[aria-label="Breadcrumb"]')?.textContent).toContain('writer')
    expect(root.querySelector('article[aria-label="writer"] [data-figma="kind badge"]')).toBeNull()
    expect(root.querySelector('article[aria-label="writer"] [data-figma="path row"]')).toBeNull()
  })

  it('opens an item tapped in the graph on a tablet, from writer (T15)', async () => {
    const { root } = await renderTablet('skillLinksTablet', '482:908')
    await userEvent.click(button(root, 'audit-slop', '[data-figma="links graph"]'))
    await expect.poll(() => root.querySelector('article[aria-label="audit-slop"]')).not.toBeNull()
  })
})
