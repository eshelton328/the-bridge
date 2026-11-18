import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// Erik's decision (2026-11-18): the installed app's page never pulls past the screen and bounces. The document never
// scrolls: html and body fill the window and clip (index.css), and only the shell's own scroll areas scroll. A real
// route renders at a phone and a desktop size, with a tall block after it as content that overflows the window would
// be, and neither a wheel nor a scroll call moves the document. The app's styles and fonts load as in main.ts, and
// the root has the theme and mode of index.html.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(async () => {
  resetAllStores()
  window.scrollTo(0, 0)
  await page.viewport(1512, 982)
})

const sizes = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1512, height: 982 },
]

describe('the document never scrolls', () => {
  for (const path of ['/inbox', '/workspaces', '/artifacts', '/toolkit']) {
    for (const size of sizes) {
      it(`on ${path} at the ${size.name} size (${String(size.width)} x ${String(size.height)})`, async () => {
        await page.viewport(size.width, size.height)
        const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
        const view = await testRender(<RouterProvider router={router} />)
        onTestFinished(view.unmount)
        await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
        // The render's container fills the window, as `#root` does in index.css.
        const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
        if (!(root instanceof HTMLElement)) throw new Error('no root')
        root.style.height = '100%'
        const doc = document.scrollingElement
        if (doc === null) throw new Error('no scrolling element')
        // The page fits the window: its content scrolls inside the shell, not in the document.
        expect(doc.scrollHeight).toBe(window.innerHeight)
        const tall = document.createElement('div')
        tall.style.height = '3000px'
        document.body.append(tall)
        onTestFinished(() => {
          tall.remove()
        })
        expect(doc.scrollHeight).toBe(window.innerHeight)
        await userEvent.wheel(document.body, { delta: { y: 600 } })
        window.scrollTo(0, 600)
        doc.scrollTop = 600
        expect(doc.scrollTop).toBe(0)
        expect(window.scrollY).toBe(0)
      })
    }
  }
})
