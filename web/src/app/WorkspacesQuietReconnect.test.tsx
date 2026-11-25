import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { clearReports, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { holdTimers } from '../lib/holdTimers.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { afterRendering, renderedUntil, setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// Review R43, R70: a server restart ends every live stream. The transcript connects again on the backoff and says
// "Reconnecting…" with no report; the line and one report come only with a miss 10 s or more after the first, with 4
// in a row (at 10 s it tries at once). The list and the event stream keep R43's 10 s grace. Owner path (no URL
// parameters, Workspaces, the chat) on the contract-checked fakes; while down, every request answers 502. The backoff
// waits half of each step (`Math.random` 0.5): 0.25, 0.5, 1, 2, 4 s.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const live = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const logs = 'mac-mini/c2'

const summary = (id: string, kind: 'claude' | 'shell', title: string) => ({
  id,
  kind,
  title,
  model: kind === 'shell' ? 'zsh' : 'claude-opus-5-5',
  contextUsed: null,
  modelId: null,
  effort: null,
  pane: `${id}-pane`,
  status: 'idle',
  parent: null,
})
// One Claude chat, so one transcript stream; the shell has none.
const list = {
  machine: 'mac-mini',
  workspaces: [
    {
      id: live,
      label: 'live work',
      chats: [summary(plan, 'claude', 'plan the slice'), summary(logs, 'shell', 'logs')],
    },
  ],
}

const user = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })
const reply = (id: string, text: string): TranscriptEntry => ({ type: 'assistant', id, text, cut: false })
const before = [user('u1', 'Sketch the quiet reconnect'), reply('a1', 'Here is a first sketch.')]

/** The fakes as the server; `restart()` takes it down (each stream ends, each request answers 502), `up()` back. */
function withServer() {
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
  const chats = fakeTranscriptServer()
  chats.set(plan, before)
  const workspaces = fakeWorkspacesServer(chats, list)
  let down = false
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (down) return Promise.resolve(new Response('', { status: 502 }))
      const path = new URL(url, window.location.origin).pathname
      const found = chats.handle(path, init) ?? workspaces.handle(path, init)
      if (found !== undefined) return Promise.resolve(found)
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
  return {
    chats,
    workspaces,
    /** Every request answers 502 from now, with the open streams left as they are. */
    down: () => {
      down = true
    },
    restart: () => {
      down = true
      chats.close(plan)
      workspaces.endEvents()
    },
    up: () => {
      down = false
    },
  }
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

const devices = [
  { name: 'the phone', size: [390, 844] },
  { name: 'the desktop', size: [1512, 982] },
] as const

/** Opens the app with no URL parameters at `size`, taps Workspaces and opens plan's chat as the owner does. */
async function openPlan(server: ReturnType<typeof withServer>, size: readonly [number, number]) {
  await setViewport(size[0], size[1])
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
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  expect(router.state.location.searchStr).toBe('')
  if (size[0] < 700) {
    await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
  } else await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
  await expect.element(page.getByText('Here is a first sketch.')).toBeVisible()
  await expect.poll(() => server.chats.openStreams()).toEqual([plan])
  // The load that the event stream's `open` asks for (100 ms later) reads the list before the server goes down.
  await new Promise((resolve) => setTimeout(resolve, 300))
}

// A transcript miss's line, and the event stream's line in the desktop status bar.
const outageLine = /^Transcript (not live —|updates)/
const eventsLine = /^Live updates lost the event stream/

/**
 * Moves the held clock by `ms` in steps of `step`, letting each answer and render land between steps: no Vitest poll,
 * which would move the clock too (lib/holdTimers.ts).
 */
async function pass(ms: number, step = 250) {
  for (let at = 0; at < ms; at += step) await vi.advanceTimersByTimeAsync(step)
  await afterRendering()
}

/** Whether the page shows a line that matches `text`, checked now, with no poll. */
const shows = (text: RegExp) => [...document.querySelectorAll('body *')].some((e) => text.test(e.textContent))

describe('a server restart (R70, in place of review R43)', () => {
  for (const device of devices)
    it(`says "Reconnecting…" with no line and no report through a 7 s outage, then shows the entry written meanwhile, on ${device.name}`, async () => {
      const server = withServer()
      await openPlan(server, device.size)
      const reads = server.chats.reads.length
      const release = holdTimers()
      server.restart()
      // Down for 7 s: tries at 0.25, 0.75, 1.75, 3.75 s get 502s, 4 misses in a row with the first at 0, and no line.
      await pass(4000)
      server.chats.set(plan, [...before, reply('a2', 'Written while the server restarted.')])
      await pass(3000)
      expect(shows(/^Reconnecting…$/)).toBe(true)
      expect(shows(outageLine)).toBe(false)
      expect(shows(eventsLine)).toBe(false)
      expect(getReports()).toEqual([])
      server.up()
      // The next try, at 7.75 s, connects.
      await pass(1000)
      await renderedUntil(() => server.chats.reads.length > reads && server.chats.openStreams().includes(plan))
      release()
      // The read after the reconnect brings the entry written while the stream was down.
      await expect.element(page.getByText('Written while the server restarted.')).toBeVisible()
      await expect.element(page.getByText('Here is a first sketch.')).toBeVisible()
      await expect.element(page.getByText('Reconnecting…')).not.toBeInTheDocument()
      await expect.element(page.getByText(outageLine)).not.toBeInTheDocument()
      await expect.element(page.getByText(eventsLine)).not.toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
      expect(getReports()).toEqual([])
      // The new stream works: a pushed change shows.
      server.chats.push(plan, [reply('a3', 'Back on the stream.')])
      await expect.element(page.getByText('Back on the stream.')).toBeVisible()
    })

  for (const device of devices)
    it(`shows the line and reports once when a 12 s outage passes 10 s after 4 misses, on ${device.name}`, async () => {
      const server = withServer()
      await openPlan(server, device.size)
      const release = holdTimers()
      server.restart()
      await pass(9500)
      expect(shows(/^Reconnecting…$/)).toBe(true)
      expect(shows(outageLine)).toBe(false)
      expect(getReports()).toEqual([])
      // At 10 s the page tries at once; that miss shows the line, and report() gets it once however often it misses.
      await pass(2500)
      await renderedUntil(() => shows(/^Transcript updates lost — connecting again$/))
      // The desktop's status bar says the event stream is lost too, after its own 10 s grace; it is not reported.
      if (device.size[0] >= 700) await renderedUntil(() => shows(eventsLine))
      expect(getReports().map((r) => r.error.message)).toEqual([
        'A chat transcript stream missed: status 502 (chat mac-mini/c1)',
      ])
      // Once the server is back, the next try connects (the miss at 10 s waits 15 s, to 25 s), and the line goes.
      server.up()
      await pass(13_500, 1000)
      await renderedUntil(() => !shows(outageLine) && !shows(eventsLine))
      release()
      await expect.element(page.getByText('Here is a first sketch.')).toBeVisible()
      await expect.element(page.getByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
      expect(getReports()).toHaveLength(1)
    })
})

// Review R43b: a list read that lands while the server is down keeps the page's list within the grace, and a stream
// that gives no byte for 45 s (a server killed behind the Vite proxy) is closed and connects again quietly.
describe('a server restart, the list and a silent stream (review R43b)', () => {
  const notice = /^Live data unavailable/

  it('keeps the chat and shows no notice for a list read that misses within the grace, then recovers', async () => {
    const server = withServer()
    await openPlan(server, [390, 844])
    const release = holdTimers()
    // The list changes, and its read lands while the server restarts.
    server.workspaces.listChanged()
    server.restart()
    await pass(9000)
    expect(shows(notice)).toBe(false)
    expect(shows(outageLine)).toBe(false)
    expect(shows(/^Here is a first sketch\.$/)).toBe(true)
    expect(getReports()).toEqual([])
    server.up()
    await pass(1500)
    release()
    await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
    await expect.element(page.getByText('Here is a first sketch.')).toBeVisible()
    await expect.element(page.getByText(notice)).not.toBeInTheDocument()
    expect(getReports()).toEqual([])
  })

  it('keeps the chat for a list read that misses within the grace after 6 min with no change', async () => {
    const server = withServer()
    await openPlan(server, [390, 844])
    const release = holdTimers()
    // The query client drops a query no one observes after 5 min (gcTime), on a timer it starts once a read ends: a
    // list change reads on the held clock. The server pings each stream meanwhile.
    server.workspaces.listChanged()
    await pass(1000)
    for (let at = 0; at < 24; at += 1) {
      await pass(15_000, 5000)
      server.chats.ping(plan)
      server.workspaces.pingEvents()
    }
    server.workspaces.listChanged()
    server.restart()
    await pass(9000)
    expect(shows(notice)).toBe(false)
    expect(shows(/^Here is a first sketch\.$/)).toBe(true)
    server.up()
    await pass(1500)
    release()
    await expect.element(page.getByText('Here is a first sketch.')).toBeVisible()
    expect(getReports()).toEqual([])
  })

  it('shows the notice once the list read still misses after the grace', async () => {
    const server = withServer()
    await openPlan(server, [390, 844])
    const release = holdTimers()
    server.workspaces.listChanged()
    server.restart()
    await pass(9000)
    expect(shows(notice)).toBe(false)
    // The load after the window reads again, and the query client tries a 5xx twice more (1 s and 2 s apart).
    for (let at = 0; at < 40 && !shows(notice); at += 1) await pass(250)
    expect(shows(notice)).toBe(true)
    release()
    // The list's miss is a state the page shows, not a report (d-117); the transcript's outage is reported once.
    expect(getReports().map((r) => r.error.message)).toEqual([
      'A chat transcript stream missed: status 502 (chat mac-mini/c1)',
    ])
  })

  it('closes a stream that gives no byte for 45 s, connects again quietly and reads the entries meanwhile', async () => {
    const server = withServer()
    await openPlan(server, [390, 844])
    const reads = server.chats.reads.length
    const release = holdTimers()
    // A ping on the held clock starts each stream's idle limit on it. Then a killed server behind the Vite proxy: the
    // streams stay open and give nothing.
    server.chats.ping(plan)
    server.workspaces.pingEvents()
    await pass(250)
    server.chats.hang(plan)
    server.workspaces.hangEvents()
    server.chats.set(plan, [...before, reply('a2', 'Written while the stream gave nothing.')])
    await pass(44_000, 1000)
    expect(server.chats.reads.length).toBe(reads)
    await pass(2000)
    await renderedUntil(() => server.chats.reads.length > reads && server.chats.openStreams().includes(plan))
    release()
    await expect.element(page.getByText('Written while the stream gave nothing.')).toBeVisible()
    await expect.element(page.getByText(outageLine)).not.toBeInTheDocument()
    expect(getReports()).toEqual([])
  })

  it('keeps a stream open through 2 min of pings every 15 s with no event', async () => {
    const server = withServer()
    await openPlan(server, [390, 844])
    const opens = server.chats.opens.length
    const release = holdTimers()
    for (let at = 0; at < 8; at += 1) {
      await pass(15_000, 1000)
      server.chats.ping(plan)
      server.workspaces.pingEvents()
    }
    release()
    expect(server.chats.opens.length).toBe(opens)
    expect(server.chats.openStreams()).toEqual([plan])
    expect(getReports()).toEqual([])
  })
})
