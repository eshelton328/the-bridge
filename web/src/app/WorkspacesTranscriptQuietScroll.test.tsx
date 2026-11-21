import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { resetRetries } from '../errors/retryGuard.ts'
import { queryClient } from '../lib/queryClient.ts'
import { afterRendering, setViewport } from '../lib/rendering.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { boxIn, markdownShown, openWorkspaces, stubLongChats } from './longLiveChat.ts'
import { stubLiveServer } from './liveServerStub.ts'

// A scroll that no input explains (blocks/usePinnedEnd.ts): VoiceOver's
// three-finger swipe and Find in page move the transcript with no touch,
// wheel, key or focus the pin sees. Away from a recent layout change the
// page made, such a scroll is the reader's: it leaves the end and keeps its
// place. Right after one (a cleared draft or a composer that resized, review
// R33), it goes back to the end in the same frame. Each test takes the
// owner's path: no URL parameters, then Workspaces, then the chat on the
// phone or the workbench's panes on the desktop, with the contract-checked
// transcript fake and long Markdown transcripts (longLiveChat.ts).
const plan = 'mac-mini/c1'
const label = 'Scroll to the newest message'
/** Entries in each chat: about 10 screens on the phone. */
const count = 60

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

const fromEnd = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type Shown = { readonly root: Element; readonly scroller: HTMLElement }

/** The phone: taps the plan chat in the list and returns its region and transcript scroller. */
async function phoneChat(): Promise<Shown> {
  view = await openWorkspaces([390, 844])
  await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
  await markdownShown(count)
  return shownIn(page.getByRole('region', { name: 'plan the slice' }).element())
}

/** The desktop: hides the sidebar and returns the plan pane and its transcript scroller. */
async function desktopPane(): Promise<Shown> {
  view = await openWorkspaces([1512, 982])
  await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
  await markdownShown(count * 2)
  const pane = page
    .getByRole('button', { name: 'Maximise plan the slice', exact: true })
    .element()
    .closest('[data-figma]')
  if (pane === null) throw new Error('no plan pane')
  return shownIn(pane)
}

function shownIn(root: Element): Shown {
  const scroller = root.querySelector('.scroll-frame__body')
  if (!(scroller instanceof HTMLElement)) throw new Error('no transcript scroller')
  return { root, scroller }
}

/**
 * Waits until the page made no layout change for longer than the pin's window (1.5 s) and a few rendering steps ran,
 * as when the reader has been reading a while.
 */
async function quiet() {
  await sleep(1800)
  await afterRendering()
  await afterRendering()
}

/**
 * Moves `el` with no input from the reader (`move` sets its scroll, as VoiceOver or Find in page does) and returns how
 * far from the end the view was in each of the next frames, from the frame of that scroll on.
 */
async function scrollNobodyTouched(el: HTMLElement, move: () => void, frames = 10): Promise<number[]> {
  const seen: number[] = []
  const done = new Promise<void>((resolve) => {
    const frame = () => {
      seen.push(fromEnd(el))
      if (seen.length < frames) requestAnimationFrame(frame)
      else resolve()
    }
    el.addEventListener(
      'scroll',
      () => {
        requestAnimationFrame(frame)
      },
      { once: true },
    )
  })
  move()
  await done
  return seen
}

/** VoiceOver's three-finger swipe down: the transcript one page up. */
const pageUp = (el: HTMLElement) => () => {
  el.scrollTop -= el.clientHeight
}

/** Pushes one reply to the plan chat and waits until it shows. */
async function pushReply(server: ReturnType<typeof stubLongChats>, text: string) {
  server.push(plan, [{ type: 'assistant', id: `late-${text}`, text, cut: false }])
  await expect.element(page.getByText(text, { exact: true })).toBeInTheDocument()
  await afterRendering()
}

describe('a scroll no input explains, such as VoiceOver or Find in page', () => {
  for (const [name, open] of [
    ['the phone', phoneChat],
    ['the desktop', desktopPane],
  ] as const) {
    it(`leaves the end and keeps its place, page after page, with no recent layout change, on ${name}`, async () => {
      const server = stubLongChats(count)
      const { root, scroller } = await open()
      await expect.poll(() => fromEnd(scroller)).toBeLessThanOrEqual(2)
      await expect.poll(() => server.openStreams()).toContain(plan)
      await quiet()
      const first = await scrollNobodyTouched(scroller, pageUp(scroller))
      // Each frame shows the page above the end; none goes back to it.
      expect(Math.min(...first)).toBeGreaterThanOrEqual(scroller.clientHeight - 2)
      await quiet()
      const second = await scrollNobodyTouched(scroller, pageUp(scroller))
      expect(Math.min(...second)).toBeGreaterThanOrEqual(scroller.clientHeight * 2 - 2)
      // Unpinned: a reply that comes in leaves the place, and the button to the newest message shows.
      const place = scroller.scrollTop
      await pushReply(server, 'A reply while VoiceOver reads.')
      expect(scroller.scrollTop).toBe(place)
      await expect.poll(() => root.querySelector(`button[aria-label="${label}"]`)).not.toBeNull()
      // The next VoiceOver page comes right after that entry, inside the layout window: the reader has already left
      // the end, so it is not pulled back.
      const third = await scrollNobodyTouched(scroller, pageUp(scroller))
      expect(Math.min(...third)).toBeGreaterThanOrEqual(scroller.clientHeight * 3 - 2)
      const later = scroller.scrollTop
      await pushReply(server, 'Another reply while VoiceOver reads.')
      expect(scroller.scrollTop).toBe(later)
    })
  }

  it('keeps an older entry in view when Find in page scrolls to it, on the desktop', async () => {
    const server = stubLongChats(count)
    const { scroller } = await desktopPane()
    await expect.poll(() => fromEnd(scroller)).toBeLessThanOrEqual(2)
    await expect.poll(() => server.openStreams()).toContain(plan)
    await quiet()
    // Find in page brings a match into view with no input: an early entry's text, put in the pane's middle.
    const match = scroller.querySelectorAll('.markdown-view')[4]
    if (!(match instanceof HTMLElement)) throw new Error('no early entry')
    const frames = await scrollNobodyTouched(scroller, () => {
      match.scrollIntoView({ block: 'center' })
    })
    expect(Math.min(...frames)).toBeGreaterThan(scroller.clientHeight)
    const box = match.getBoundingClientRect()
    const pane = scroller.getBoundingClientRect()
    expect(box.bottom).toBeGreaterThan(pane.top)
    expect(box.top).toBeLessThan(pane.bottom)
    const place = scroller.scrollTop
    await pushReply(server, 'A reply while the owner finds text.')
    expect(scroller.scrollTop).toBe(place)
  })

  it('goes back to the end after a scroll 0.6 s after a cleared draft or a composer resize (R33), and not later, on the phone', async () => {
    const server = stubLongChats(count)
    const { root, scroller } = await phoneChat()
    await expect.poll(() => fromEnd(scroller)).toBeLessThanOrEqual(2)
    await expect.poll(() => server.openStreams()).toContain(plan)
    await quiet()
    // Send clears the draft; iOS scrolled 0.59 s after the cleared draft shrank the composer, with no touch.
    const chat = page.getByRole('region', { name: 'plan the slice' })
    await userEvent.click(chat.getByRole('textbox'))
    await userEvent.keyboard('watch the end after this')
    await userEvent.click(chat.getByRole('button', { name: 'Send', exact: true }))
    await expect.element(chat.getByRole('textbox')).toHaveValue('')
    await expect.poll(() => fromEnd(scroller)).toBeLessThanOrEqual(2)
    await sleep(600)
    const afterSend = await scrollNobodyTouched(scroller, () => {
      scroller.scrollTop = Math.round(scroller.scrollTop / 4)
    })
    expect(Math.max(...afterSend)).toBeLessThanOrEqual(2)
    // The composer collapses as the box loses the focus: its resize moves the layout too.
    await quiet()
    boxIn(root).blur()
    await expect.poll(() => root.querySelector('.composer__root')?.hasAttribute('data-collapsed')).toBe(true)
    await sleep(600)
    const afterCollapse = await scrollNobodyTouched(scroller, () => {
      scroller.scrollTop = Math.round(scroller.scrollTop / 4)
    })
    expect(Math.max(...afterCollapse)).toBeLessThanOrEqual(2)
    // Long after the last layout change, the same scroll is the reader's.
    await quiet()
    const later = await scrollNobodyTouched(scroller, pageUp(scroller))
    expect(Math.min(...later)).toBeGreaterThanOrEqual(scroller.clientHeight - 2)
  })
})
