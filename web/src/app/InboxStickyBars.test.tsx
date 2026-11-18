import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The Inbox's sticky bars through the real route (d-107): each detail keeps its Back bar at the top and its reply box
// or pinned bar at the bottom while only the content between them scrolls. The app's styles and fonts load as in
// main.ts, and the root has the theme and mode of index.html, so the tests measure the real layout.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderInbox(state: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/inbox?state=${state}`] }),
  })
  return { router, rendered: testRender(<RouterProvider router={router} />) }
}

afterEach(async () => {
  resetAllStores()
  await page.viewport(1512, 982)
})

/** The box of an element. */
const box = (el: Element) => el.getBoundingClientRect()

describe('the sticky bars (d-107)', () => {
  // Each case: a state, its viewport, the bar that stays at the top (if the layout has one) and the bar that stays at
  // the bottom, by their Figma layer names (or a control's name). The frames' content fits their screens, so each test
  // adds a tall block to the content, as a long chat or discussion would.
  type StickyCase = { name: string; state: string; w: number; h: number; top: string | undefined; bottom: string }
  const cases: StickyCase[] = [
    {
      name: 'the started task on the desktop (D5)',
      state: 'running',
      w: 1512,
      h: 982,
      top: undefined,
      bottom: 'textbox:Reply',
    },
    { name: 'the chat on the tablet (T5)', state: 'chat', w: 756, h: 1158, top: 'nav', bottom: '346:6416' },
    { name: 'the chat on the phone (M8)', state: 'chat', w: 390, h: 844, top: 'nav', bottom: '346:10886' },
    {
      name: 'the discussion panel on the desktop (D15)',
      state: 'changeProposed',
      w: 1512,
      h: 982,
      top: 'button:Close the discussion',
      bottom: 'composer · discussion',
    },
    {
      name: 'the discussion page on the tablet (T18)',
      state: 'changeProposedPage',
      w: 756,
      h: 1158,
      top: 'nav',
      bottom: 'composer · discussion',
    },
    {
      name: 'the discussion page on the phone (M19)',
      state: 'changeProposedPage',
      w: 390,
      h: 844,
      top: 'nav',
      bottom: 'composer · discussion',
    },
    {
      name: 'the task page on the tablet, with its run card (T4)',
      state: 'runningTaskPage',
      w: 756,
      h: 1158,
      top: 'nav · back',
      bottom: 'running',
    },
    {
      name: 'the task page on the phone, with Start (M2)',
      state: 'taskPage',
      w: 390,
      h: 844,
      top: 'nav',
      bottom: 'sticky action',
    },
    {
      name: 'the question on the phone (M5)',
      state: 'questionPhone',
      w: 390,
      h: 844,
      top: 'nav',
      bottom: 'sticky action',
    },
  ]

  const find = (root: Element, layer: string): Element | null => {
    if (layer.startsWith('button:')) {
      const name = layer.slice('button:'.length)
      return root.querySelector(`button[aria-label="${name}"]`)
    }
    if (layer.startsWith('textbox:')) {
      const name = layer.slice('textbox:'.length)
      return (
        [...root.querySelectorAll('textarea')].find(
          (el) => el.getAttribute('aria-label') === name || el.labels[0]?.textContent === name,
        ) ?? null
      )
    }
    return root.querySelector(`[data-figma="${layer}"]`)
  }

  for (const c of cases)
    it(`keeps the top and bottom bars in view while the content scrolls: ${c.name}`, async () => {
      await page.viewport(c.w, c.h)
      const { rendered } = renderInbox(c.state)
      const view = await rendered
      onTestFinished(view.unmount)
      // The app's root fills the window, as `#root` does in index.css, so the frame has the window's height. Earlier
      // tests leave their renders in the page, so each query looks only in this one.
      await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
      const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
      if (!(root instanceof HTMLElement)) throw new Error('no root')
      root.style.height = '100%'
      await expect.poll(() => find(root, c.bottom)).not.toBeNull()
      const bottom = find(root, c.bottom) ?? document.body
      const top = c.top === undefined ? null : find(root, c.top)
      if (c.top !== undefined) expect(top).not.toBeNull()
      // The content that scrolls: each ScrollFrame body, made to overflow.
      const bodies = [...root.querySelectorAll<HTMLElement>('.scroll-frame__body')]
      expect(bodies.length).toBeGreaterThan(0)
      for (const body of bodies) {
        const long = document.createElement('div')
        long.style.height = '3000px'
        long.style.flexShrink = '0'
        // In the content, before a pinned bar that is sticky at the end of the body.
        ;(body.firstElementChild ?? body).append(long)
      }
      for (const body of bodies) expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
      const before = { top: top === null ? 0 : box(top).top, bottom: box(bottom).bottom }
      for (const body of bodies) body.scrollTop = body.scrollHeight
      // The page and the AppShell detail do not scroll; only the content between the bars.
      const detail = root.querySelector('.app-shell__detail')
      expect(detail?.scrollTop ?? 0).toBe(0)
      await expect.poll(() => bodies.every((b) => b.scrollTop > 0)).toBe(true)
      expect(document.scrollingElement?.scrollTop ?? 0).toBe(0)
      expect(box(bottom).bottom).toBe(before.bottom)
      expect(box(bottom).bottom).toBeLessThanOrEqual(window.innerHeight)
      expect(box(bottom).top).toBeGreaterThanOrEqual(0)
      if (top !== null) {
        expect(box(top).top).toBe(before.top)
        expect(box(top).top).toBeGreaterThanOrEqual(0)
        expect(box(top).bottom).toBeLessThanOrEqual(box(bottom).top)
      }
      await view.unmount()
    })
})

describe('a long draft (d-107)', () => {
  type DraftCase = { name: string; state: string; w: number; h: number; layer: string | undefined }
  const cases: DraftCase[] = [
    {
      name: 'the discussion panel on the desktop (D15)',
      state: 'changeProposed',
      w: 1512,
      h: 982,
      layer: 'composer · discussion',
    },
    { name: 'the started task on the desktop (D5)', state: 'running', w: 1512, h: 982, layer: undefined },
    {
      name: 'the discussion page on the phone (M19)',
      state: 'changeProposedPage',
      w: 390,
      h: 844,
      layer: 'composer · discussion',
    },
  ]
  for (const c of cases)
    it(`keeps Send in reach of the wheel when the reply box holds 70 lines: ${c.name}`, async () => {
      await page.viewport(c.w, c.h)
      const view = await renderInbox(c.state).rendered
      onTestFinished(view.unmount)
      await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
      const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
      if (!(root instanceof HTMLElement)) throw new Error('no root')
      root.style.height = '100%'
      const field = root.querySelector(c.layer === undefined ? 'textarea' : `[data-figma="${c.layer}"] textarea`)
      if (!(field instanceof HTMLTextAreaElement)) throw new Error('no reply box')
      await userEvent.fill(field, Array.from({ length: 70 }, (_, i) => `line ${String(i + 1)}`).join('\n'))
      // The box grows to its text a frame or more after the input: let the layout settle before measuring.
      await new Promise((resolve) => setTimeout(resolve, 300))
      // The library Composer, which caps its draft (30% of the nearest size container) and scrolls inside.
      const box = field.closest('.composer__root') ?? field
      // The reply box stays inside the window; past its cap it scrolls, and scrolled to its end Send is in view.
      expect(box.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight)
      expect(box.getBoundingClientRect().top).toBeGreaterThanOrEqual(0)
      box.scrollTop = box.scrollHeight
      const send = [...box.querySelectorAll('button')].at(-1)
      if (send === undefined) throw new Error('no Send')
      await expect
        .poll(
          () =>
            send.getBoundingClientRect().bottom <= Math.min(window.innerHeight, box.getBoundingClientRect().bottom) + 1,
        )
        .toBe(true)
      expect(send.getBoundingClientRect().top).toBeGreaterThanOrEqual(box.getBoundingClientRect().top)
    })

  // A short window (the-bridge#45: at 1232 x 400 a box capped at half the window left the messages 0 px): with a
  // 70-line draft, the Composer stops at 30% of the discussion panel (a size container) and the entries between the
  // bars keep at least 100 px (104 at 1232 x 400; 18 with the 50vh cap).
  for (const [w, h] of [
    [1232, 400],
    [1512, 600],
  ] as const)
    it(`keeps the discussion's entries room to read with a long draft at ${String(w)} x ${String(h)} (D15)`, async () => {
      await page.viewport(w, h)
      const view = await renderInbox('changeProposed').rendered
      onTestFinished(view.unmount)
      await expect.poll(() => document.querySelector('[data-figma="composer · discussion"] textarea')).not.toBeNull()
      // The app's root fills the window, as in index.html, so the window's height bounds the panel.
      const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
      if (!(root instanceof HTMLElement)) throw new Error('no root')
      root.style.height = '100%'
      const field = document.querySelector('[data-figma="composer · discussion"] textarea')
      if (!(field instanceof HTMLTextAreaElement)) throw new Error('no reply box')
      await userEvent.fill(field, Array.from({ length: 70 }, (_, i) => `line ${String(i + 1)}`).join('\n'))
      await new Promise((resolve) => setTimeout(resolve, 300))
      const composer = field.closest('.composer__root')
      const panel = field.closest('[data-figma="discussion panel"]')
      const body = field.closest('.scroll-frame__footer')?.parentElement?.querySelector('.scroll-frame__body')
      if (!(composer instanceof HTMLElement) || !(panel instanceof HTMLElement) || !(body instanceof HTMLElement))
        throw new Error('no frame')
      const style = getComputedStyle(panel)
      const inner = box(panel).height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
      expect(box(composer).height).toBeLessThanOrEqual(inner * 0.3 + 1)
      expect(field.scrollHeight).toBeGreaterThan(field.clientHeight)
      expect(box(body).height).toBeGreaterThanOrEqual(100)
    })
})
