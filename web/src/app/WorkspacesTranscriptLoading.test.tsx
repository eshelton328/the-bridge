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
import { clickNow, holdTimers } from '../lib/holdTimers.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { afterRendering, renderedUntil, setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { markApp } from './appMarker.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// A live chat while its transcript loads (bridge-coord's decisions of 2026-11-23, on the owner's "How should we
// handle chats as they load"). Each test takes the owner's path: it opens the app with no URL parameters, taps
// Workspaces and the chat (the phone and the tablet) or shows it in the workbench (the desktop), with a stubbed server
// whose transcript read waits until the test lets it answer: a slow load. The skeleton sits at the bottom, over the
// composer, which takes text at once; the entries land where the skeleton ended; a chat opened again shows its last
// transcript at once; after `loadLimitMs` with no read, a line with Retry takes the skeleton's place.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const title = 'plan the slice'
const chats = [
  {
    id: plan,
    kind: 'claude',
    title,
    model: 'claude-opus-5-5',
    contextUsed: null,
    modelId: null,
    effort: null,
    pane: `${plan}-pane`,
    status: 'idle',
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

const user = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })
const reply = (id: string, text: string): TranscriptEntry => ({ type: 'assistant', id, text, cut: false })

/** The stubbed server: the workspace, its layout, the event stream, and the transcript fake, whose reads can wait. */
function slowServer() {
  const transcripts: FakeTranscriptServer = fakeTranscriptServer()
  transcripts.set(plan, [user('u1', 'Fix the build'), reply('a1', 'Looking at the build now.')])
  let gate: { promise: Promise<void>; open: () => void } | undefined
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      if (gate !== undefined && /^\/api\/chats\/[^/]+\/transcript$/.test(path)) await gate.promise
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
  return {
    transcripts,
    /** Holds each transcript read from now until `release`. */
    hold: () => {
      let open: (() => void) | undefined
      const promise = new Promise<void>((resolve) => {
        open = resolve
      })
      gate = {
        promise,
        open: () => {
          open?.()
        },
      }
    },
    /** Lets the held reads answer. */
    release: () => {
      gate?.open()
      gate = undefined
    },
  }
}

let view: { unmount: () => Promise<void> } | undefined
let router: ReturnType<typeof createRouter> | undefined

stubLiveServer()
answerLateServerReads()

afterEach(async () => {
  await view?.unmount()
  view = undefined
  router = undefined
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  resetRetries()
  queryClient.clear()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

const sizes = [
  { name: 'the phone', size: [390, 844], taps: true },
  { name: 'the tablet', size: [744, 1133], taps: true },
  { name: 'the desktop', size: [1512, 982], taps: false },
] as const

/** Opens the app at `size`, taps Workspaces, and on the phone and the tablet taps the chat; no URL parameters. */
/**
 * Opens Workspaces at `size`, and the chat with `taps`. With `held` (the test holds the timers) it presses with
 * clickNow and waits with renderedUntil, as a page action or a poll would move the held clock by its real time
 * (lib/AGENTS.md); the desktop opens the chat as the page shows.
 */
async function openChat(size: readonly [number, number], taps: boolean, held = false) {
  await setViewport(size[0], size[1])
  router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    defaultErrorComponent: RouteError,
  })
  const before = new Set(document.body.children)
  view = await testRender(
    <>
      <RouterProvider router={router} />
      <ErrorTray />
    </>,
    rootErrorOptions,
  )
  // The app gets the window's height, as main.ts gives it, so a chat's pane is the window's height, not its content's.
  const container = [...document.body.children].find((child) => !before.has(child))
  if (container === undefined) throw new Error('no view container')
  container.id = 'root'
  onTestFinished(markApp())
  onTestFinished(() => {
    container.removeAttribute('id')
  })
  const nav = page.getByRole('button', { name: 'Workspaces', exact: true })
  if (held) {
    await renderedUntil(() => nav.query() !== null)
    const button = nav.query()
    if (button === null) throw new Error('no Workspaces button')
    clickNow(button)
    await renderedUntil(() => router?.state.location.pathname === '/workspaces')
  } else {
    await userEvent.click(nav)
    await expect.poll(() => router?.state.location.pathname).toBe('/workspaces')
  }
  expect(router.state.location.searchStr).toBe('')
  if (taps) await tapChat()
}

async function tapChat() {
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
}

/** The time a chat's first transcript read has before the pane says it could not load (`loadLimitMs`, liveTranscript.ts). */
const loadLimitMs = 10_000

const loading = () => page.getByRole('status', { name: 'Loading this chat' })
const skeleton = () => document.querySelector('[data-loading="transcript"]')
const messageBox = () => page.getByRole('combobox').first().getByRole('textbox')

/** The child of the transcript's scroller that holds `el`: an entry's own box, the skeleton's place in the list. */
function rowOf(el: Element, body: Element): Element {
  let row = el
  while (row.parentElement !== null && row.parentElement !== body) row = row.parentElement
  return row
}

describe('a live chat while its transcript loads', () => {
  for (const device of sizes)
    it(`shows the skeleton at the bottom, takes text at once and puts the newest entry where it ended, on ${device.name}`, async () => {
      const server = slowServer()
      server.hold()
      await openChat(device.size, device.taps)
      await expect.element(loading()).toBeInTheDocument()
      const skel = skeleton()
      const body = skel?.parentElement ?? null
      if (skel === null || body === null) throw new Error('no skeleton')
      // At the bottom: the skeleton ends where the scroller's content ends, over the composer.
      const skelBottom = skel.getBoundingClientRect().bottom
      expect(skelBottom).toBeGreaterThan(body.getBoundingClientRect().top + body.clientHeight / 2)
      await expect.element(page.getByText('Fix the build')).not.toBeInTheDocument()
      // The composer works while the chat loads.
      await userEvent.fill(messageBox(), 'a draft while it loads')
      await expect.element(messageBox()).toHaveValue('a draft while it loads')
      // The draft expands a phone's or a tablet's composer (R31), so the skeleton's end is read again just before the
      // transcript comes.
      await afterRendering()
      const loadedFrom = skeleton()?.getBoundingClientRect().bottom ?? Number.NaN
      server.release()
      await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
      await expect.element(loading()).not.toBeInTheDocument()
      expect(skeleton()).toBeNull()
      // The newest entry lands where the skeleton ended: no jump.
      const newest = rowOf(page.getByText('Looking at the build now.').element(), body)
      await renderedUntil(() => Math.abs(newest.getBoundingClientRect().bottom - loadedFrom) <= 1)
      expect(Math.abs(newest.getBoundingClientRect().bottom - loadedFrom)).toBeLessThanOrEqual(1)
      await expect.element(messageBox()).toHaveValue('a draft while it loads')
      expect(getReports()).toEqual([])
    })

  for (const device of sizes.filter((s) => s.taps))
    it(`shows the last transcript at once when the chat opens again, and reads it again, on ${device.name}`, async () => {
      const server = slowServer()
      await openChat(device.size, true)
      await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: 'Back to Workspaces' }).first())
      await expect.poll(() => server.transcripts.openStreams()).toEqual([])
      const reads = server.transcripts.reads.length
      server.hold()
      await tapChat()
      // The read waits, and the kept transcript shows at once, with no skeleton.
      await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
      expect(skeleton()).toBeNull()
      server.transcripts.set(plan, [
        user('u1', 'Fix the build'),
        reply('a1', 'Looking at the build now.'),
        reply('a2', 'The build passes.'),
      ])
      server.release()
      // The read answers and updates it in place.
      await expect.element(page.getByText('The build passes.')).toBeVisible()
      expect(server.transcripts.reads.length).toBe(reads + 1)
      expect(getReports()).toEqual([])
    })

  for (const device of sizes)
    it(`puts "Could not load this chat" with Retry in place of the skeleton after the limit, on ${device.name}`, async () => {
      const server = slowServer()
      server.hold()
      const release = holdTimers()
      await openChat(device.size, false, true)
      // From the tap on, a page action or a poll would move the held clock by its real time (lib/AGENTS.md): tap and
      // wait with clickNow and renderedUntil, so the limit counts only the time the test moves.
      if (device.taps) {
        const row = () => page.getByText(title, { exact: true }).first().query()
        await renderedUntil(() => row() !== null)
        const tap = row()
        if (tap === null) throw new Error('no chat row')
        clickNow(tap)
      }
      await renderedUntil(() => skeleton() !== null)
      expect(loading().query()).not.toBeNull()
      vi.advanceTimersByTime(loadLimitMs - 1)
      await renderedUntil(() => true)
      expect(skeleton()).not.toBeNull()
      vi.advanceTimersByTime(1)
      await renderedUntil(() => skeleton() === null)
      expect(document.body.textContent).toContain('Could not load this chat')
      release()
      const retry = page.getByRole('button', { name: 'Retry' }).element()
      clickNow(retry)
      server.release()
      await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
      await expect.element(page.getByText('Could not load this chat')).not.toBeInTheDocument()
    })
})
