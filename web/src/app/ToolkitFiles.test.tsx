import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The Files tab of an open item through the real route (D6, `file browser` 432:2141), as ToolkitCodeWrap.test.tsx
// tests the phone's code: on the desktop the tree and the viewer sit side by side, the browser runs to the item
// pane's foot with no space under it, the pane does not scroll, and a click on a file in the tree opens it in the
// viewer. The app's styles and fonts load as in main.ts, so the test measures the real layout.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderToolkit(state: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/toolkit?state=${state}`] }),
  })
  return testRender(<RouterProvider router={router} />)
}

afterEach(() => {
  resetAllStores()
})

describe('the Files tab of an open item (D6)', () => {
  it('lays the tree and the viewer side by side, down to the pane’s foot, and opens the file clicked', async () => {
    await page.viewport(1512, 982)
    const view = await renderToolkit('skillFiles')
    onTestFinished(view.unmount)
    // Earlier tests leave their renders in the page, so each query looks only in this one.
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="file browser"]')).not.toBeNull()
    await document.fonts.ready
    const box = (selector: string) => {
      const el = root.querySelector(selector)
      if (el === null) throw new Error(`no ${selector}`)
      return el.getBoundingClientRect()
    }
    const browser = box('[data-figma="file browser"]')
    const tree = box('[data-figma="tree"]')
    const viewer = box('[data-figma="viewer"]')
    const item = box('[data-figma="toolkit item"]')
    // Side by side: the viewer starts where the tree ends, both as high as the browser.
    expect(viewer.left).toBeCloseTo(tree.right, 0)
    expect(tree.top).toBeCloseTo(viewer.top, 0)
    expect(tree.height).toBeCloseTo(viewer.height, 0)
    // The browser ends at the item pane's foot, and the pane does not scroll.
    expect(browser.bottom).toBeCloseTo(item.bottom, 0)
    const detail = root.querySelector('main.app-shell__detail')
    if (detail === null) throw new Error('no detail')
    expect(detail.scrollHeight).toBeLessThanOrEqual(detail.clientHeight)
    // The script check is selected at first; a click on another file opens it in the viewer, with its bar only.
    expect(root.querySelector('[aria-label="scripts/check"]')).not.toBeNull()
    const doc = [...root.querySelectorAll('[role="treeitem"]')].find((el) => el.textContent.startsWith('doc.md'))
    if (doc === undefined) throw new Error('no doc.md row')
    await userEvent.click(doc)
    await expect.poll(() => root.querySelector('[aria-label="references/doc.md"]')).not.toBeNull()
    expect(root.querySelector('[aria-label="scripts/check"]')).toBeNull()
    await view.unmount()
  })
})
