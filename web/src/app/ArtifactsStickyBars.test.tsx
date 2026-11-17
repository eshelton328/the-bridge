import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The Artifacts discussion's sticky bars through the real route (d-107): the discussion panel beside the open
// artifact keeps its header (the title and Close) at the top and its reply box at the bottom while only the messages
// between them scroll; the artifact's column scrolls on its own. The app's styles and fonts load as in main.ts, and
// the root has the theme and mode of index.html, so the tests measure the real layout.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderArtifacts(state: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/artifacts?state=${state}`] }),
  })
  return { router, rendered: testRender(<RouterProvider router={router} />) }
}

afterEach(async () => {
  resetAllStores()
  await page.viewport(1512, 982)
})

/** The box of an element. */
const box = (el: Element) => el.getBoundingClientRect()

/** The render of this test: earlier tests leave theirs in the page. Its root fills the window, as `#root` does. */
async function renderRoot(state: string) {
  const view = await renderArtifacts(state).rendered
  onTestFinished(view.unmount)
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  root.style.height = '100%'
  return { view, root }
}

// The discussion's frames on the desktop: D7 (empty), D8 (a proposed change) and D9 (the change applied).
const states = [
  { name: 'the empty discussion (D7)', state: 'discussOpen' },
  { name: 'the proposed change (D8)', state: 'changeProposed' },
  { name: 'the applied change (D9)', state: 'changeApplied' },
]

describe('the sticky bars (d-107)', () => {
  for (const c of states)
    it(`keeps the header and the reply box in view while the messages scroll: ${c.name}`, async () => {
      await page.viewport(1512, 982)
      const { view, root } = await renderRoot(c.state)
      const panel = root.querySelector('[data-figma="discussion panel"]')
      await expect.poll(() => root.querySelector('[data-figma="composer · discussion"]')).not.toBeNull()
      const top = root.querySelector('button[aria-label="Close the discussion"]')
      const bottom = root.querySelector('[data-figma="composer · discussion"]')
      if (!(panel instanceof HTMLElement) || top === null || bottom === null) throw new Error('no discussion')
      // The content that scrolls: the panel's messages and the artifact's column, each a ScrollFrame body, made to
      // overflow as a long discussion would.
      const bodies = [...root.querySelectorAll<HTMLElement>('.scroll-frame__body')]
      const messages = panel.querySelector<HTMLElement>('.scroll-frame__body')
      expect(messages).not.toBeNull()
      expect(bodies.length).toBeGreaterThan(1)
      for (const body of bodies) {
        const long = document.createElement('div')
        long.style.height = '3000px'
        long.style.flexShrink = '0'
        ;(body.firstElementChild ?? body).append(long)
      }
      for (const body of bodies) expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
      const before = { top: box(top).top, bottom: box(bottom).bottom }
      for (const body of bodies) body.scrollTop = body.scrollHeight
      // The page and the AppShell detail do not scroll; only the content between the bars.
      const detail = root.querySelector('.app-shell__detail')
      expect(detail?.scrollTop ?? 0).toBe(0)
      await expect.poll(() => bodies.every((b) => b.scrollTop > 0)).toBe(true)
      expect(document.scrollingElement?.scrollTop ?? 0).toBe(0)
      expect(box(bottom).bottom).toBe(before.bottom)
      expect(box(bottom).bottom).toBeLessThanOrEqual(window.innerHeight)
      expect(box(bottom).top).toBeGreaterThanOrEqual(0)
      expect(box(top).top).toBe(before.top)
      expect(box(top).top).toBeGreaterThanOrEqual(0)
      expect(box(top).bottom).toBeLessThanOrEqual(box(bottom).top)
      await view.unmount()
    })
})

describe('a long draft (d-107)', () => {
  for (const c of states)
    it(`keeps Send in reach of the wheel when the reply box holds 70 lines: ${c.name}`, async () => {
      await page.viewport(1512, 982)
      const { root } = await renderRoot(c.state)
      await expect.poll(() => root.querySelector('[data-figma="composer · discussion"] textarea')).not.toBeNull()
      const field = root.querySelector('[data-figma="composer · discussion"] textarea')
      if (!(field instanceof HTMLTextAreaElement)) throw new Error('no reply box')
      await userEvent.fill(field, Array.from({ length: 70 }, (_, i) => `line ${String(i + 1)}`).join('\n'))
      // The box grows to its text a frame or more after the input: let the layout settle before measuring.
      await new Promise((resolve) => setTimeout(resolve, 300))
      // The element around the Composer: the reply layer, which caps the box.
      const reply = field.closest('.composer__root')?.parentElement ?? field
      // The reply box stays inside the window; past its cap it scrolls, and scrolled to its end Send is in view.
      expect(reply.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight)
      expect(reply.getBoundingClientRect().top).toBeGreaterThanOrEqual(0)
      expect(reply.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight / 2 + 1)
      reply.scrollTop = reply.scrollHeight
      const send = [...reply.querySelectorAll('button')].at(-1)
      if (send === undefined) throw new Error('no Send')
      await expect
        .poll(
          () =>
            send.getBoundingClientRect().bottom <=
            Math.min(window.innerHeight, reply.getBoundingClientRect().bottom) + 1,
        )
        .toBe(true)
      expect(send.getBoundingClientRect().top).toBeGreaterThanOrEqual(reply.getBoundingClientRect().top)
    })
})
