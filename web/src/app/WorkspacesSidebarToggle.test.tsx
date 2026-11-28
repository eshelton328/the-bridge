import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { resetRetries } from '../errors/retryGuard.ts'
import { fakeSideServer } from '../lib/fakeSideServer.ts'
import { fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { queryClient } from '../lib/queryClient.ts'
import { afterRendering, setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { markApp } from './appMarker.ts'
import { routeTree } from './routeTree.gen.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'

// The desktop's sidebar Hide and Show (NCC-175) mount the chat's pane again: D2's chat alone, D1's workbench panes.
// The pane's watch and place outlive it for the remount grace (lib/remountGrace.ts), so a toggle reads nothing and
// keeps the reader's place. The setup is WorkspacesTranscriptScroll.test.tsx's.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'

const summary = (id: string, title: string) => {
  const model = { model: 'claude-opus-5-5', contextUsed: null, modelId: null, effort: null }
  return { id, kind: 'claude' as const, title, ...model, pane: `${id}-pane`, status: 'working' as const, parent: null }
}
// One workspace whose tab holds both chats side by side (lib/fakeWorkspacesServer.ts).
const chats = [summary(plan, 'plan the slice'), summary(review, 'review notes')]
const list = { machine: 'mac-mini', workspaces: [{ id: 'mac-mini/w-live', label: 'live work', chats }] }

const user = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })
const reply = (id: string, text: string): TranscriptEntry => ({ type: 'assistant', id, text, cut: false })

const sentence = 'The build reads each file again and checks it. '

/** A transcript many screens long: 40 messages, each with a reply of a few lines. */
const long = (tag: string): TranscriptEntry[] =>
  Array.from({ length: 40 }, (_, i) => [
    user(`${tag}-u${String(i)}`, `${tag} question ${String(i)}`),
    reply(`${tag}-a${String(i)}`, `${tag} answer ${String(i)}. ${sentence.repeat(4)}`),
  ]).flat()

/** The side question fake of the test that runs now (lib/fakeSideServer.ts). */
let side = fakeSideServer()

/** The stubbed server, where the review chat and, unless `planEntries` is given, the plan chat have a long transcript. */
function withLong(planEntries = long('plan')) {
  const server = fakeTranscriptServer()
  server.set(plan, planEntries)
  server.set(review, long('review'))
  const workspaces = fakeWorkspacesServer(server, list)
  side = fakeSideServer()
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const answer = side.handle(path, init) ?? server.handle(path, init) ?? workspaces.handle(path, init)
      return answer === undefined ? Promise.reject(new TypeError(`no stub for ${url}`)) : Promise.resolve(answer)
    }),
  )
  return server
}

let view: { unmount: () => Promise<void> } | undefined

// A read after a test ended gets the stub or no answer, never this machine's server.
stubLiveServer()
answerLateServerReads()

afterEach(async () => {
  await view?.unmount()
  view = undefined
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  resetRetries()
  queryClient.clear()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

/**
 * Opens the app on the desktop, taps Workspaces in the rail and waits for the plan chat alone. `#root` and the app
 * marker give the app the window's height, as main.ts does, so a transcript scrolls in its own box.
 */
async function tapWorkspaces() {
  await setViewport(1512, 982)
  const before = new Set(document.body.children)
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
  view = await testRender(<RouterProvider router={router} />)
  const container = [...document.body.children].find((child) => !before.has(child))
  if (container === undefined) throw new Error('no view container')
  container.id = 'root'
  onTestFinished(markApp())
  onTestFinished(() => {
    container.removeAttribute('id')
  })
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  await expect.element(page.getByRole('region', { name: 'plan the slice' })).toBeVisible()
}

/** Shows the desktop workbench with no sidebar and returns the transcript scroller of the pane of `title`. */
function paneScroller(title: string): HTMLElement {
  const pane = page
    .getByRole('button', { name: `Maximise ${title}`, exact: true })
    .element()
    .closest('[data-figma]')
  if (pane === null) throw new Error(`no pane for ${title}`)
  return scrollerIn(pane)
}

function scrollerIn(el: Element): HTMLElement {
  const body = el.querySelector('.scroll-frame__body')
  if (!(body instanceof HTMLElement)) throw new Error('no transcript scroller')
  return body
}

/** Scrolls `el` to `top` as the reader does (a wheel turn first, as usePinnedEnd asks), and waits for the event. */
async function scrollUp(el: HTMLElement, top = 0) {
  const scrolled = new Promise((resolve) => {
    el.addEventListener('scroll', resolve, { once: true })
  })
  el.dispatchEvent(new WheelEvent('wheel', { deltaY: -400, bubbles: true }))
  el.scrollTop = top
  await scrolled
  await afterRendering()
}

/** The first entry of `scroller` whose bottom is below the view's top, by its text. */
function firstShown(scroller: HTMLElement): string {
  const top = scroller.getBoundingClientRect().top
  const entry = [...scroller.children].find((child) => child.getBoundingClientRect().bottom > top + 1)
  return entry?.textContent.slice(0, 40) ?? ''
}

/** The transcript scroller of the chat `title` shown alone beside the sidebar. */
const aloneScroller = (title: string) => scrollerIn(page.getByRole('region', { name: title }).element())

const hide = () => userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
const show = () => userEvent.click(page.getByRole('button', { name: 'Show the workspace sidebar' }))

/** The open side chat, beside the chat (D2) or inside its pane (D5), and its transcript scroller. */
const sidePanel = () => page.getByRole('complementary', { name: 'Side chat' })
const sideScroller = () => scrollerIn(sidePanel().element())

/** Asks the plan chat's open side chat `question`, and the fake answers it with `answer`. */
async function askSide(question: string, answer: string) {
  const asked = side.sides.length + 1
  await userEvent.fill(sidePanel().getByRole('textbox', { name: 'Ask a side question' }), question)
  await userEvent.click(sidePanel().getByRole('button', { name: 'Send', exact: true }))
  await expect.poll(() => side.sides.length).toBe(asked)
  const id = side.sides.at(-1)
  if (id === undefined) throw new Error('no side answer')
  side.change(id, { text: answer, state: 'done' })
  await expect.poll(() => sideScroller().textContent.includes(answer.slice(0, 40))).toBe(true)
  // The next question goes only once the page has the answer's end: Send, not Stop.
  await expect.element(sidePanel().getByRole('button', { name: 'Stop' })).not.toBeInTheDocument()
}

describe('the desktop sidebar toggle (NCC-175)', () => {
  it('opens no transcript stream and reads no transcript of the shown chat on Hide and Show', async () => {
    const server = withLong()
    await tapWorkspaces()
    const alone = aloneScroller('plan the slice')
    await expect.poll(() => alone.scrollHeight > alone.clientHeight * 2).toBe(true)
    const of = (list: readonly string[]) => list.filter((chat) => chat === plan).length
    const before = { reads: of(server.reads), opens: of(server.opens) }
    expect(before).toEqual({ reads: 1, opens: 1 })
    await hide()
    await expect.element(page.getByRole('button', { name: 'Maximise plan the slice' })).toBeVisible()
    await show()
    await expect.element(page.getByRole('region', { name: 'plan the slice' })).toBeVisible()
    await afterRendering()
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect({ reads: of(server.reads), opens: of(server.opens) }).toEqual(before)
    expect(getReports()).toEqual([])
  })

  it('keeps a reader 2 screens above the end at the same entry through Hide and Show', async () => {
    withLong()
    await tapWorkspaces()
    const alone = aloneScroller('plan the slice')
    await expect.poll(() => alone.scrollHeight > alone.clientHeight * 4).toBe(true)
    await scrollUp(alone, alone.scrollHeight - alone.clientHeight * 3)
    const place = firstShown(alone)
    expect(place).not.toBe('')
    await hide()
    await expect.element(page.getByRole('button', { name: 'Maximise plan the slice' })).toBeVisible()
    await afterRendering()
    expect(firstShown(paneScroller('plan the slice'))).toBe(place)
    await show()
    await expect.element(page.getByRole('region', { name: 'plan the slice' })).toBeVisible()
    await afterRendering()
    expect(firstShown(aloneScroller('plan the slice'))).toBe(place)
    expect(getReports()).toEqual([])
  })

  it('keeps a reader of a side chat at the same entry when Hide moves it into its pane, under its note', async () => {
    withLong()
    await tapWorkspaces()
    await userEvent.click(page.getByRole('button', { name: 'plan the slice actions' }).first())
    await userEvent.click(page.getByRole('menuitem', { name: 'Side chat (/btw)', exact: true }))
    const long = (n: number) => `Side answer ${String(n)}. ${'The check reads the frame again. '.repeat(40)}`
    for (const n of [1, 2, 3, 4]) await askSide(`Side question ${String(n)}?`, long(n))
    const beside = sideScroller()
    await expect.poll(() => beside.scrollHeight > beside.clientHeight * 3).toBe(true)
    // A short question first in view: one entry off would show the long answer before it.
    const third = [...beside.children].find((child) => child.textContent.includes('Side question 3?'))
    if (!(third instanceof HTMLElement)) throw new Error('no third question')
    const thirdTop = third.getBoundingClientRect().top - beside.getBoundingClientRect().top
    await scrollUp(beside, beside.scrollTop + thirdTop + 5)
    const place = firstShown(beside)
    expect(place).toContain('Side question 3?')
    await hide()
    await expect.element(page.getByRole('button', { name: 'Maximise plan the slice' })).toBeVisible()
    await afterRendering()
    // In the pane the side chat's note scrolls with its transcript, as its first child (D5).
    expect(firstShown(sideScroller())).toBe(place)
    expect(getReports()).toEqual([])
  })

  it('follows new entries after Show when the larger pane brings a reader back to the end', async () => {
    // One reply of about 20 lines in a workbench pane and 13 beside the sidebar.
    const server = withLong([
      user('plan-u0', 'plan question 0'),
      reply('plan-a0', `plan answer 0. ${sentence.repeat(100)}`),
    ])
    await tapWorkspaces()
    const alone = aloneScroller('plan the slice')
    await expect.poll(() => alone.textContent.includes('plan answer 0.')).toBe(true)
    await afterRendering()
    // Beside the sidebar the chat fits, so it is at its end.
    expect(alone.scrollHeight - alone.clientHeight).toBeLessThanOrEqual(2)
    await hide()
    await expect.element(page.getByRole('button', { name: 'Maximise plan the slice' })).toBeVisible()
    await afterRendering()
    const inPane = paneScroller('plan the slice')
    // In the workbench's narrower pane the same reply scrolls.
    expect(inPane.scrollHeight - inPane.clientHeight).toBeGreaterThan(100)
    await scrollUp(inPane, 0)
    await show()
    await expect.element(page.getByRole('region', { name: 'plan the slice' })).toBeVisible()
    await afterRendering()
    const shown = aloneScroller('plan the slice')
    server.push(plan, [reply('plan-new', `plan new answer. ${sentence.repeat(30)}`)])
    await expect.element(page.getByText('plan new answer.', { exact: false })).toBeInTheDocument()
    await afterRendering()
    await expect.poll(() => shown.scrollHeight - shown.scrollTop - shown.clientHeight).toBeLessThanOrEqual(2)
    expect(getReports()).toEqual([])
  })
})
