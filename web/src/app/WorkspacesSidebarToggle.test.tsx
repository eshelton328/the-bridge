import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { clearReports, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { type FakeTranscriptServer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { queryClient } from '../lib/queryClient.ts'
import { afterRendering, setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { markApp } from './appMarker.ts'
import { routeTree } from './routeTree.gen.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'

// The desktop's sidebar Hide and Show (NCC-175): with the sidebar, the focused
// chat shows alone (D2, MainChat); without it, the workbench draws the tab's
// panes (D1). The two are different trees, so the chat's pane mounts again at
// each toggle. Its transcript session and its scroll place outlive the old
// pane for the remount grace (lib/remountGrace.ts), so a toggle opens no
// stream, reads no transcript and keeps the reader's place. The test takes
// the owner's path with the setup of WorkspacesTranscriptScroll.test.tsx.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'

const summary = (id: string, title: string) => ({
  id,
  kind: 'claude',
  title,
  model: 'claude-opus-5-5',
  contextUsed: null,
  modelId: null,
  effort: null,
  pane: `${id}-pane`,
  status: 'working',
  parent: null,
})
const chats = [summary(plan, 'plan the slice'), summary(review, 'review notes')]
const layout = JSON.stringify({
  workspace,
  tabs: [
    {
      id: 'mac-mini/w-live:t1',
      label: 'main',
      active: true,
      root: {
        kind: 'split',
        direction: 'row',
        ratio: 0.5,
        first: { kind: 'pane', chat: plan },
        second: { kind: 'pane', chat: review },
      },
      focusedChat: plan,
      zoomed: false,
      chats,
    },
  ],
})

const user = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })
const reply = (id: string, text: string): TranscriptEntry => ({ type: 'assistant', id, text, cut: false })

/** A transcript many screens long: 40 messages, each with a reply of a few lines. */
const long = (tag: string): TranscriptEntry[] =>
  Array.from({ length: 40 }, (_, i) => [
    user(`${tag}-u${String(i)}`, `${tag} question ${String(i)}`),
    reply(
      `${tag}-a${String(i)}`,
      `${tag} answer ${String(i)}. ${'The build reads each file again and checks it. '.repeat(4)}`,
    ),
  ]).flat()

/**
 * The stubbed server: the workspaces, their layout, the event stream and the transcript fake's routes. While
 * `readGate` is set, each transcript read answers only once it resolves, after the stream opened.
 */
function fakeServer(transcripts: FakeTranscriptServer, readGate?: Promise<void>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      if (readGate !== undefined && /^\/api\/chats\/[^/]+\/transcript$/.test(path)) await readGate
      const transcript = transcripts.handle(path, init)
      if (transcript !== undefined) return transcript
      if (path === '/api/workspaces')
        return new Response(
          JSON.stringify({ machine: 'mac-mini', workspaces: [{ id: workspace, label: 'live work', chats }] }),
          { status: 200 },
        )
      if (path === `/api/workspaces/${encodeURIComponent(workspace)}/layout`)
        return new Response(layout, { status: 200 })
      if (path === '/api/events') {
        const body = new ReadableStream<Uint8Array>({
          start: (control) => {
            control.enqueue(new TextEncoder().encode('event: open\nretry: 200\ndata: {}\n\n'))
          },
        })
        return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } })
      }
      throw new TypeError(`no stub for ${url}`)
    }),
  )
}

/** A transcript fake where both chats have a long transcript. */
function withLong(readGate?: Promise<void>) {
  const server = fakeTranscriptServer()
  server.set(plan, long('plan'))
  server.set(review, long('review'))
  fakeServer(server, readGate)
  return server
}

let view: { unmount: () => Promise<void> } | undefined

// Each test stubs fetch itself; between tests, a read that a page started after its test ended gets the stubbed
// server, never the one on this machine (liveServerStub.ts).
stubLiveServer()

// A read that a page starts after its test ended gets no answer, not the real server (lib/lateServerReads.ts).
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
 * Opens the app at `size` and taps Workspaces in the rail or the tab bar; the URL has no parameters. The app gets the
 * window's height, as main.ts gives it: the marker on <html> and `#root` on the view's container, which index.css fixes
 * to the window, so a transcript scrolls in its own box (testRender's container alone is as high as its content).
 */
async function tapWorkspaces(size: readonly [number, number]) {
  await setViewport(size[0], size[1])
  const before = new Set(document.body.children)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    defaultErrorComponent: RouteError,
  })
  view = await testRender(
    <>
      <RouterProvider router={router} />
      <ErrorTray />
    </>,
    rootErrorOptions,
  )
  const container = [...document.body.children].find((child) => !before.has(child))
  if (container === undefined) throw new Error('no view container')
  container.id = 'root'
  onTestFinished(markApp())
  onTestFinished(() => {
    container.removeAttribute('id')
  })
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  expect(router.state.location.searchStr).toBe('')
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

/**
 * Scrolls `el` to `top` as the reader does, with a wheel turn on the transcript first (usePinnedEnd leaves the end
 * only for the reader's scroll), and waits for the scroll event.
 */
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

const desktop = [1512, 982] as const

describe('the desktop sidebar toggle (NCC-175)', () => {
  it('opens no transcript stream and reads no transcript of the shown chat on Hide and Show', async () => {
    const server = withLong()
    await tapWorkspaces(desktop)
    await expect.element(page.getByRole('region', { name: 'plan the slice' })).toBeVisible()
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
    await tapWorkspaces(desktop)
    await expect.element(page.getByRole('region', { name: 'plan the slice' })).toBeVisible()
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
})
