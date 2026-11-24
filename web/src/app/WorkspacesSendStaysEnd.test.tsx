import type { TranscriptEntry } from '@bridge/contract'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { resetRetries } from '../errors/retryGuard.ts'
import { queryClient } from '../lib/queryClient.ts'
import { afterRendering, setViewport } from '../lib/rendering.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { boxIn, markdownShown, openWorkspaces, stubLongChats } from './longLiveChat.ts'
import { stubLiveServer } from './liveServerStub.ts'

// Screen review R61: "after i sent that message it's like i scrolled way up
// and had to press the down button". The served build's keyboard traces show
// Send, then about a second later a tap on the transcript, which closes the
// keyboard (the library's ScrollFrame does on a tap that is not on a
// control) and gives the transcript's body the focus. usePinnedEnd took that
// focus for the reader's input, so the scroll iOS makes with no touch when
// the keyboard closes (R33) left the end, and the button to the newest
// message showed. The decision (bridge-coord): after the owner's own send the
// list stays at the end, and the button never shows for it. Each test takes
// the owner's path: the app with no URL parameters, Workspaces, a long live
// chat (over the 500-entry cap) at the phone's 390 px, text typed, with and
// without an image attached, Send; then the tap on the transcript, the
// keyboard's close, the iOS scroll, the owner's entry and the reply. Each
// frame from Send to the reply is at the end, within 2 px, with no button.
const plan = 'mac-mini/c1'
const title = 'plan the slice'
const label = 'Scroll to the newest message'
/** Entries in the chat: over the 500 the page keeps, as in the owner's long chats. */
const count = 600
const text = 'this is a test prompt please ignore the screenshot'
const replyText = 'OK. I ignore this message and its screenshot.'

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

const fromEnd = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight

function scrollerIn(root: Element): HTMLElement {
  const body = root.querySelector('.scroll-frame__body')
  if (!(body instanceof HTMLElement)) throw new Error('no transcript scroller')
  return body
}

/** Records, in each frame until the returned stop, how far from the end `el` is and whether the button shows. */
function watchFrames(el: HTMLElement, root: Element) {
  const seen: { fromEnd: number; button: boolean }[] = []
  let watching = true
  const step = () => {
    if (!watching) return
    seen.push({ fromEnd: fromEnd(el), button: root.querySelector(`button[aria-label="${label}"]`) !== null })
    requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
  return () => {
    watching = false
    return seen
  }
}

/**
 * A finger's tap on `target` in the transcript `scroller`, as iOS sends it: the touch and pointer events of a touch
 * that does not move, then the click's focus, which goes to the nearest element that takes it, the transcript's body.
 */
function tap(target: HTMLElement, scroller: HTMLElement) {
  const box = target.getBoundingClientRect()
  const finger = new Touch({ identifier: 1, target, clientX: box.left + 8, clientY: box.top + 8 })
  const at = { bubbles: true, pointerType: 'touch', clientX: finger.clientX, clientY: finger.clientY }
  target.dispatchEvent(new PointerEvent('pointerdown', at))
  target.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [finger], changedTouches: [finger] }))
  target.dispatchEvent(new PointerEvent('pointerup', at))
  target.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [finger] }))
  scroller.focus({ preventScroll: true })
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: finger.clientX, clientY: finger.clientY }))
}

const cases = [
  { name: 'with an image attached', image: true },
  { name: 'with text only', image: false },
] as const

describe("the end of a long live chat after the owner's own send (R61)", () => {
  for (const sent of cases)
    it(`stays at the end, with no button, through a tap that closes the keyboard and the reply, ${sent.name}, on the phone`, async () => {
      const server = stubLongChats(count)
      vi.stubGlobal('XMLHttpRequest', server.uploads.XMLHttpRequest)
      view = await openWorkspaces([390, 844])
      await userEvent.click(page.getByText(title, { exact: true }).first())
      await markdownShown(500)
      const chat = page.getByRole('region', { name: title })
      const root = chat.element()
      const scroller = scrollerIn(root)
      await expect.poll(() => scroller.scrollHeight > scroller.clientHeight * 3).toBe(true)
      await expect.poll(() => fromEnd(scroller)).toBeLessThanOrEqual(2)
      await expect.poll(() => server.openStreams()).toContain(plan)
      // This visit's own read answered: the send starts from it.
      await expect.poll(() => server.reads).toContain(plan)
      if (sent.image) {
        const input = root.querySelector('input[type="file"]')
        if (!(input instanceof HTMLInputElement)) throw new Error('no file input')
        await userEvent.upload(input, [new File(['abcdefghij'], 'IMG_4898.png', { type: 'image/png' })])
        await expect.element(chat.getByRole('button', { name: 'Remove IMG_4898.png' })).toBeVisible()
      }
      await userEvent.click(boxIn(root))
      await userEvent.keyboard(text)
      await expect.element(chat.getByRole('button', { name: 'Send', exact: true })).toBeEnabled()
      const stop = watchFrames(scroller, root)
      await userEvent.click(chat.getByRole('button', { name: 'Send', exact: true }))
      await expect.poll(() => server.prompts.length).toBe(1)
      // A second later the owner taps the transcript, off any control: the keyboard closes and the body takes the focus.
      const paragraphs = scroller.querySelectorAll('.markdown-view p')
      const tapped = paragraphs[paragraphs.length - 1]
      if (!(tapped instanceof HTMLElement)) throw new Error('no paragraph in view')
      tap(tapped, scroller)
      await afterRendering()
      expect(document.activeElement).toBe(scroller)
      window.dispatchEvent(new Event('resize'))
      // The scroll iOS makes with no touch as the keyboard closes: a long way up.
      const strayed = new Promise((resolve) => {
        scroller.addEventListener('scroll', resolve, { once: true })
      })
      scroller.scrollTop = Math.round(scroller.scrollTop / 4)
      await strayed
      // The stream brings the owner's entry, then the reply.
      // The entry holds the text the server took, with an ID no earlier read or test held.
      const took = server.prompts[0]?.text ?? ''
      const id = `r61-sent-${sent.image ? 'image' : 'text'}`
      server.push(plan, [
        sent.image
          ? { type: 'user', id, text: took, cut: false, files: ['IMG_4898.png'] }
          : { type: 'user', id, text: took, cut: false },
      ] satisfies TranscriptEntry[])
      await expect.poll(() => root.querySelectorAll('[data-pending-send]').length).toBe(0)
      server.push(plan, [{ type: 'assistant', id: 'reply-1', text: replyText, cut: false }])
      await expect.element(chat.getByText(replyText)).toBeInTheDocument()
      await new Promise((resolve) => setTimeout(resolve, 300))
      const frames = stop()
      expect(frames.length).toBeGreaterThan(10)
      expect(Math.max(...frames.map((f) => f.fromEnd))).toBeLessThanOrEqual(2)
      expect(frames.some((f) => f.button)).toBe(false)
      expect(fromEnd(scroller)).toBeLessThanOrEqual(2)
      expect(getReports()).toEqual([])
    })

  it("still leaves the end for the reader's own drag after a tap on the transcript, on the phone", async () => {
    const server = stubLongChats(count)
    view = await openWorkspaces([390, 844])
    await userEvent.click(page.getByText(title, { exact: true }).first())
    await markdownShown(500)
    const chat = page.getByRole('region', { name: title })
    const root = chat.element()
    const scroller = scrollerIn(root)
    await expect.poll(() => scroller.scrollHeight > scroller.clientHeight * 3).toBe(true)
    await expect.poll(() => fromEnd(scroller)).toBeLessThanOrEqual(2)
    await expect.poll(() => server.openStreams()).toContain(plan)
    await userEvent.click(boxIn(root))
    await userEvent.keyboard(text)
    await userEvent.click(chat.getByRole('button', { name: 'Send', exact: true }))
    await expect.poll(() => server.prompts.length).toBe(1)
    // The stream brings the owner's entry, which takes the pending bubble's place: no change of the send is still to
    // come and move the transcript during the drag.
    server.push(plan, [{ type: 'user', id: 'r61-sent-drag', text: server.prompts[0]?.text ?? '', cut: false }])
    await expect.poll(() => root.querySelectorAll('[data-pending-send]').length).toBe(0)
    await afterRendering()
    const paragraphs = scroller.querySelectorAll('.markdown-view p')
    const tapped = paragraphs[paragraphs.length - 1]
    if (!(tapped instanceof HTMLElement)) throw new Error('no paragraph in view')
    tap(tapped, scroller)
    await afterRendering()
    expect(document.activeElement).toBe(scroller)
    // Then the owner's finger drags the transcript down a long way, in three moves: his scroll, which leaves the end.
    // The composer closes after the tap; the drag waits until its height holds for a few frames.
    const footer = root.querySelector('.scroll-frame__footer')
    if (!(footer instanceof HTMLElement)) throw new Error('no composer footer')
    await expect
      .poll(async () => {
        const before = footer.offsetHeight
        for (let i = 0; i < 5; i += 1) await afterRendering()
        return footer.offsetHeight === before
      })
      .toBe(true)
    const box = scroller.getBoundingClientRect()
    const finger = (y: number) =>
      new Touch({ identifier: 2, target: scroller, clientX: box.left + 40, clientY: box.top + y })
    scroller.dispatchEvent(
      new TouchEvent('touchstart', { bubbles: true, touches: [finger(100)], changedTouches: [finger(100)] }),
    )
    for (const y of [300, 500, 700]) {
      const moved = new Promise((resolve) => {
        scroller.addEventListener('scroll', resolve, { once: true })
      })
      scroller.dispatchEvent(
        new TouchEvent('touchmove', { bubbles: true, touches: [finger(y)], changedTouches: [finger(y)] }),
      )
      scroller.scrollTop -= scroller.clientHeight
      await moved
      await afterRendering()
    }
    scroller.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [finger(700)] }))
    await afterRendering()
    const place = scroller.scrollTop
    expect(fromEnd(scroller)).toBeGreaterThan(scroller.clientHeight)
    await expect.poll(() => root.querySelector(`button[aria-label="${label}"]`)).not.toBeNull()
    // The reply leaves him where he is.
    server.push(plan, [{ type: 'assistant', id: 'reply-1', text: replyText, cut: false }])
    await expect.element(chat.getByText(replyText)).toBeInTheDocument()
    await afterRendering()
    expect(scroller.scrollTop).toBe(place)
    expect(getReports()).toEqual([])
  })
})
