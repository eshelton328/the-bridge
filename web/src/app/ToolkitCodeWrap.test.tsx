import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The hook's script in the phone's file preview through the real route (M22, `code` 487:2231), as
// ToolkitStickyBack.test.tsx tests the open item: Figma wraps a line longer than the 390 px screen under itself, its
// number on the first line, so no line is cut and the code does not scroll sideways. The app's styles and fonts load
// as in main.ts, and the root has the theme and mode of index.html, so the test measures the real layout.
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

/** How many text lines high an element is, from its height and its line height. */
function textLines(el: Element) {
  const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight)
  return Math.round(el.getBoundingClientRect().height / lineHeight)
}

describe('the code in the phone’s file preview (M22)', () => {
  it('wraps the long lines of the hook commit-msg’s script, so no line is cut: lines 3, 4, 5 and 8 (M22)', async () => {
    await page.viewport(390, 844)
    const view = await renderToolkit('hookOpenPhone')
    onTestFinished(view.unmount)
    // Earlier tests leave their renders in the page, so each query looks only in this one.
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    await expect.poll(() => root.querySelector('[data-figma="code"] .code-lines__text')).not.toBeNull()
    await document.fonts.ready
    const code = root.querySelector<HTMLElement>('[data-figma="code"]')
    const box = code?.querySelector<HTMLElement>('.code-lines__root')
    if (code === null || box === null || box === undefined) throw new Error('no code box')
    const lines = [...box.querySelectorAll<HTMLElement>('.code-lines__text')]
    expect(lines).toHaveLength(10)
    // No line is cut at the box's edge, and nothing in the code box scrolls sideways.
    for (const line of lines) expect(line.scrollWidth).toBeLessThanOrEqual(line.clientWidth)
    expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth)
    expect(code.scrollWidth).toBeLessThanOrEqual(code.clientWidth)
    for (const scroller of code.querySelectorAll('.scroll-frame__body')) {
      expect(scroller.scrollWidth).toBeLessThanOrEqual(scroller.clientWidth)
    }
    // The code box ends inside the file preview, which ends inside the 390 px screen.
    const preview = root.querySelector('[data-figma="file preview"]')
    if (preview === null) throw new Error('no file preview')
    expect(box.getBoundingClientRect().right).toBeLessThanOrEqual(preview.getBoundingClientRect().right)
    expect(preview.getBoundingClientRect().right).toBeLessThanOrEqual(390)
    // Lines 3, 4, 5 and 8 are longer than the text column and wrap onto a second line (487:2238, 487:2241, 487:2244,
    // 487:2253); line 1 stays on one.
    const lineAt = (n: number) => lines[n - 1] ?? box
    for (const n of [3, 4, 5, 8]) expect(textLines(lineAt(n)), `line ${String(n)}`).toBe(2)
    expect(textLines(lineAt(1))).toBe(1)
    // Each number stays on its line's first visual line.
    const numbers = [...box.querySelectorAll<HTMLElement>('.code-lines__number')]
    expect(numbers).toHaveLength(10)
    for (const [i, number] of numbers.entries()) {
      expect(number.getBoundingClientRect().top).toBe(lineAt(i + 1).getBoundingClientRect().top)
    }
    await view.unmount()
  })
})
