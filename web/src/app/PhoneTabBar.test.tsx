import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The phone's tab bar lies over the page (AppShell `tabBarOverlay`), as Figma draws the phone pages running under it
// (Toolkit M02, M20, M22). Through the real route: the page reaches under the bar, and at the end of its scroll its
// last item and a pinned Start stay above the bar. The app's styles and fonts load as in main.ts, and the root has the
// theme and mode of index.html, so the tests measure the real layout.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  return testRender(<RouterProvider router={router} />)
}

afterEach(async () => {
  resetAllStores()
  await page.viewport(1512, 982)
})

/** The box of an element. */
const box = (el: Element) => el.getBoundingClientRect()

/** The rendered app's root, made as tall as the window. */
async function appRoot() {
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  root.style.height = '100%'
  return root
}

describe('the tab bar over the phone page', () => {
  it('runs the Toolkit list under the bar and scrolls its last item above it (M1)', async () => {
    await page.viewport(390, 844)
    const view = await renderAt('/toolkit?state=toolkitListTablet')
    onTestFinished(view.unmount)
    const root = await appRoot()
    await expect.poll(() => root.querySelector('section[aria-label="Toolkit"]')).not.toBeNull()
    const list = root.querySelector('section[aria-label="Toolkit"]')
    const detail = root.querySelector<HTMLElement>('.app-shell__detail')
    const tabBar = root.querySelector('[data-figma="tab bar"]')
    if (list === null || detail === null || tabBar === null) throw new Error('no list, detail or tab bar')
    // A tall block at the list's start, as a longer toolkit would have, so the last group stays last.
    const long = document.createElement('div')
    long.style.height = '2000px'
    long.style.flexShrink = '0'
    list.prepend(long)
    const last = list.lastElementChild
    if (last === null) throw new Error('no last group')
    // The page reaches the bottom of the screen, under the bar.
    expect(box(detail).bottom).toBeGreaterThan(box(tabBar).top)
    expect(box(detail).bottom).toBe(box(tabBar).bottom)
    expect(box(last).top).toBeGreaterThan(box(tabBar).top)
    detail.scrollTop = detail.scrollHeight
    await expect.poll(() => detail.scrollTop).toBeGreaterThan(0)
    // At the end of the scroll the last item sits above the bar.
    expect(box(last).bottom).toBeLessThanOrEqual(box(tabBar).top)
    await view.unmount()
  })

  it('keeps Start above the bar and the last line of the task above Start (M2)', async () => {
    await page.viewport(390, 844)
    const view = await renderAt('/inbox?state=taskPage')
    onTestFinished(view.unmount)
    const root = await appRoot()
    await expect.poll(() => root.querySelector('[data-figma="sticky action"]')).not.toBeNull()
    const start = root.querySelector('[data-figma="sticky action"]')
    const tabBar = root.querySelector('[data-figma="tab bar"]')
    const bodies = [...root.querySelectorAll<HTMLElement>('.scroll-frame__body')]
    expect(bodies).toHaveLength(1)
    const [body] = bodies
    if (start === null || tabBar === null || body === undefined) throw new Error('no Start, tab bar or task')
    // The task: the Container that holds it, whose last child is its last section (Sources).
    const task = body.firstElementChild
    const content = task?.firstElementChild
    if (task === null || content === null || content === undefined) throw new Error('no task content')
    const long = document.createElement('div')
    long.style.height = '2000px'
    long.style.flexShrink = '0'
    content.prepend(long)
    const lastLine = content.lastElementChild
    if (lastLine === null) throw new Error('no last section')
    // The task's frame reaches the bottom of the screen, under the bar, and Start sits above the bar.
    expect(box(body).bottom).toBeGreaterThan(box(tabBar).top)
    expect(box(start).bottom).toBeLessThanOrEqual(box(tabBar).top)
    expect(box(lastLine).bottom).toBeGreaterThan(box(start).top)
    body.scrollTop = body.scrollHeight
    await expect.poll(() => body.scrollTop).toBeGreaterThan(0)
    // At the end of the scroll Start is still above the bar, and the last line above Start.
    expect(box(start).bottom).toBeLessThanOrEqual(box(tabBar).top)
    expect(box(lastLine).bottom).toBeLessThanOrEqual(box(start).top)
    await view.unmount()
  })
})
