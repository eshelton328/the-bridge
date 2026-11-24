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

// A reply that a Stop hook sent back (R62, the owner: "duplicate output. this
// is a big no no"). The chat writes the reply again, and the server marks the
// draft with `replacedBy` (backend #470). A draft whose rewrite is in the
// transcript does not show as a reply of its own: the rewrite carries a
// "Reply rewritten" note, and a tap on it shows the draft. A draft whose
// rewrite has not come shows as a reply; when the rewrite comes, the draft
// folds away, the end pin holds, and a reader above the end keeps his place.
// Each test takes the owner's path: it opens the app with no URL parameters,
// taps Workspaces and the live chat (the phone, the tablet) or shows the
// workbench's pane (the desktop), with a stubbed server whose transcript
// routes are the contract-checked fake (lib/fakeTranscriptServer.ts).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const chats = [
  {
    id: plan,
    kind: 'claude',
    title: 'plan the slice',
    model: 'claude-opus-5-5',
    contextUsed: null,
    modelId: null,
    effort: null,
    pane: `${plan}-pane`,
    status: 'working',
    parent: null,
  },
]
const layout = JSON.stringify({
  workspace,
  tabs: [
    {
      id: 'mac-mini/w-live:t1',
      label: 'main',
      active: true,
      root: { kind: 'pane', chat: plan },
      focusedChat: plan,
      zoomed: false,
      chats,
    },
  ],
})

/** The stubbed server: the workspaces, their layout, the event stream and the transcript fake's routes. */
function fakeServer(transcripts: FakeTranscriptServer) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const transcript = transcripts.handle(path, init)
      if (transcript !== undefined) return Promise.resolve(transcript)
      if (path === '/api/workspaces')
        return Promise.resolve(
          new Response(
            JSON.stringify({ machine: 'mac-mini', workspaces: [{ id: workspace, label: 'live work', chats }] }),
            { status: 200 },
          ),
        )
      if (path === `/api/workspaces/${encodeURIComponent(workspace)}/layout`)
        return Promise.resolve(new Response(layout, { status: 200 }))
      if (path === '/api/events') {
        const body = new ReadableStream<Uint8Array>({
          start: (control) => {
            control.enqueue(new TextEncoder().encode('event: open\nretry: 200\ndata: {}\n\n'))
          },
        })
        return Promise.resolve(new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } }))
      }
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
}

let view: { unmount: () => Promise<void> } | undefined

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
 * Opens the app at `size` and taps Workspaces; the URL has no parameters. The app gets the window's height, as
 * main.ts gives it (the marker on <html> and `#root`), so a transcript scrolls in its own box.
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

/** Opens the chat on the phone or the tablet (a tap on its row) or the desktop (no sidebar); returns its region. */
async function openChat(size: readonly [number, number]): Promise<Element> {
  await tapWorkspaces(size)
  if (size[0] > 1000) {
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    const maximise = page.getByRole('button', { name: 'Maximise plan the slice', exact: true })
    await expect.element(maximise).toBeInTheDocument()
    const pane = maximise.element().closest('[data-figma]')
    if (pane === null) throw new Error('no pane')
    return pane
  }
  await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
  return page.getByRole('region', { name: 'plan the slice' }).element()
}

function scrollerIn(el: Element): HTMLElement {
  const body = el.querySelector('.scroll-frame__body')
  if (!(body instanceof HTMLElement)) throw new Error('no transcript scroller')
  return body
}

const user = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })
const reply = (id: string, text: string, replacedBy?: string): TranscriptEntry => ({
  type: 'assistant',
  id,
  text,
  cut: false,
  ...(replacedBy === undefined ? {} : { replacedBy }),
})
const hook: TranscriptEntry = { type: 'note', id: 'n-hook', kind: 'hook', text: 'Stop hook: reply rewritten' }
const tool = (id: string): TranscriptEntry => ({ type: 'tool', id, name: 'Bash', target: 'pnpm', running: false })

const draftText = 'Draft answer 7 lists four steps.'
const rewriteText = 'Rewritten answer 7 lists three steps.'
const draft = (replacedBy?: string) =>
  reply('a-draft', `${draftText} ${'The first pass reads each file. '.repeat(6)}`, replacedBy)
const rewrite = reply('a-rewrite', rewriteText)

/** A transcript several screens long: 30 messages, each with a reply of a few lines. */
const long: TranscriptEntry[] = Array.from({ length: 30 }, (_, i) => [
  user(`u${String(i)}`, `question ${String(i)}`),
  reply(`a${String(i)}`, `answer ${String(i)}. ${'The build reads each file again and checks it. '.repeat(4)}`),
]).flat()

/** The transcript fake with plan's transcript as `entries`. */
function withPlan(entries: TranscriptEntry[]) {
  const server = fakeTranscriptServer()
  server.set(plan, entries)
  fakeServer(server)
  return server
}

/** The replies (library Message roots) in `scope` whose text holds `text`. */
const repliesWith = (scope: Element, text: string) =>
  [...scope.querySelectorAll('article.message__root')].filter((m) => m.textContent.includes(text))

const fromEnd = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight

/** The transcript entry nearest the top of `el`'s view and how far below the view's top it starts, in px. */
function firstShown(el: HTMLElement): { entry: Element; offset: number } {
  const top = el.getBoundingClientRect().top
  for (const child of el.children) {
    const box = child.getBoundingClientRect()
    if (box.bottom > top + 1) return { entry: child, offset: box.top - top }
  }
  throw new Error('no entry in view')
}

const devices = [
  { name: 'the phone', size: [390, 844] },
  { name: 'the tablet', size: [756, 1129] },
  { name: 'the desktop', size: [1512, 982] },
] as const

describe('a reply that a Stop hook had written again (R62)', () => {
  for (const device of devices)
    it(`shows the rewrite once, with a note whose tap shows the draft, on ${device.name}`, async () => {
      withPlan([user('u1', 'question 7'), draft('a-rewrite'), hook, rewrite])
      const chat = await openChat(device.size)
      await expect.element(page.getByText(rewriteText)).toBeVisible()
      // The draft is not a reply of its own: only the rewrite shows, once.
      expect(repliesWith(chat, draftText)).toEqual([])
      expect(repliesWith(chat, rewriteText)).toHaveLength(1)
      const note = page.getByRole('button', { name: 'Reply rewritten' })
      await expect.element(note).toBeVisible()
      await expect.element(note).toHaveAttribute('aria-expanded', 'false')
      // The note sits on the rewrite.
      expect(repliesWith(chat, rewriteText)[0]?.contains(note.element())).toBe(true)
      // A tap shows the draft under the rewrite; a second tap hides it.
      await userEvent.click(note)
      await expect.element(note).toHaveAttribute('aria-expanded', 'true')
      const drafts = page.getByRole('group', { name: 'Reply rewritten' })
      await expect.element(drafts.getByText(draftText, { exact: false })).toBeVisible()
      expect(note.element().getAttribute('aria-controls')).toBe(drafts.element().id)
      await userEvent.click(note)
      await expect.element(note).toHaveAttribute('aria-expanded', 'false')
      expect(chat.textContent).not.toContain(draftText)
      expect(getReports()).toEqual([])
    })

  it('shows the draft as a reply until its rewrite comes, then folds it and keeps the end, on the phone', async () => {
    const server = withPlan([...long, user('u-last', 'question 7'), draft('a-rewrite'), hook])
    const chat = await openChat([390, 844])
    const scroller = scrollerIn(chat)
    await expect.element(page.getByText(draftText, { exact: false })).toBeVisible()
    // The rewrite is not there: the draft is a reply, with no note.
    expect(repliesWith(chat, draftText)).toHaveLength(1)
    expect(chat.querySelector('[data-rewritten-note]')).toBeNull()
    await expect.poll(() => fromEnd(scroller)).toBeLessThanOrEqual(2)
    await expect.poll(() => server.openStreams()).toEqual([plan])
    server.push(plan, [rewrite])
    await expect.element(page.getByText(rewriteText)).toBeVisible()
    expect(repliesWith(chat, draftText)).toEqual([])
    await expect.element(page.getByRole('button', { name: 'Reply rewritten' })).toBeVisible()
    await afterRendering()
    expect(fromEnd(scroller)).toBeLessThanOrEqual(2)
    expect(getReports()).toEqual([])
  })

  for (const device of devices)
    it(`folds a draft above a reader who scrolled up without moving what he reads, on ${device.name}`, async () => {
      // The draft, the hook's note, then the calls of the rewrite's turn: the reader reads those calls.
      const calls = Array.from({ length: 60 }, (_, i) => tool(`t${String(i)}`))
      const server = withPlan([...long, user('u-last', 'question 7'), draft(), hook, ...calls])
      const chat = await openChat(device.size)
      const scroller = scrollerIn(chat)
      await expect.element(page.getByText(draftText, { exact: false })).toBeInTheDocument()
      await expect.poll(() => fromEnd(scroller)).toBeLessThanOrEqual(2)
      await expect.poll(() => server.openStreams()).toEqual([plan])
      // Safari keeps no place by itself; Chromium's scroll anchoring is off, so the page's own keeps it.
      scroller.classList.add('no-anchor-test')
      const sheet = document.createElement('style')
      sheet.textContent = '.no-anchor-test { overflow-anchor: none; }'
      document.head.append(sheet)
      onTestFinished(() => {
        sheet.remove()
      })
      // The reader scrolls up to the calls: the draft is above his view, and the end is more than a screen below.
      const draftEntry = repliesWith(chat, draftText)[0]?.closest('.scroll-frame__body > *')
      if (!(draftEntry instanceof HTMLElement)) throw new Error('no draft entry')
      const scrolled = new Promise((resolve) => {
        scroller.addEventListener('scroll', resolve, { once: true })
      })
      scroller.dispatchEvent(new WheelEvent('wheel', { deltaY: -400, bubbles: true }))
      scroller.scrollTop += draftEntry.getBoundingClientRect().bottom - scroller.getBoundingClientRect().top + 40
      await scrolled
      await afterRendering()
      expect(draftEntry.getBoundingClientRect().bottom).toBeLessThan(scroller.getBoundingClientRect().top)
      expect(fromEnd(scroller)).toBeGreaterThan(2)
      const before = firstShown(scroller)
      // The rewrite comes: the server marks the draft and sends the reply.
      server.push(plan, [draft('a-rewrite'), rewrite])
      await expect.element(page.getByRole('button', { name: 'Reply rewritten' })).toBeInTheDocument()
      expect(repliesWith(chat, draftText)).toEqual([])
      await afterRendering()
      const after = firstShown(scroller)
      expect(after.entry).toBe(before.entry)
      expect(Math.abs(after.offset - before.offset)).toBeLessThanOrEqual(1)
      // The reader stays where he was: no pull to the end.
      expect(fromEnd(scroller)).toBeGreaterThan(2)
      expect(getReports()).toEqual([])
    })

  it("keeps the reader's own scroll when an entry changes before its scroll event, on the phone", async () => {
    const server = withPlan(long)
    const chat = await openChat([390, 844])
    const scroller = scrollerIn(chat)
    await expect.element(page.getByText('question 29', { exact: true })).toBeInTheDocument()
    await expect.poll(() => fromEnd(scroller)).toBeLessThanOrEqual(2)
    await expect.poll(() => server.openStreams()).toEqual([plan])
    // The reader scrolls up to the middle of the transcript.
    const scrolled = new Promise((resolve) => {
      scroller.addEventListener('scroll', resolve, { once: true })
    })
    scroller.dispatchEvent(new WheelEvent('wheel', { deltaY: -400, bubbles: true }))
    scroller.scrollTop = scroller.scrollHeight / 2
    await scrolled
    await afterRendering()
    // He scrolls 120 further up, and an entry changes (a streamed word) before that scroll's event comes.
    scroller.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }))
    const goal = scroller.scrollTop - 120
    scroller.scrollTop = goal
    const last = scroller.lastElementChild?.previousElementSibling
    if (last === null || last === undefined) throw new Error('no entry')
    last.append(document.createTextNode(''))
    await afterRendering()
    expect(Math.abs(scroller.scrollTop - goal)).toBeLessThanOrEqual(1)
    expect(getReports()).toEqual([])
  })
})
