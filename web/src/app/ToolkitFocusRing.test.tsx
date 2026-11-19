import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { setViewport } from '../lib/rendering.ts'

// The Toolkit's own blocks draw their focus ring under the library's
// `focusRing` condition (screen review R16), through the real route and the
// AppShell that starts the input tracker. A tap or a click marks the block
// `data-focus-quiet` and draws no ring; Tab to the same block draws it.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let unmount: (() => Promise<void>) | undefined
afterEach(async () => {
  await unmount?.()
  unmount = undefined
  resetAllStores()
  await setViewport(1512, 982)
})

const sizes = { desktop: [1512, 982], tablet: [756, 1158], phone: [390, 844] } as const

async function renderState(state: string, size: keyof typeof sizes) {
  const [width, height] = sizes[size]
  await setViewport(width, height)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/toolkit?state=${state}`] }),
  })
  ;({ unmount } = await testRender(<RouterProvider router={router} />))
}

async function find(selector: string) {
  await expect.poll(() => document.querySelector(selector)).not.toBeNull()
  const el = document.querySelector(selector)
  if (!(el instanceof HTMLElement)) throw new Error(`no element for ${selector}`)
  return el
}

// The ring is on the element, or on its `::after` for a card whose ring follows its rounded corners.
function ring(el: HTMLElement, after: boolean) {
  return getComputedStyle(el, after ? '::after' : null)
}

function shows(style: CSSStyleDeclaration) {
  return style.outlineStyle !== 'none' && style.outlineWidth !== '0px' && style.outlineColor !== 'rgba(0, 0, 0, 0)'
}

// A press focuses the element before its click, as a tap or a mouse press does; the tracker reads the press.
function press(el: HTMLElement, pointerType: 'mouse' | 'touch') {
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType }))
  el.focus()
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType }))
}

async function expectQuietThenRing(el: HTMLElement, pointerType: 'mouse' | 'touch', after = false) {
  // The keyboard holds the focus just before the press, so the browser still matches `:focus-visible` on the
  // pressed element, as Safari on iOS does after a tap: only the tracker's mark can hide the ring.
  el.focus()
  await userEvent.tab({ shift: true })
  await expect.poll(() => document.activeElement).not.toBe(el)
  press(el, pointerType)
  await expect.poll(() => document.activeElement).toBe(el)
  expect(el.matches(':focus-visible')).toBe(true)
  expect(el.hasAttribute('data-focus-quiet')).toBe(true)
  expect(shows(ring(el, after))).toBe(false)
  if (after) expect(shows(ring(el, false))).toBe(false)
  await userEvent.tab({ shift: true })
  await userEvent.tab()
  await expect.poll(() => document.activeElement).toBe(el)
  expect(el.hasAttribute('data-focus-quiet')).toBe(false)
  const shown = ring(el, after)
  expect(shown.outlineStyle).toBe('solid')
  expect(shown.outlineWidth).not.toBe('0px')
  expect(shown.outlineColor).not.toBe('rgba(0, 0, 0, 0)')
}

describe('a click on a Toolkit block on the desktop', () => {
  it('leaves no ring on the item’s back row crumb, and Tab shows it', async () => {
    await renderState('workflowFullPage', 'desktop')
    await expectQuietThenRing(await find('nav[aria-label="Breadcrumb"] > button'), 'mouse')
  })

  it('leaves no ring on a Links panel row’s file and line, and Tab shows it', async () => {
    await renderState('skillLinks', 'desktop')
    await expectQuietThenRing(await find('[data-figma^="link · "] > div > button'), 'mouse')
  })

  it('leaves no ring on an eval row, and Tab shows it', async () => {
    await renderState('toolkitActivityHeadless', 'desktop')
    await expectQuietThenRing(await find('button[aria-label^="Open the "][aria-label$=" evals"]'), 'mouse')
  })

  it('leaves no ring on a flow step after a real click, and Tab shows it', async () => {
    await renderState('workflowFullPage', 'desktop')
    const step = await find('[data-figma="step · Runs"] button')
    await page.elementLocator(step).click()
    await expect.poll(() => document.activeElement).toBe(step)
    expect(step.hasAttribute('data-focus-quiet')).toBe(true)
    expect(shows(ring(step, true))).toBe(false)
    await expectQuietThenRing(step, 'mouse', true)
  })

  it('leaves no ring on the file viewer’s copy button, and Tab shows it', async () => {
    await renderState('skillFiles', 'desktop')
    await expectQuietThenRing(await find('[data-figma="viewer bar"] button[aria-label^="Copy "]'), 'mouse')
  })
})

describe('a tap on a Toolkit block on a touch screen', () => {
  it('leaves no ring on the item’s back row crumb on a tablet, and Tab shows it', async () => {
    await renderState('agentOpenTablet', 'tablet')
    await expectQuietThenRing(await find('nav[aria-label="Breadcrumb"] > button'), 'touch')
  })

  it('leaves no ring on a Links panel row’s file and line on the phone, and Tab shows it', async () => {
    await renderState('skillLinksPhone', 'phone')
    await expectQuietThenRing(await find('[data-figma^="link · "] > div > button'), 'touch')
  })

  it('leaves no ring on an eval row on the phone, and Tab shows it', async () => {
    await renderState('toolkitActivityHeadlessPhone', 'phone')
    await expectQuietThenRing(await find('button[aria-label^="Open the "][aria-label$=" evals"]'), 'touch')
  })

  it('leaves no ring on a flow step on the phone, and Tab shows it', async () => {
    await renderState('workflowFullPagePhone', 'phone')
    await expectQuietThenRing(await find('[data-figma="step · Runs"] button'), 'touch', true)
  })
})
