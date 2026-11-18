import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

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
  await page.viewport(1512, 982)
})

async function renderPage(width: number, height: number) {
  await page.viewport(width, height)
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
