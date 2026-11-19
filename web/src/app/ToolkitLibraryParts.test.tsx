import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The library parts of beta.76 and beta.77 on the Toolkit, through the real route: the item's buttons at Figma's
// sizes (D3 427:258, M2 496:2), the path badge's own copy icon (D3 457:50) and its 16 px icon on a file's page on the
// phone (M6 435:494), the bare copy icon in the Files viewer bar (D6 432:2297), the discussion's 16 px author mark
// (D5 438:29) and the flush Activity rows (D17 474:650). LIBRARY_GAPS.md names each row.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const sizes = { desktop: [1512, 982], tablet: [756, 1158], phone: [390, 844] } as const

async function renderToolkit(state: string, size: keyof typeof sizes, selector: string) {
  const [width, height] = sizes[size]
  await setViewport(width, height)
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
  await expect.poll(() => root.querySelector(selector)).not.toBeNull()
  const el = root.querySelector(selector)
  if (el === null) throw new Error(`no ${selector}`)
  return el
}

/** The width and height of an element's box, in px. */
function size(el: Element) {
  const r = el.getBoundingClientRect()
  return [r.width, r.height]
}

afterEach(async () => {
  resetAllStores()
  await setViewport(1512, 982)
})

describe('the item buttons', () => {
  it('draws Show on map 36 high in a 40 px meta row on the desktop', async () => {
    const map = await renderToolkit('skillOpen', 'desktop', '[data-figma="button · Show on map"]')
    expect(size(map)[1]).toBe(36)
    const row = map.closest('[data-figma="meta row"]')
    if (row === null) throw new Error('no meta row')
    expect(size(row)[1]).toBe(40)
  })
  it('draws the phone Discuss 36 × 28', async () => {
    const discuss = await renderToolkit('skillOpenPhone', 'phone', '[data-figma="button · Discuss"]')
    expect(size(discuss)).toEqual([36, 28])
  })
})

describe('the copy icons', () => {
  it('ends the path badge with its own 12 px copy icon', async () => {
    const copy = await renderToolkit('skillOpen', 'desktop', '[data-figma="path badge"] button.bare-icon-button')
    expect(copy.getAttribute('aria-label')).toBe('Copy toolkit/skills/writer/')
    const icon = copy.querySelector('svg')
    if (icon === null) throw new Error('no copy icon')
    expect(size(icon)).toEqual([12, 12])
  })
  it('puts a bare copy icon in the Files viewer bar', async () => {
    const copy = await renderToolkit('skillFiles', 'desktop', 'button.bare-icon-button[aria-label^="Copy "]')
    const icon = copy.querySelector('svg')
    if (icon === null) throw new Error('no copy icon')
    expect(size(icon)).toEqual([12, 12])
  })
})

describe('the sizes Figma draws', () => {
  it('draws the badge icon 16 px on a file page on the phone', async () => {
    const icon = await renderToolkit('scriptCodePhone', 'phone', '[data-figma="path badge"] .path-badge__icon svg')
    expect(size(icon)).toEqual([16, 16])
  })
  it('draws the discussion author mark 16 px', async () => {
    const mark = await renderToolkit('skillDiscuss', 'desktop', '[data-figma="message · Claude"] .message__author svg')
    expect(size(mark)).toEqual([16, 16])
  })
  it('draws the Activity rows flush, 52 high', async () => {
    const row = await renderToolkit('skillActivity', 'desktop', '[data-figma="panel · chats"] li .list-row__root')
    expect(size(row)[1]).toBe(52)
  })
})
