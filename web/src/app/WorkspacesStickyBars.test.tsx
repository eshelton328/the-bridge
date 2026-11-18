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
      // The title row; the note scrolls with the transcript.
      top: 'css:[data-figma="158:518"] h2',
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

describe('a short window in the Workbench (d-107)', () => {
  // A phone shows the desktop frames in a Storybook frame much shorter than 982 px. At 1512 × 600 the transcripts of
  // D1 and D5 no longer fit their panes: each composer (and the side chat's "Open as its own pane") must stay below
  // its transcript, never over it, and a transcript scrolls to its last entry.
  type ShortCase = { name: string; state: string }
  const cases: ShortCase[] = [
    { name: 'the split (D1)', state: 'workbench' },
    { name: 'the side chat in a pane (D5)', state: 'sideChatInPane' },
  ]

  /** Text for screen readers only (a `Message`'s sender name): a 1 px box that a viewer does not see. */
  const screenReaderOnly = (node: Node) => {
    const parent = node.parentElement
    if (parent === null) return false
    const r = box(parent)
    return r.width <= 1 || r.height <= 1
  }

  /** The text boxes of the body's leaves that the body shows (not scrolled out or clipped away). */
  const shownText = (body: HTMLElement) => {
    const view = box(body)
    const out: DOMRect[] = []
    const walk = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
    for (let node = walk.nextNode(); node !== null; node = walk.nextNode()) {
      if ((node.textContent ?? '').trim() === '' || screenReaderOnly(node)) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      for (const r of range.getClientRects())
        if (r.width > 0 && r.bottom > view.top + 1 && r.top < view.bottom - 1) out.push(r)
    }
    return out
  }

  /** The box of the body's last line of text. */
  const lastText = (body: HTMLElement): DOMRect | null => {
    let found: DOMRect | null = null
    const walk = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
    for (let node = walk.nextNode(); node !== null; node = walk.nextNode()) {
      if ((node.textContent ?? '').trim() === '' || screenReaderOnly(node)) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      const rects = [...range.getClientRects()].filter((r) => r.width > 0)
      const end = rects.at(-1)
      if (end !== undefined && (found === null || end.bottom >= found.bottom)) found = end
    }
    return found
  }

  for (const c of cases)
    it(`keeps every transcript above its composer and lets it scroll: ${c.name}`, async () => {
      await page.viewport(1512, 600)
      const view = await renderWorkspaces(c.state)
      onTestFinished(view.unmount)
      const root = await appRoot()
      await expect.poll(() => root.querySelectorAll('.scroll-frame__footer').length).toBeGreaterThan(0)
      await document.fonts.ready
      const frames = [...root.querySelectorAll('.scroll-frame__root')].filter(
        (frame) => frame.querySelector(':scope > .scroll-frame__footer') !== null,
      )
      let scrolled = 0
      for (const frame of frames) {
        const body = frame.querySelector<HTMLElement>(':scope > .scroll-frame__body')
        const footer = frame.querySelector(':scope > .scroll-frame__footer')
        if (body === null || footer === null) throw new Error('no body or footer')
        // The footer sits inside the window, and the body ends where the footer starts.
        expect(box(footer).bottom).toBeLessThanOrEqual(window.innerHeight + 0.5)
        expect(box(body).bottom).toBeLessThanOrEqual(box(footer).top + 0.5)
        // No text the body shows lies under the footer, at the top of the transcript or at its end.
        for (const r of shownText(body)) expect(r.top).toBeLessThan(box(footer).top)
        // Each transcript keeps at least one line (20 px) and scrolls to its last line. The side chat in a short pane
        // (D5) keeps two lines; its panel scrolls to show them with its composer.
        expect(body.clientHeight).toBeGreaterThanOrEqual(20)
        if (body.scrollHeight > body.clientHeight + 1) {
          body.scrollTop = body.scrollHeight
          await expect.poll(() => body.scrollTop > 0).toBe(true)
          // Scrolled to its end, the transcript's last text is in view, above the footer.
          const last = lastText(body)
          if (last === null) throw new Error('no transcript text')
          expect(last.bottom).toBeLessThanOrEqual(box(body).bottom + 1)
          expect(last.bottom).toBeLessThanOrEqual(box(footer).top + 1)
          for (const r of shownText(body)) expect(r.top).toBeLessThan(box(footer).top)
          scrolled += 1
        }
      }
      // At this height at least one transcript is taller than its pane, so the test sees a scroll.
      expect(scrolled).toBeGreaterThan(0)
      // The page and the panes do not scroll; only the transcripts.
      expect(document.scrollingElement?.scrollTop ?? 0).toBe(0)
      for (const outer of root.querySelectorAll('.app-shell__detail, .pane__body')) expect(outer.scrollTop).toBe(0)
    })
  it('keeps the side chat composer inside its panel, which does not scroll, and scrolls only its transcript (D5)', async () => {
    await page.viewport(1512, 600)
    const view = await renderWorkspaces('sideChatInPane')
    onTestFinished(view.unmount)
    const root = await appRoot()
    await expect.poll(() => root.querySelector('[data-figma="158:518"]')).not.toBeNull()
    await document.fonts.ready
    const panel = root.querySelector<HTMLElement>('[data-figma="158:518"]')
    const composer = root.querySelector('[data-figma="158:545"]')
    const body = composer?.closest('.scroll-frame__root')?.querySelector<HTMLElement>(':scope > .scroll-frame__body')
    if (panel === null || composer === null || body == null) throw new Error('no side chat, composer or transcript')
    expect(composer.querySelector('textarea')?.placeholder).toBe('Ask a side question')
    /** The composer's box lies inside the panel's, and the transcript keeps a line. */
    const fits = () => {
      const outer = box(panel)
      const inner = box(composer)
      expect(inner.top).toBeGreaterThanOrEqual(outer.top - 0.5)
      expect(inner.bottom).toBeLessThanOrEqual(outer.bottom + 0.5)
      expect(inner.left).toBeGreaterThanOrEqual(outer.left - 0.5)
      expect(inner.right).toBeLessThanOrEqual(outer.right + 0.5)
      expect(body.clientHeight).toBeGreaterThanOrEqual(20)
      // The panel itself does not scroll: its content fits it.
      expect(panel.scrollHeight).toBe(panel.clientHeight)
    }
    fits()
    // A long transcript scrolls inside the transcript; the panel still fits and its composer stays in place.
    const long = document.createElement('div')
    long.style.height = '3000px'
    long.style.flexShrink = '0'
    body.append(long)
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
    const before = box(composer).bottom
    body.scrollTop = body.scrollHeight
    await expect.poll(() => body.scrollTop > 0).toBe(true)
    fits()
    expect(panel.scrollTop).toBe(0)
    expect(box(composer).bottom).toBe(before)
  })
  it('keeps the side chat composer whole and reachable in a pane resized to 15% high (D5)', async () => {
    const view = await renderWorkspaces('sideChatInPane')
    onTestFinished(view.unmount)
    const root = await appRoot()
    await expect.poll(() => root.querySelector('[data-figma="158:518"]')).not.toBeNull()
    await document.fonts.ready
    const panel = root.querySelector<HTMLElement>('[data-figma="158:518"]')
    const composer = root.querySelector<HTMLElement>('[data-figma="158:545"]')
    if (panel === null || composer === null) throw new Error('no side chat or composer')
    expect(composer.querySelector('textarea')?.placeholder).toBe('Ask a side question')
    // The left column's rows handle, between the side chat's pane (top left) and the pane under it: Home takes the
    // top pane to its 10% minimum, and five steps of 1% bring it to 15%.
    const handle = root.querySelector<HTMLElement>('button[aria-label="Resize rows"]')
    if (handle === null) throw new Error('no rows handle')
    const pane = panel.closest<HTMLElement>('[data-figma="158:186"]')
    if (pane === null) throw new Error('the side chat is not in the top-left pane')
    const tall = box(pane).height
    handle.focus()
    await userEvent.keyboard('{Home}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}')
    await expect.poll(() => box(pane).height).toBeLessThan(tall / 2)
    await new Promise((resolve) => setTimeout(resolve, 100))
    // The one-row composer keeps its own height (40 px or more), however short the pane.
    expect(box(composer).height).toBeGreaterThanOrEqual(40)
    // Where the panel cannot show its title row and composer, it scrolls; scrolled to its end, the whole composer
    // lies inside the panel's box.
    panel.scrollTop = panel.scrollHeight
    await new Promise((resolve) => setTimeout(resolve, 50))
    const outer = box(panel)
    const inner = box(composer)
    expect(inner.top).toBeGreaterThanOrEqual(outer.top - 0.5)
    expect(inner.bottom).toBeLessThanOrEqual(outer.bottom + 0.5)
    const send = [...composer.querySelectorAll('button')].at(-1)
    if (send === undefined) throw new Error('no Send')
    expect(box(send).height).toBeGreaterThan(0)
    expect(box(send).bottom).toBeLessThanOrEqual(outer.bottom + 0.5)
  })
})
