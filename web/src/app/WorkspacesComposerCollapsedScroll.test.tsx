import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { resetRetries } from '../errors/retryGuard.ts'
import { queryClient } from '../lib/queryClient.ts'
import { afterRendering, setViewport } from '../lib/rendering.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { boxIn, markdownShown, openWorkspaces, stubLongChats } from './longLiveChat.ts'
import { stubLiveServer } from './liveServerStub.ts'

// Screen review R31 with the transcript's pin (R33, blocks/usePinnedEnd.ts) and the button to the newest message
// (blocks/NewestButton.tsx): the phone's and the tablet's composer is one row while its box is empty and not focused,
// and a tap expands it. Its height change resizes the transcript's scroller, which must not move the transcript: a
// chat at its end stays at its end, and a reader who scrolled up keeps his place and stays unpinned. The button sits
// above the composer at either height. Each test takes the owner's path: no URL parameters, then Workspaces, then the
// chat, with the contract-checked transcript fake and long Markdown transcripts (longLiveChat.ts).
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
  resetAllStores()
  window.sessionStorage.clear()
  await setViewport(1512, 982)
})

const devices = [
  ['the phone', [390, 844]],
  ['the tablet', [756, 1129]],
] as const

type Shown = { readonly root: Element; readonly scroller: HTMLElement; readonly composer: HTMLElement }

/** Taps the chat in the list and waits for its transcript. */
async function openChat(): Promise<Shown> {
  await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
  await markdownShown(count)
  const root = page.getByRole('region', { name: 'plan the slice' }).element()
  const scroller = root.querySelector('.scroll-frame__body')
  const composer = root.querySelector('.composer__root')
  if (!(scroller instanceof HTMLElement) || !(composer instanceof HTMLElement)) throw new Error('no chat')
  return { root, scroller, composer }
}

const fromEnd = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight
const collapsed = (composer: HTMLElement) => composer.hasAttribute('data-collapsed')
const buttonIn = (root: Element) => root.querySelector(`button[aria-label="${label}"]`)

/** A finger's tap: a touch press and release, then the click the browser sends after it. */
function tap(el: Element) {
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' }))
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerType: 'touch' }))
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

/** Scrolls `el` to `top` as the reader does, with a wheel turn first (R33), and waits for the scroll and a frame. */
async function readerScrollsTo(el: HTMLElement, top: number) {
  const scrolled = new Promise((resolve) => {
    el.addEventListener('scroll', resolve, { once: true })
  })
  el.dispatchEvent(new WheelEvent('wheel', { deltaY: top < el.scrollTop ? -400 : 400, bubbles: true }))
  el.scrollTop = top
  await scrolled
  await afterRendering()
  // Past the time a wheel turn counts as the reader's, so a later scroll is not his.
  await new Promise((resolve) => setTimeout(resolve, 600))
}

/**
 * Records the scroller's distance from the end at each scroll event and each size change, as the browser paints it.
 * The pin (usePinnedEnd.ts) corrects a size change in its own ResizeObserver, before the paint; this one is made later,
 * so its callback runs after the pin's in the same frame and sees what the paint shows.
 */
function watchFromEnd(el: HTMLElement) {
  const seen: number[] = []
  const note = () => seen.push(fromEnd(el))
  el.addEventListener('scroll', note)
  const sizes = new ResizeObserver(note)
  sizes.observe(el)
  return () => {
    el.removeEventListener('scroll', note)
    sizes.disconnect()
    return seen
  }
}

/** Expands the composer with a tap on its row, then collapses it with a blur; checks both heights. */
async function expandThenCollapse(composer: HTMLElement, root: Element) {
  const rowHeight = composer.getBoundingClientRect().height
  tap(composer)
  await expect.poll(() => collapsed(composer)).toBe(false)
  await afterRendering()
  expect(composer.getBoundingClientRect().height).toBeGreaterThan(rowHeight + 10)
  boxIn(root).blur()
  await expect.poll(() => collapsed(composer)).toBe(true)
  await afterRendering()
}

describe('the collapsing composer and the transcript (R31, R33)', () => {
  for (const [name, size] of devices) {
    it(`keeps a chat at its end through the expand and the collapse, on ${name}`, async () => {
      stubLongChats(count)
      view = await openWorkspaces(size)
      const { root, scroller, composer } = await openChat()
      await expect.poll(() => fromEnd(scroller)).toBeLessThanOrEqual(2)
      expect(collapsed(composer)).toBe(true)
      const stop = watchFromEnd(scroller)
      await expandThenCollapse(composer, root)
      const seen = stop()
      // Both size changes were seen (the observer's first call is its start), and each painted at the end.
      expect(seen.length).toBeGreaterThanOrEqual(3)
      expect(Math.max(...seen)).toBeLessThanOrEqual(2)
      expect(buttonIn(root)).toBeNull()
    })

    it(`keeps a reader's place above the end, unpinned, through the expand and the collapse, on ${name}`, async () => {
      const server = stubLongChats(count)
      view = await openWorkspaces(size)
      const { root, scroller, composer } = await openChat()
      await expect.poll(() => server.openStreams()).toContain(plan)
      const place = Math.round(scroller.scrollHeight / 2)
      await readerScrollsTo(scroller, place)
      await expect.poll(() => buttonIn(root)).not.toBeNull()
      expect(collapsed(composer)).toBe(true)
      await expandThenCollapse(composer, root)
      expect(Math.round(scroller.scrollTop)).toBe(place)
      // Still unpinned: a new entry leaves the place, and the button shows with its dot.
      server.push(plan, [{ type: 'assistant', id: 'late-1', text: 'A reply while you read.', cut: false }])
      await expect.element(page.getByText('A reply while you read.')).toBeInTheDocument()
      await expect.poll(() => buttonIn(root)?.hasAttribute('data-unseen')).toBe(true)
      expect(Math.round(scroller.scrollTop)).toBe(place)
    })

    it(`draws the button to the newest message above the composer at both heights, on ${name}`, async () => {
      stubLongChats(count)
      view = await openWorkspaces(size)
      const { root, scroller, composer } = await openChat()
      await readerScrollsTo(scroller, 0)
      await expect.poll(() => buttonIn(root)).not.toBeNull()
      const gap = () => {
        const button = buttonIn(root)
        if (button === null) throw new Error('no button')
        return composer.getBoundingClientRect().top - button.getBoundingClientRect().bottom
      }
      expect(collapsed(composer)).toBe(true)
      const rowGap = gap()
      expect(rowGap).toBeGreaterThan(0)
      tap(composer)
      await expect.poll(() => collapsed(composer)).toBe(false)
      await afterRendering()
      // The button moves up with the composer's top and keeps its gap over it.
      expect(Math.abs(gap() - rowGap)).toBeLessThanOrEqual(1)
    })
  }
})
