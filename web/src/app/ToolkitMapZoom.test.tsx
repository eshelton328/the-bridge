import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { userEvent } from 'vitest/browser'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { setViewport } from '../lib/rendering.ts'

// The Toolkit map's pinch zoom through the real route (M11, `map viewport` 461:866): on the phone the map's window
// takes a pinch and a drag itself (MapGraph `zoom`), marked `data-allow-pinch` so the app's page zoom block
// (`pageZoom.ts`) lets the gesture through, and a tap on a node still selects it. The desktop and tablet maps (D2, T2)
// do not zoom.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

async function renderMap(state: string, width: number, height: number) {
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
  root.style.height = '100%'
  const map = () => root.querySelector('[role="group"][aria-label="Toolkit map"]')
  await expect.poll(map).not.toBeNull()
  await document.fonts.ready
  const group = map()
  const scroller = group?.querySelector('.map-graph__scroller')
  const svg = scroller?.querySelector('svg')
  if (!(scroller instanceof HTMLElement) || !(svg instanceof SVGSVGElement)) throw new Error('no map scroller')
  return { root, scroller, svg }
}

// One touch pointer's event at a point of the window, as a finger on the phone sends it.
function touch(target: EventTarget, type: string, pointerId: number, x: number, y: number) {
  target.dispatchEvent(
    new PointerEvent(type, {
      pointerId,
      pointerType: 'touch',
      isPrimary: pointerId === 1,
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
    }),
  )
}

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  await setViewport(1512, 982)
})

describe('the Toolkit map on the phone (M11)', () => {
  it('marks the map’s window as the one place a pinch goes through', async () => {
    const { scroller } = await renderMap('toolkitMapTablet', 390, 844)
    expect(scroller.hasAttribute('data-allow-pinch')).toBe(true)
    expect(getComputedStyle(scroller).touchAction).toBe('none')
  })

  it('scales the drawing up when two touch pointers move apart', async () => {
    const { scroller, svg } = await renderMap('toolkitMapTablet', 390, 844)
    const before = svg.getBoundingClientRect().width
    const w = scroller.getBoundingClientRect()
    const y = w.top + w.height / 2
    const mid = w.left + w.width / 2
    touch(scroller, 'pointerdown', 1, mid - 20, y)
    touch(scroller, 'pointerdown', 2, mid + 20, y)
    touch(scroller, 'pointermove', 1, mid - 60, y)
    touch(scroller, 'pointermove', 2, mid + 60, y)
    touch(scroller, 'pointerup', 1, mid - 60, y)
    touch(scroller, 'pointerup', 2, mid + 60, y)
    // The pointers end three times as far apart, so the drawing is three times its size, MapGraph's largest scale.
    await expect.poll(() => svg.getBoundingClientRect().width).toBeGreaterThan(before * 2.9)
  })

  it('selects a node tapped in the window, with its card under the map', async () => {
    const { root, scroller } = await renderMap('toolkitMapTablet', 390, 844)
    const node = [...scroller.querySelectorAll('button')].find((b) => b.textContent.includes('writing'))
    if (!(node instanceof HTMLElement)) throw new Error('no node writing')
    const b = node.getBoundingClientRect()
    touch(node, 'pointerdown', 1, b.left + 10, b.top + 10)
    touch(node, 'pointerup', 1, b.left + 10, b.top + 10)
    await userEvent.click(node)
    await expect.poll(() => node.getAttribute('aria-pressed')).toBe('true')
    expect(root.querySelector('[data-figma="selection · writing"]')).not.toBeNull()
  })
})

describe('the Toolkit map on the desktop and the tablet (D2, T2)', () => {
  it.each([
    ['desktop', 'toolkitMap', 1512, 982],
    ['tablet', 'toolkitMapTablet', 756, 1158],
  ] as const)('does not zoom on the %s', async (_, state, width, height) => {
    const { root, scroller } = await renderMap(state, width, height)
    expect(scroller.hasAttribute('data-allow-pinch')).toBe(false)
    expect(root.querySelector('[data-allow-pinch]')).toBeNull()
  })
})

describe('the Toolkit map on a 320 px phone', () => {
  it('fits the whole drawing in the narrower window when pinched in fully', async () => {
    const { scroller, svg } = await renderMap('toolkitMapTablet', 320, 844)
    const w = scroller.getBoundingClientRect()
    expect(w.width).toBeLessThan(366)
    const y = w.top + w.height / 2
    const mid = w.left + w.width / 2
    touch(scroller, 'pointerdown', 1, mid - 100, y)
    touch(scroller, 'pointerdown', 2, mid + 100, y)
    touch(scroller, 'pointermove', 1, mid - 1, y)
    touch(scroller, 'pointermove', 2, mid + 1, y)
    touch(scroller, 'pointerup', 1, mid - 1, y)
    touch(scroller, 'pointerup', 2, mid + 1, y)
    // The pointers end a hundredth as far apart, far past the smallest scale, so the drawing stops at the window's
    // inside width.
    await expect.poll(() => svg.getBoundingClientRect().width).toBeLessThanOrEqual(scroller.clientWidth + 0.5)
  })
})
