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

// A live chat's transcript opens at its newest entry and stays there as
// entries come in, unless the reader scrolled up (usePinnedEnd); its messages
// and replies render as Markdown, with HTML kept as text (EntryText). Each
// test takes the owner's path: it opens the app with no URL parameters, taps
// Workspaces and a live chat (the phone and the tablet) or shows the
// workbench's panes (the desktop), with a stubbed server whose transcript
// routes are the contract-checked fake (lib/fakeTranscriptServer.ts).
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

/** Taps the live chat `title` in the list (the phone or the tablet) and returns its transcript's scroller. */
async function tapChat(title: string): Promise<HTMLElement> {
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
  return scrollerIn(page.getByRole('region', { name: title }).element())
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

/** The scroller's distance from its end, in px. */
const fromEnd = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight

/** Waits until `el` scrolls (its transcript is longer than its box) and sits at its end. */
async function expectAtEnd(el: HTMLElement) {
  await expect.poll(() => el.scrollHeight > el.clientHeight * 2).toBe(true)
  await expect.poll(() => fromEnd(el)).toBeLessThanOrEqual(2)
  expect(el.scrollTop).toBeGreaterThan(0)
}

/** Scrolls `el` up to its top, as the reader does, and waits for the scroll event. */
async function scrollUp(el: HTMLElement) {
  const scrolled = new Promise((resolve) => {
    el.addEventListener('scroll', resolve, { once: true })
  })
  el.scrollTop = 0
  await scrolled
  await afterRendering()
}

const devices = [
  { name: 'the phone', size: [390, 844] },
  { name: 'the tablet', size: [756, 1129] },
] as const

describe("a live chat's transcript scroll", () => {
  for (const device of devices) {
    it(`opens a long transcript at its newest entry on ${device.name}`, async () => {
      withLong()
      await tapWorkspaces(device.size)
      const scroller = await tapChat('plan the slice')
      await expect.element(page.getByText('plan question 39', { exact: true })).toBeInTheDocument()
      await expectAtEnd(scroller)
      expect(getReports()).toEqual([])
    })

    it(`keeps a pushed entry in view at the end, and the reader's place after a scroll up, on ${device.name}`, async () => {
      const server = withLong()
      await tapWorkspaces(device.size)
      const scroller = await tapChat('plan the slice')
      await expectAtEnd(scroller)
      await expect.poll(() => server.openStreams()).toEqual([plan])
      server.push(plan, [reply('pushed-1', `The build passes. ${'Each check ran green. '.repeat(8)}`)])
      await expect.element(page.getByText(/^The build passes\./)).toBeInTheDocument()
      await expectAtEnd(scroller)
      // The reader scrolls up: a pushed entry leaves the view where it is.
      await scrollUp(scroller)
      server.push(plan, [reply('pushed-2', 'A second reply.')])
      await expect.element(page.getByText('A second reply.')).toBeInTheDocument()
      await afterRendering()
      expect(scroller.scrollTop).toBe(0)
      // Back at the end, it follows again.
      scroller.scrollTop = scroller.scrollHeight
      await expect.poll(() => fromEnd(scroller)).toBeLessThanOrEqual(2)
      await afterRendering()
      server.push(plan, [reply('pushed-3', `A third reply. ${'More text here. '.repeat(10)}`)])
      await expect.element(page.getByText(/^A third reply\./)).toBeInTheDocument()
      await expectAtEnd(scroller)
    })
  }

  it('opens at the newest entry when the transcript read answers after the stream opened, on the phone', async () => {
    let answer: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      answer = resolve
    })
    const server = withLong(gate)
    await tapWorkspaces([390, 844])
    const scroller = await tapChat('plan the slice')
    await expect.poll(() => server.openStreams()).toEqual([plan])
    await afterRendering()
    answer()
    await expect.element(page.getByText('plan question 39', { exact: true })).toBeInTheDocument()
    await expectAtEnd(scroller)
  })

  it('opens each workbench pane at its newest entry and keeps each pane on its own, on the desktop', async () => {
    const server = withLong()
    await tapWorkspaces([1512, 982])
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(page.getByText('plan question 39', { exact: true })).toBeInTheDocument()
    await expect.element(page.getByText('review question 39', { exact: true })).toBeInTheDocument()
    const planPane = paneScroller('plan the slice')
    const reviewPane = paneScroller('review notes')
    await expectAtEnd(planPane)
    await expectAtEnd(reviewPane)
    await expect.poll(() => [...server.openStreams()].sort()).toEqual([plan, review])
    // The reader scrolls the plan pane up; a push to each pane moves only the review pane, which stays at its end.
    await scrollUp(planPane)
    server.push(plan, [reply('pushed-p', 'Plan moved on.')])
    server.push(review, [reply('pushed-r', `Review moved on. ${'Two notes need a source. '.repeat(8)}`)])
    await expect.element(page.getByText('Plan moved on.')).toBeInTheDocument()
    await expect.element(page.getByText(/^Review moved on\./)).toBeInTheDocument()
    await expectAtEnd(reviewPane)
    expect(planPane.scrollTop).toBe(0)
  })
})

describe("a live chat's Markdown", () => {
  it('renders **bold** as strong text, keeps HTML as text and drops a javascript: link, on the phone', async () => {
    const server = fakeTranscriptServer()
    server.set(plan, [
      user('u1', 'Make **this** bold and keep <b>x</b> as text'),
      reply('a1', 'The **build** passes. [Run it](javascript:alert(1)) or see [the log](https://example.com/log).'),
    ])
    fakeServer(server)
    await tapWorkspaces([390, 844])
    await tapChat('plan the slice')
    const chat = page.getByRole('region', { name: 'plan the slice' })
    await expect.element(chat.getByText('build', { exact: true })).toBeVisible()
    const region = chat.element()
    expect([...region.querySelectorAll('strong')].map((el) => el.textContent)).toEqual(['this', 'build'])
    // HTML stays text: the tags show and no element is made from them.
    expect(region.textContent).toContain('<b>x</b>')
    expect(region.querySelector('b')).toBeNull()
    // The text keeps the message's colour, not MarkdownView's muted body text.
    for (const text of region.querySelectorAll('.markdown-view')) {
      const body = text.closest('.message__body')
      if (body === null) throw new Error('Markdown outside a message')
      expect(getComputedStyle(text).color).toBe(getComputedStyle(body).color)
    }
    expect(region.querySelectorAll('.markdown-view')).toHaveLength(2)
    // A link keeps only a safe URL.
    const links = [...region.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')])
    expect(links).toContainEqual(['the log', 'https://example.com/log'])
    for (const [, href] of links) expect(href ?? '').not.toMatch(/^javascript:/i)
    expect(getReports()).toEqual([])
  })
})
