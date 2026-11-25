import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { afterRendering, setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { Route as toolkitRoute } from '../routes/toolkit.tsx'
import { routeTree } from './routeTree.gen.ts'

// R58 (the owner: "The skeletons on a page should match the structure of what will be loaded"): the Toolkit reads no
// server, so while its route loads it draws its real home. This renders the pending component, reads the box of every
// Figma layer it draws, then renders the loaded page from the real route tree with no URL parameters and reads them
// again: the same layers, each within 2 px in top, height, left and width, so nothing moves when the route loads.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

type Box = { top: number; height: number; left: number; width: number }

/** The box of each element with a Figma layer, by its layer name and place among those with that name. */
function layerBoxes(): Map<string, Box> {
  const boxes = new Map<string, Box>()
  for (const el of document.querySelectorAll('[data-figma]')) {
    const name = el.getAttribute('data-figma') ?? ''
    let key = name
    for (let n = 2; boxes.has(key); n++) key = `${name} #${String(n)}`
    const box = el.getBoundingClientRect()
    boxes.set(key, {
      top: Math.round(box.top),
      height: Math.round(box.height),
      left: Math.round(box.left),
      width: Math.round(box.width),
    })
  }
  return boxes
}

/** Each layer that one view has and the other lacks, or whose box differs by more than 2 px on a side. */
function moved(pending: Map<string, Box>, loaded: Map<string, Box>): string[] {
  const out: string[] = []
  for (const key of new Set([...pending.keys(), ...loaded.keys()])) {
    const was = pending.get(key)
    const now = loaded.get(key)
    if (was === undefined || now === undefined)
      out.push(`${key}: ${was === undefined ? 'only loaded' : 'only pending'}`)
    else if ((['top', 'height', 'left', 'width'] as const).some((side) => Math.abs(was[side] - now[side]) > 2))
      out.push(`${key}: ${JSON.stringify(was)} → ${JSON.stringify(now)}`)
  }
  return out
}

/** Renders the route's pending component alone, in a router of its own for its navigate. */
async function renderPending() {
  const pending = toolkitRoute.options.pendingComponent
  if (pending === undefined) throw new Error('the Toolkit route has no pending component')
  const pendingRouter = createRouter({
    routeTree: createRootRoute({ component: pending }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  const view = await testRender(<RouterProvider router={pendingRouter} />)
  await expect.element(page.getByRole('heading', { name: 'Toolkit', level: 1 })).toBeVisible()
  return view
}

/** Renders the loaded Toolkit home from the real route tree. */
async function renderLoaded() {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/toolkit'] }) })
  await testRender(<RouterProvider router={router} />)
  await expect.element(page.getByRole('heading', { name: 'Toolkit', level: 1 })).toBeVisible()
}

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  await setViewport(1512, 982)
})

const devices = [
  { name: 'the phone', size: [390, 844] },
  { name: 'the tablet', size: [744, 1133] },
  { name: 'the desktop', size: [1512, 982] },
] as const

describe('the Toolkit while its route loads (R58)', () => {
  for (const device of devices)
    it(`draws the loaded home, every layer within 2 px, on ${device.name}`, async () => {
      await setViewport(device.size[0], device.size[1])
      const pendingView = await renderPending()
      await afterRendering()
      const boxes = layerBoxes()
      expect(boxes.size).toBeGreaterThan(10)
      await pendingView.unmount()
      await renderLoaded()
      await afterRendering()
      expect(moved(boxes, layerBoxes())).toEqual([])
    })
})

// The Codex review of #515: what the owner does while the route loads is kept, and the pending view's copy works.
describe('the owner on the Toolkit while its route loads (R58)', () => {
  it('keeps the search typed while it loads on the loaded home, then starts empty next time', async () => {
    await setViewport(1512, 982)
    const pendingView = await renderPending()
    await userEvent.fill(page.getByRole('searchbox', { name: 'Search the toolkit' }).first(), 'writer')
    await pendingView.unmount()
    await renderLoaded()
    await expect.element(page.getByRole('searchbox', { name: 'Search the toolkit' }).first()).toHaveValue('writer')
    await unmountRendered()
    await renderLoaded()
    await expect.element(page.getByRole('searchbox', { name: 'Search the toolkit' }).first()).toHaveValue('')
  })

  it('copies the open item’s path from the pending view', async () => {
    const copied: string[] = []
    const { clipboard } = navigator
    const writeText = clipboard.writeText.bind(clipboard)
    clipboard.writeText = (text) => {
      copied.push(text)
      return Promise.resolve()
    }
    onTestFinished(() => {
      clipboard.writeText = writeText
    })
    await setViewport(1512, 982)
    await renderPending()
    await userEvent.click(page.getByRole('button', { name: /^agents-md/ }))
    await expect.poll(() => document.querySelector('[data-figma="path badge"]')).not.toBeNull()
    const copy = document.querySelector('[data-figma="path badge"] button')
    if (!(copy instanceof HTMLElement)) throw new Error('no copy button on the path badge')
    await userEvent.click(copy)
    await expect.poll(() => copied).toHaveLength(1)
    expect(copied[0]).toBe(document.querySelector('[data-figma="path badge"]')?.textContent)
  })
})
