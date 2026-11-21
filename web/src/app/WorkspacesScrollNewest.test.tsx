import type { ReactNode } from 'react'
import Markdown from 'react-markdown'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports, report } from '../errors/reporter.ts'
import { resetRetries } from '../errors/retryGuard.ts'
import { queryClient } from '../lib/queryClient.ts'
import { afterRendering, setViewport } from '../lib/rendering.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { boxIn, markdownShown, openWorkspaces, stubLongChats } from './longLiveChat.ts'
import { stubLiveServer } from './liveServerStub.ts'

// The owner's request (2026-11-21): far up in a chat, a button scrolls to the
// newest message. It is centred on the transcript, a small gap above the
// composer, shows only more than a screen above the end, and has a dot when
// entries came in meanwhile; a tap scrolls to the end, pins the transcript
// there and hides it, and the composer keeps the focus (blocks/NewestButton.tsx,
// blocks/usePinnedEnd.ts). Each test takes the owner's path: no URL
// parameters, then Workspaces, then the chat (the phone and the tablet) or the
// workbench's panes (the desktop), with the contract-checked transcript fake
// and long Markdown transcripts (longLiveChat.ts). A scroll renders no
// transcript entry: react-markdown, the screen and the chat header are
// counted, as in WorkspacesTypingRenders.test.tsx.
const { renders, counted } = vi.hoisted(() => {
  const renders = { screen: 0, header: 0 }
  type Module = Record<string, (props: object) => ReactNode>
  const counted = (real: Module, name: string, key: keyof typeof renders): Module => ({
    ...real,
    [name]: (props: object) => ((renders[key] += 1), real[name]?.(props)),
  })
  return { renders, counted }
})
vi.mock('react-markdown', { spy: true })
vi.mock('../pages/workspaces/screens/WorkspacesScreen.tsx', async (original) =>
  counted(await original(), 'WorkspacesScreen', 'screen'),
)
vi.mock('../pages/workspaces/blocks/ChatHead.tsx', async (original) => counted(await original(), 'ChatHead', 'header'))

const plan = 'mac-mini/c1'
const label = 'Scroll to the newest message'
/** Entries in each chat: about 20 screens on the phone. */
const count = 120

let view: { unmount: () => Promise<void> } | undefined

stubLiveServer()

afterEach(async () => {
  await view?.unmount()
  view = undefined
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  resetRetries()
  queryClient.clear()
  clearReports()
  resetAllStores()
  window.sessionStorage.clear()
  await setViewport(1512, 982)
})

type Shown = { readonly root: Element; readonly scroller: HTMLElement }

function scrollerIn(root: Element): HTMLElement {
  const body = root.querySelector('.scroll-frame__body')
  if (!(body instanceof HTMLElement)) throw new Error('no transcript scroller')
  return body
}

/** The desktop workbench's pane of `title`. */
function pane(title: string): Element {
  const el = page
    .getByRole('button', { name: `Maximise ${title}`, exact: true })
    .element()
    .closest('[data-figma]')
  if (el === null) throw new Error(`no pane for ${title}`)
  return el
}

const devices = [
  {
    name: 'the phone',
    size: [390, 844],
    open: async (): Promise<Shown> => {
      await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
      await markdownShown(count)
      const root = page.getByRole('region', { name: 'plan the slice' }).element()
      return { root, scroller: scrollerIn(root) }
    },
  },
  {
    name: 'the tablet',
    size: [756, 1129],
    open: async (): Promise<Shown> => {
      await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
      await markdownShown(count)
      const root = page.getByRole('region', { name: 'plan the slice' }).element()
      return { root, scroller: scrollerIn(root) }
    },
  },
  {
    name: "the desktop workbench's pane",
    size: [1512, 982],
    open: async (): Promise<Shown> => {
      await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
      await markdownShown(count * 2)
      const root = pane('plan the slice')
      return { root, scroller: scrollerIn(root) }
    },
  },
] as const

const fromEnd = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight
const buttonIn = (root: Element) => root.querySelector(`button[aria-label="${label}"]`)
const overlaps = (a: DOMRect, b: DOMRect) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

async function expectAtEnd(el: HTMLElement) {
  await expect.poll(() => el.scrollHeight > el.clientHeight * 3).toBe(true)
  await expect.poll(() => fromEnd(el)).toBeLessThanOrEqual(2)
}

/**
 * Scrolls `el` to `top` as the reader does, with a wheel turn first (only the reader's input leaves the end, screen
 * review R33), and waits for the scroll event and a frame.
 */
async function scrollTo(el: HTMLElement, top: number) {
  const scrolled = new Promise((resolve) => {
    el.addEventListener('scroll', resolve, { once: true })
  })
  el.dispatchEvent(new WheelEvent('wheel', { deltaY: top < el.scrollTop ? -400 : 400, bubbles: true }))
  el.scrollTop = top
  await scrolled
  await afterRendering()
}

const reply = (id: string, text: string) => ({ type: 'assistant' as const, id, text, cut: false })

describe('the button to the newest message', () => {
  for (const device of devices) {
    it(`shows more than a screen up, dots new entries, and a tap pins the end, on ${device.name}`, async () => {
      const server = stubLongChats(count)
      view = await openWorkspaces(device.size)
      const { root, scroller } = await device.open()
      await expectAtEnd(scroller)
      await expect.poll(() => server.openStreams()).toContain(plan)
      // At the end: no button.
      expect(buttonIn(root)).toBeNull()
      // Half a screen up: still none.
      await scrollTo(scroller, scroller.scrollHeight - scroller.clientHeight * 1.5)
      expect(buttonIn(root)).toBeNull()
      // Far up: the button shows, with no dot.
      await scrollTo(scroller, 0)
      await expect.poll(() => buttonIn(root)).not.toBeNull()
      const button = buttonIn(root)
      if (!(button instanceof HTMLElement)) throw new Error('no button')
      expect(button.hasAttribute('data-unseen')).toBe(false)
      // An entry comes in while the reader is away: the view stays, and the dot shows.
      server.push(plan, [reply('away-1', 'A reply while you read.')])
      await expect.element(page.getByText('A reply while you read.')).toBeInTheDocument()
      await expect.poll(() => buttonIn(root)?.hasAttribute('data-unseen')).toBe(true)
      expect(scroller.scrollTop).toBe(0)
      // Centred on the transcript's width, above the composer, clear of it, of the chips row and of the tray.
      const composer = root.querySelector('.composer__root')
      if (composer === null) throw new Error('no composer')
      const box = button.getBoundingClientRect()
      const frame = scroller.getBoundingClientRect()
      expect(Math.abs(box.left + box.width / 2 - (frame.left + frame.width / 2))).toBeLessThanOrEqual(1)
      expect(box.bottom).toBeLessThan(composer.getBoundingClientRect().top)
      expect(box.bottom).toBeLessThanOrEqual(frame.bottom)
      expect(overlaps(box, composer.getBoundingClientRect())).toBe(false)
      report(new Error('a test report'), 'live')
      await userEvent.click(page.getByRole('button', { name: '1 error' }))
      const tray = () => document.querySelector('aside[aria-label="Error reports"]')?.getBoundingClientRect()
      await expect.poll(() => tray()).toBeDefined()
      await expect
        .poll(() => {
          const t = tray()
          return t !== undefined && !overlaps(t, button.getBoundingClientRect())
        })
        .toBe(true)
      // The composer has the focus; a tap on the button keeps it there, and the transcript goes to the end.
      const textBox = boxIn(root)
      textBox.focus()
      await afterRendering()
      vi.mocked(Markdown).mockClear()
      renders.screen = 0
      renders.header = 0
      await userEvent.click(button)
      expect(document.activeElement).toBe(textBox)
      await expect.poll(() => fromEnd(scroller), { timeout: 3000 }).toBeLessThanOrEqual(2)
      await expect.poll(() => buttonIn(root)).toBeNull()
      expect(document.activeElement).toBe(textBox)
      // Neither the scrolls nor the tap rendered an entry, the screen or the header.
      expect({
        screen: renders.screen,
        header: renders.header,
        markdown: vi.mocked(Markdown).mock.calls.length,
      }).toEqual({ screen: 0, header: 0, markdown: 0 })
      // Pinned again: a new entry keeps the view at the end, and no button comes.
      server.push(plan, [reply('after-1', `Back at the end. ${'Each check ran green. '.repeat(12)}`)])
      await expect.element(page.getByText(/^Back at the end\./)).toBeInTheDocument()
      await expect.poll(() => fromEnd(scroller), { timeout: 3000 }).toBeLessThanOrEqual(2)
      await afterRendering()
      expect(buttonIn(root)).toBeNull()
      expect(getReports()).toHaveLength(1)
    })
  }

  it('renders no transcript entry while the reader scrolls up and down, on the phone', async () => {
    stubLongChats(count)
    view = await openWorkspaces([390, 844])
    const { root, scroller } = await devices[0].open()
    await expectAtEnd(scroller)
    vi.mocked(Markdown).mockClear()
    renders.screen = 0
    renders.header = 0
    for (const top of [scroller.scrollHeight / 2, 0, scroller.scrollHeight / 3, scroller.scrollHeight]) {
      await scrollTo(scroller, top)
    }
    await scrollTo(scroller, 0)
    await expect.poll(() => buttonIn(root)).not.toBeNull()
    expect({ screen: renders.screen, header: renders.header, markdown: vi.mocked(Markdown).mock.calls.length }).toEqual(
      {
        screen: 0,
        header: 0,
        markdown: 0,
      },
    )
  })

  it('clears the dot when the reader scrolls back to the end himself, on the tablet', async () => {
    const server = stubLongChats(count)
    view = await openWorkspaces([756, 1129])
    const { root, scroller } = await devices[1].open()
    await expectAtEnd(scroller)
    await expect.poll(() => server.openStreams()).toContain(plan)
    await scrollTo(scroller, 0)
    server.push(plan, [reply('away-2', 'Another reply while away.')])
    await expect.poll(() => buttonIn(root)?.hasAttribute('data-unseen')).toBe(true)
    await scrollTo(scroller, scroller.scrollHeight)
    await expect.poll(() => buttonIn(root)).toBeNull()
    // Up again with nothing new: no dot.
    await scrollTo(scroller, 0)
    await expect.poll(() => buttonIn(root)).not.toBeNull()
    expect(buttonIn(root)?.hasAttribute('data-unseen')).toBe(false)
  })

  it('jumps to the end at once with prefers-reduced-motion, on the phone', async () => {
    const real = window.matchMedia.bind(window)
    vi.stubGlobal('matchMedia', (query: string) =>
      query === '(prefers-reduced-motion: reduce)'
        ? {
            matches: true,
            media: query,
            onchange: null,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
            addListener: () => undefined,
            removeListener: () => undefined,
            dispatchEvent: () => false,
          }
        : real(query),
    )
    stubLongChats(count)
    view = await openWorkspaces([390, 844])
    const { root, scroller } = await devices[0].open()
    await expectAtEnd(scroller)
    await scrollTo(scroller, 0)
    await expect.poll(() => buttonIn(root)).not.toBeNull()
    const button = buttonIn(root)
    if (!(button instanceof HTMLElement)) throw new Error('no button')
    const smooth = vi.spyOn(scroller, 'scrollTo')
    await userEvent.click(button)
    expect(fromEnd(scroller)).toBeLessThanOrEqual(2)
    expect(smooth).not.toHaveBeenCalled()
  })

  it('gives each desktop pane its own button, centred on that pane', async () => {
    stubLongChats(count)
    view = await openWorkspaces([1512, 982])
    const { scroller: planScroller } = await devices[2].open()
    const review = pane('review notes')
    const reviewScroller = scrollerIn(review)
    await expectAtEnd(planScroller)
    await expectAtEnd(reviewScroller)
    await scrollTo(planScroller, 0)
    await expect.poll(() => buttonIn(pane('plan the slice'))).not.toBeNull()
    // The review pane is still at its end: no button there.
    expect(buttonIn(review)).toBeNull()
    await scrollTo(reviewScroller, 0)
    await expect.poll(() => buttonIn(review)).not.toBeNull()
    const box = buttonIn(review)?.getBoundingClientRect()
    const frame = reviewScroller.getBoundingClientRect()
    if (box === undefined) throw new Error('no button')
    expect(Math.abs(box.left + box.width / 2 - (frame.left + frame.width / 2))).toBeLessThanOrEqual(1)
  })

  // Codex review of #354: a pane that shrinks while the reader is up can carry him past a screen from the end.
  it('shows the button when the transcript shrinks past a screen from the end, on the phone', async () => {
    stubLongChats(count)
    view = await openWorkspaces([390, 844])
    const { root, scroller } = await devices[0].open()
    await expectAtEnd(scroller)
    await scrollTo(scroller, scroller.scrollHeight - scroller.clientHeight * 1.8)
    expect(buttonIn(root)).toBeNull()
    await setViewport(390, 500)
    await expect.poll(() => fromEnd(scroller) > scroller.clientHeight).toBe(true)
    await expect.poll(() => buttonIn(root)).not.toBeNull()
  })

  // The pending bubble of a sent message (PendingEntry, #348) is part of the transcript's end: sent while the reader is
  // away it dots the button, and a tap brings it into view at the end.
  it('counts a pending sent message as part of the end, on the phone', async () => {
    stubLongChats(count)
    view = await openWorkspaces([390, 844])
    const { root, scroller } = await devices[0].open()
    await expectAtEnd(scroller)
    await scrollTo(scroller, 0)
    await expect.poll(() => buttonIn(root)).not.toBeNull()
    expect(buttonIn(root)?.hasAttribute('data-unseen')).toBe(false)
    const field = boxIn(root)
    await userEvent.click(field)
    await userEvent.keyboard('A message sent while far up')
    await userEvent.click(
      page.getByRole('region', { name: 'plan the slice' }).getByRole('button', { name: 'Send', exact: true }),
    )
    await expect.poll(() => root.querySelectorAll('[data-pending-send]').length).toBe(1)
    await expect.poll(() => buttonIn(root)?.hasAttribute('data-unseen')).toBe(true)
    const button = buttonIn(root)
    if (!(button instanceof HTMLElement)) throw new Error('no button')
    await userEvent.click(button)
    await expect.poll(() => fromEnd(scroller), { timeout: 3000 }).toBeLessThanOrEqual(2)
    await expect.poll(() => buttonIn(root)).toBeNull()
    const bubble = root.querySelector('[data-pending-send]')?.getBoundingClientRect()
    const frame = scroller.getBoundingClientRect()
    if (bubble === undefined) throw new Error('no pending bubble')
    expect(bubble.top).toBeGreaterThanOrEqual(frame.top)
    expect(bubble.bottom).toBeLessThanOrEqual(frame.bottom)
  })

  // The Simulator showed the keyboard closing on a tap of the button: AppShell blurs the field on a touch press outside
  // a field and outside `[data-keyboard-keep]` while the keyboard is up (library beta.68, KeyboardKeep.test.tsx).
  it('keeps the message box focused on a touch tap with the keyboard up, on the phone', async () => {
    const viewport = new FakeViewport()
    replaceVisualViewport(viewport)
    stubLongChats(count)
    view = await openWorkspaces([390, 844])
    const { root, scroller } = await devices[0].open()
    await expectAtEnd(scroller)
    await scrollTo(scroller, 0)
    const field = boxIn(root)
    await userEvent.click(field)
    viewport.move({ height: 544 })
    const shell = document.querySelector<HTMLElement>('.app-shell__root')
    await expect.poll(() => shell?.style.getPropertyValue('--app-shell-keyboard')).not.toBe('')
    await expect.poll(() => buttonIn(root)).not.toBeNull()
    const button = buttonIn(root)
    if (button === null) throw new Error('no button')
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' }))
    button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerType: 'touch' }))
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }))
    await expect.poll(() => fromEnd(scroller), { timeout: 3000 }).toBeLessThanOrEqual(2)
    expect(document.activeElement).toBe(field)
  })
})

// A stand-in for window.visualViewport that the test moves as iOS Safari does when its keyboard opens: the layout keeps
// its height, and only the visual viewport shrinks (as in KeyboardKeep.test.tsx).
class FakeViewport extends EventTarget {
  height = document.documentElement.clientHeight
  width = document.documentElement.clientWidth
  offsetTop = 0
  offsetLeft = 0
  scale = 1
  move(change: { height: number }) {
    this.height = change.height
    this.dispatchEvent(new Event('resize'))
  }
}

function replaceVisualViewport(value: FakeViewport) {
  const own = Object.getOwnPropertyDescriptor(window, 'visualViewport')
  Object.defineProperty(window, 'visualViewport', { configurable: true, value })
  onTestFinished(() => {
    if (own) Object.defineProperty(window, 'visualViewport', own)
    else Reflect.deleteProperty(window, 'visualViewport')
  })
}
