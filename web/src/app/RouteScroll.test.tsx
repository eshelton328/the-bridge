import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page } from 'vitest/browser'
import { NotFound } from '../errors/NotFound.tsx'
import { RouteError } from '../errors/RouteError.tsx'
import { resetAllStores } from '../state/resetStores.ts'
import { markApp } from './appMarker.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// iOS scrolled the installed app's document by the keyboard's height (403 px, the trace of 2026-11-19 in the brain's
// phone-review traces) each time the composer took the focus, so the screen flashed. index.css fixes `#root` to the
// window under the app mark, so the document has no scroll range and iOS has nothing to scroll. Each route here renders
// into a real `#root`, as main.ts does, at the phone, tablet and desktop sizes, with 3000 px of content added to every
// scroll area in it (each ScrollFrame body, and the shell's panes where a page's list has no ScrollFrame): the document
// stays within the window, and a scroll area in view scrolls instead.
Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

// The live source reads a stubbed server, never the one on this machine (liveServerStub.ts).
stubLiveServer()

afterEach(async () => {
  resetAllStores()
  window.scrollTo(0, 0)
  await page.viewport(1512, 982)
})

const sizes = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 756, height: 1024 },
  { name: 'desktop', width: 1512, height: 982 },
]

// Each page's home and one detail with a composer or a long body, and the Workspaces live source (#221): each scrolls in
// the shell.
const shellRoutes = [
  '/inbox',
  '/inbox?state=chat',
  '/workspaces?source=fixtures',
  '/workspaces?state=phoneChatFull',
  '/artifacts',
  '/artifacts?state=artifactOpen',
  '/toolkit',
  '/toolkit?state=skillOpen',
  '/workspaces?source=live',
]
// The not-built screen of a source a page has not built: a short message with no shell and nothing to scroll.
const notBuiltRoutes = ['/inbox?source=mock-api', '/artifacts?source=live']

/** The elements in `root` that scroll on their own: each ScrollFrame body and each shell pane that scrolls. */
function scrollAreas(root: Element): HTMLElement[] {
  return [...root.querySelectorAll('*')].filter(
    (el): el is HTMLElement => el instanceof HTMLElement && ['auto', 'scroll'].includes(getComputedStyle(el).overflowY),
  )
}

async function renderRoute(path: string): Promise<HTMLElement> {
  const container = document.createElement('div')
  container.id = 'root'
  document.body.append(container)
  const root = createRoot(container)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    // The app router's fallbacks (router.ts), so a source a page has not built shows its not-built screen.
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: NotFound,
  })
  await act(async () => {
    root.render(<RouterProvider router={router} />)
    await Promise.resolve()
  })
  onTestFinished(async () => {
    await act(async () => {
      root.unmount()
      await Promise.resolve()
    })
    container.remove()
  })
  return container
}

function expectNoDocumentScroll(): void {
  const doc = document.scrollingElement
  if (doc === null) throw new Error('no scrolling element')
  expect(doc.scrollHeight).toBeLessThanOrEqual(window.innerHeight)
  window.scrollTo(0, 600)
  expect(window.scrollY).toBe(0)
}

// iOS scrolls the document for a focused field even when html and body clip, as far as the document's flow reaches.
// With the clip off and content in `#root` taller than the window, as in the frame where iOS reports the keyboard, the
// fixed root keeps that content out of the flow, so the document still has no scroll range.
function expectNoScrollWhenRootGrows(container: HTMLElement): void {
  const html = document.documentElement
  html.style.overflow = 'visible'
  document.body.style.overflow = 'visible'
  const grown = document.createElement('div')
  grown.style.height = '3000px'
  container.append(grown)
  onTestFinished(() => {
    grown.remove()
    html.style.overflow = ''
    document.body.style.overflow = ''
  })
  expectNoDocumentScroll()
}

describe('every route scrolls in its own frame, never the document', () => {
  for (const path of shellRoutes) {
    for (const size of sizes) {
      it(`${path} at the ${size.name} size (${String(size.width)} x ${String(size.height)})`, async () => {
        await page.viewport(size.width, size.height)
        onTestFinished(markApp())
        const container = await renderRoute(path)
        await expect.poll(() => container.querySelector('.app-shell__root')).not.toBeNull()
        // The fixed root still gives the shell the window's full height.
        expect(container.querySelector('.app-shell__root')?.getBoundingClientRect().height).toBe(window.innerHeight)
        await expect.poll(() => scrollAreas(container).length).toBeGreaterThan(0)
        const bodies = scrollAreas(container)
        for (const body of bodies) {
          const tall = document.createElement('div')
          tall.style.height = '3000px'
          tall.style.flexShrink = '0'
          body.append(tall)
        }
        expectNoDocumentScroll()
        // A scroll area in view takes the long content and scrolls.
        const shown = bodies.filter((el) => el.clientHeight > 0)
        expect(shown.length).toBeGreaterThan(0)
        const scrolled = shown.filter((el) => {
          el.scrollTop = 500
          return el.scrollHeight > el.clientHeight && el.scrollTop > 0
        })
        expect(scrolled.length).toBeGreaterThan(0)
        expectNoDocumentScroll()
        expectNoScrollWhenRootGrows(container)
      })
    }
  }
  for (const path of notBuiltRoutes) {
    for (const size of sizes) {
      it(`${path} (not built) at the ${size.name} size (${String(size.width)} x ${String(size.height)})`, async () => {
        await page.viewport(size.width, size.height)
        onTestFinished(markApp())
        const container = await renderRoute(path)
        await expect.poll(() => container.textContent).toMatch(/not built yet/i)
        expectNoDocumentScroll()
        expectNoScrollWhenRootGrows(container)
      })
    }
  }
})
