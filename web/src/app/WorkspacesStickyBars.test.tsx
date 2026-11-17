import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The Workbench's sticky bars through the real route (d-107): each pane, the chat alone, the side chat and the
// subagents panel keep their header at the top and their composer at the bottom while only the content between them
// scrolls. The app's styles and fonts load as in main.ts, and the root has the theme and mode of index.html, so the
// tests measure the real layout. The pattern is InboxStickyBars.test.tsx's.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderWorkspaces(state: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/workspaces?state=${state}`] }),
  })
  return testRender(<RouterProvider router={router} />)
}

afterEach(async () => {
  resetAllStores()
  await page.viewport(1512, 982)
})

/** The box of an element. */
const box = (el: Element) => el.getBoundingClientRect()

/** The render's root, made to fill the window as `#root` does in index.css. Earlier tests leave their renders. */
async function appRoot(): Promise<HTMLElement> {
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  root.style.height = '100%'
  return root
}

// A bar by its Figma layer (`105:230`), a button by its name (`button:Close subagents`) or a selector (`css:…`).
const find = (root: Element, bar: string): Element | null => {
  if (bar.startsWith('button:')) return root.querySelector(`button[aria-label="${bar.slice('button:'.length)}"]`)
  if (bar.startsWith('css:')) return root.querySelector(bar.slice('css:'.length))
  return root.querySelector(`[data-figma="${bar}"]`)
}

describe('the Workbench sticky bars (d-107)', () => {
  // Each case: a state, the bar that stays at the top, the bar that stays at the bottom (a panel with no composer has
  // none) and the scrolling body between them, found from the bottom or top bar. The frames' transcripts fit their
  // panes, so each test adds a tall block to that body, as a long transcript would.
  type StickyCase = { name: string; state: string; top: string; bottom: string | undefined; from: string }
  const cases: StickyCase[] = [
    {
      name: 'a chat pane of the split (D1)',
      state: 'workbench',
      top: 'css:[data-figma="105:262"] .pane__header',
      bottom: '105:304',
      from: '105:304',
    },
    {
      name: 'the shell pane of the split (D1)',
      state: 'workbench',
      top: 'css:[data-figma="105:316"] .pane__header',
      bottom: undefined,
      from: '105:337',
    },
    { name: 'the chat alone (D2)', state: 'sideChat', top: '105:785', bottom: '105:889', from: '105:889' },
    { name: 'the side chat (D2)', state: 'sideChat', top: '105:932', bottom: '105:948', from: '105:948' },
    {
      name: 'the subagents panel (D3)',
      state: 'subagents',
      top: 'button:Close subagents',
      bottom: undefined,
      from: 'button:Close subagents',
    },
    {
      name: 'the side chat in a pane (D5)',
      state: 'sideChatInPane',
      top: '158:530',
      bottom: '158:545',
      from: '158:545',
    },
    {
      name: 'the chat in the workbench beside the sidebar (D7)',
      state: 'chatInWorkbench',
      top: 'css:[data-figma="402:485"] .pane__header',
      bottom: '402:528',
      from: '402:528',
    },
  ]

  for (const c of cases)
    it(`keeps the header and the composer in view while the transcript scrolls: ${c.name}`, async () => {
      const view = await renderWorkspaces(c.state)
      onTestFinished(view.unmount)
      const root = await appRoot()
      await expect.poll(() => find(root, c.top)).not.toBeNull()
      const top = find(root, c.top) ?? document.body
      const bottom = c.bottom === undefined ? null : find(root, c.bottom)
      if (c.bottom !== undefined) expect(bottom).not.toBeNull()
      // The scrolling body of the frame that holds the bar, or of the frame inside it (the shell pane's terminal).
      const from = find(root, c.from)
      const frame = from?.closest('.scroll-frame__root') ?? from?.querySelector('.scroll-frame__root')
      const body = frame?.querySelector<HTMLElement>(':scope > .scroll-frame__body')
      if (body == null) throw new Error('no scrolling body')
      const long = document.createElement('div')
      long.style.height = '3000px'
      long.style.flexShrink = '0'
      body.append(long)
      expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
      const before = { top: box(top).top, bottom: bottom === null ? 0 : box(bottom).bottom }
      body.scrollTop = body.scrollHeight
      await expect.poll(() => body.scrollTop > 0).toBe(true)
      // The page, the AppShell detail and the pane bodies do not scroll; only the content between the bars.
      expect(document.scrollingElement?.scrollTop ?? 0).toBe(0)
      for (const outer of root.querySelectorAll('.app-shell__detail, .pane__body')) expect(outer.scrollTop).toBe(0)
      expect(box(top).top).toBe(before.top)
      expect(box(top).top).toBeGreaterThanOrEqual(0)
      if (bottom !== null) {
        expect(box(bottom).bottom).toBe(before.bottom)
        expect(box(bottom).bottom).toBeLessThanOrEqual(window.innerHeight)
        expect(box(top).bottom).toBeLessThanOrEqual(box(bottom).top)
      }
    })
})

describe('a long draft in the Workbench (d-107)', () => {
  // The composer of a pane of the split (D1 105:304, 440 high) and of the chat alone (D2 105:889).
  type DraftCase = { name: string; state: string; layer: string }
  const cases: DraftCase[] = [
    { name: 'a chat pane of the split (D1)', state: 'workbench', layer: '105:304' },
    { name: 'the chat alone (D2)', state: 'sideChat', layer: '105:889' },
  ]
  for (const c of cases)
    it(`keeps Send in reach when the composer holds 70 lines: ${c.name}`, async () => {
      const view = await renderWorkspaces(c.state)
      onTestFinished(view.unmount)
      const root = await appRoot()
      const reply = root.querySelector(`[data-figma="${c.layer}"]`)
      const field = reply?.querySelector('textarea')
      if (!(reply instanceof HTMLElement) || !(field instanceof HTMLTextAreaElement)) throw new Error('no composer')
      await userEvent.fill(field, Array.from({ length: 70 }, (_, i) => `line ${String(i + 1)}`).join('\n'))
      // The box grows to its text a frame or more after the input: let the layout settle before measuring.
      await new Promise((resolve) => setTimeout(resolve, 300))
      // The composer stays inside its pane and the window; past its cap it scrolls, and scrolled to its end Send is
      // in view.
      const pane = reply.closest('.pane__root, [data-figma="105:784"]') ?? root
      expect(box(reply).bottom).toBeLessThanOrEqual(Math.min(window.innerHeight, box(pane).bottom))
      expect(box(reply).top).toBeGreaterThanOrEqual(box(pane).top)
      reply.scrollTop = reply.scrollHeight
      const send = [...reply.querySelectorAll('button')].at(-1)
      if (send === undefined) throw new Error('no Send')
      await expect
        .poll(() => box(send).bottom <= Math.min(window.innerHeight, box(reply).bottom, box(pane).bottom) + 1)
        .toBe(true)
      expect(box(send).top).toBeGreaterThanOrEqual(box(reply).top)
    })
})
