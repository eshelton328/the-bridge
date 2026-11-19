import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { userEvent } from 'vitest/browser'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The Toolkit map's tablet and phone parts through the real route (T2, M11): the library's compact nodes
// (MapGraph `nodeDensity="compact"`, a 12 px kind icon) with links that end at the node's edge (`edgeEnd="none"`),
// the phone's minimap (MapGraph `minimap`, M11 461:1255) and the phone's compact selection card (M11 461:1259): the
// counts as arrows at the title row's end, Show links and Open side by side, no close button, inside a 320 px phone.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

async function renderMap(width: number, height: number) {
  await setViewport(width, height)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/toolkit?state=toolkitMapTablet'] }),
  })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  // Earlier tests leave their renders in the page, so each query looks only in this one.
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  root.style.height = '100%'
  const find = () => root.querySelector('[role="group"][aria-label="Toolkit map"]')
  await expect.poll(find).not.toBeNull()
  await document.fonts.ready
  const map = find()
  if (!(map instanceof HTMLElement)) throw new Error('no map')
  return { root, map }
}

// The map's node buttons: each has `aria-pressed`; the card's buttons and the minimap's picture have none.
function nodes(map: HTMLElement) {
  return [...map.querySelectorAll('button[aria-pressed]')].filter((b) => b instanceof HTMLElement)
}

afterEach(async () => {
  resetAllStores()
  await setViewport(1512, 982)
})

describe('the Toolkit map’s compact nodes (T2, M11)', () => {
  it.each([
    ['tablet', 756, 1158],
    ['phone', 390, 844],
  ] as const)('draws each node of the %s with the 12 px kind icon and no dot at a link’s end', async (_, w, h) => {
    const { map } = await renderMap(w, h)
    const all = nodes(map)
    expect(all.length).toBeGreaterThan(0)
    for (const node of all) {
      const icon = node.querySelector('svg')
      expect(icon?.getBoundingClientRect().width).toBe(12)
    }
    expect(map.querySelectorAll('.map-graph__scroller circle')).toHaveLength(0)
  })

  it('shows pr-description whole in its 140 px node', async () => {
    const { map } = await renderMap(756, 1158)
    const node = nodes(map).find((b) => b.textContent.includes('pr-description') && b.textContent.length < 20)
    const label = [...(node?.querySelectorAll('*') ?? [])].find(
      (el) => el.children.length === 0 && el.textContent === 'pr-description',
    )
    if (!(label instanceof HTMLElement)) throw new Error('no pr-description label')
    expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth)
  })

  it('keeps the desktop’s default nodes, with a dot at each link’s end (D2)', async () => {
    await setViewport(1512, 982)
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/toolkit?state=toolkitMap'] }),
    })
    const view = await testRender(<RouterProvider router={router} />)
    onTestFinished(view.unmount)
    const root = () =>
      [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1) ?? null
    await expect.poll(() => root()?.querySelector('[role="group"][aria-label="Toolkit map"]')).toBeTruthy()
    const map = root()?.querySelector('[role="group"][aria-label="Toolkit map"]')
    if (!(map instanceof HTMLElement)) throw new Error('no map')
    expect(nodes(map)[0]?.querySelector('svg')?.getBoundingClientRect().width).toBe(16)
    expect(map.querySelectorAll('.map-graph__scroller circle').length).toBeGreaterThan(0)
  })
})

describe('the Toolkit map’s minimap (M11)', () => {
  it('shows the minimap in the phone’s window, hidden from assistive technology', async () => {
    const { map } = await renderMap(390, 844)
    const minimap = map.querySelector('[data-minimap]')
    if (!(minimap instanceof HTMLElement)) throw new Error('no minimap')
    expect(minimap.getAttribute('aria-hidden')).toBe('true')
    const box = minimap.getBoundingClientRect()
    expect(box.width).toBeGreaterThan(0)
    // It sits in the window's top right corner.
    const frame = map.querySelector('[data-allow-pinch]')?.getBoundingClientRect()
    if (frame === undefined) throw new Error('no window')
    expect(box.right).toBeLessThanOrEqual(frame.right)
    expect(box.top).toBeGreaterThanOrEqual(frame.top)
    expect(box.left).toBeGreaterThan(frame.left + frame.width / 2)
  })

  it('has no minimap on the tablet (T2)', async () => {
    const { map } = await renderMap(756, 1158)
    expect(map.querySelector('[data-minimap]')).toBeNull()
  })
})

describe('the Toolkit map’s phone card (M11)', () => {
  async function card(width: number) {
    const { root } = await renderMap(width, 844)
    const section = root.querySelector('[data-figma="selection · writer"] section')
    if (!(section instanceof HTMLElement)) throw new Error('no card')
    return { root, section }
  }

  it('is the compact card: arrows for the counts, Show links and Open writer, no close button', async () => {
    const { section } = await card(390)
    expect(section.textContent).toContain('→7  ←4')
    const buttons = [...section.querySelectorAll('button')]
    expect(buttons.map((b) => b.textContent.trim())).toEqual(['Show links', 'Open writer'])
    expect(section.querySelector('button[aria-label="Close writer"]')).toBeNull()
    // The two buttons share one row.
    const [links, open] = buttons.map((b) => b.getBoundingClientRect())
    expect(links?.top).toBe(open?.top)
  })

  it('keeps the tablet’s card with its close button and no Show links (T2)', async () => {
    const { root } = await renderMap(756, 1158)
    const section = root.querySelector('[data-figma="selection · writer"] section')
    if (!(section instanceof HTMLElement)) throw new Error('no card')
    expect(section.querySelector('button[aria-label="Close writer"]')).not.toBeNull()
    expect([...section.querySelectorAll('button')].some((b) => b.textContent.includes('Show links'))).toBe(false)
  })

  it('shows no Show links for an item with no Links tab (audit-slop), only Open', async () => {
    const { root } = await renderMap(390, 844)
    const map = root.querySelector('[role="group"][aria-label="Toolkit map"]')
    const node = [...(map?.querySelectorAll('button[aria-pressed]') ?? [])].find(
      (b) => b.textContent.trim() === 'audit-slop',
    )
    if (!(node instanceof HTMLElement)) throw new Error('no audit-slop node')
    await userEvent.click(node)
    const section = () => root.querySelector('[data-figma="selection · audit-slop"] section')
    await expect.poll(section).toBeTruthy()
    const buttons = [...(section()?.querySelectorAll('button') ?? [])].map((b) => b.textContent.trim())
    expect(buttons).toEqual(['Open audit-slop'])
  })

  it('opens the selected item on its Links tab from Show links', async () => {
    // The home (`/toolkit`) has every item's details, so writer has its Links tab there; the map state does not.
    await setViewport(390, 844)
    const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/toolkit'] }) })
    const view = await testRender(<RouterProvider router={router} />)
    onTestFinished(view.unmount)
    const root = () =>
      [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1) ?? null
    const mapButton = () =>
      root()?.querySelector('[data-figma="button · map"] button, button[data-figma="button · map"]')
    await expect.poll(mapButton).toBeTruthy()
    const button = mapButton()
    if (!(button instanceof HTMLElement)) throw new Error('no map button')
    await userEvent.click(button)
    const map = () => root()?.querySelector('[role="group"][aria-label="Toolkit map"]')
    await expect.poll(map).toBeTruthy()
    // The skill writer comes before the agent writer, in the Skills column.
    const writer = [...(map()?.querySelectorAll('button[aria-pressed]') ?? [])].find(
      (b) => b.textContent.trim() === 'writer',
    )
    if (!(writer instanceof HTMLElement)) throw new Error('no writer node')
    await userEvent.click(writer)
    const links = () =>
      [...(root()?.querySelectorAll('[data-figma="selection · writer"] button') ?? [])].find((b) =>
        b.textContent.includes('Show links'),
      )
    await expect.poll(links).toBeTruthy()
    const showLinks = links()
    if (!(showLinks instanceof HTMLElement)) throw new Error('no Show links')
    await userEvent.click(showLinks)
    await expect
      .poll(() => root()?.querySelector('[role="tab"][aria-selected="true"]')?.textContent.trim())
      .toBe('Links')
    expect(map()).toBeNull()
  })

  it('fits a 320 px phone, both buttons inside the card', async () => {
    const { section } = await card(320)
    const box = section.getBoundingClientRect()
    expect(box.left).toBeGreaterThanOrEqual(0)
    expect(box.right).toBeLessThanOrEqual(320)
    expect(section.scrollWidth).toBeLessThanOrEqual(section.clientWidth)
    for (const button of section.querySelectorAll('button')) {
      const b = button.getBoundingClientRect()
      expect(b.left).toBeGreaterThanOrEqual(box.left)
      expect(b.right).toBeLessThanOrEqual(box.right)
    }
  })
})
