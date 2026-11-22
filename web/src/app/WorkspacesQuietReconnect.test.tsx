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

// Review R43: a restart of the server ends every live stream, and the page showed "Transcript updates lost —
// connecting again" and reported a TranscriptMissError before it connected again 5 s later. Now a stream that ends
// with no `error` event and connects again within the grace (10 s) shows no line and reports nothing, and the read
// after the reconnect shows each entry written meanwhile. A reconnect that still misses after the window shows the
// line and reports once; the event stream's "Live updates lost" waits for the window too. A failed watch (an `error`
// event, review R35) still shows at once. Each test takes the owner's path: the app with no URL parameters, then
// Workspaces, then the chat (the phone taps it; the desktop shows its pane), with the contract-checked fakes as the
// server. While the server is down, every request answers 502 with no body, as the Vite proxy does.
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

describe('a server restart (review R43)', () => {
  for (const device of devices)
    it(`reconnects quietly within the grace and shows the entry written meanwhile, on ${device.name}`, async () => {
      const server = withServer()
      await openPlan(server, device.size)
      const reads = server.chats.reads.length
      const release = holdTimers()
      server.restart()
      // Down for 9 s: the page tries again on the retry time and gets 502s, with no line and no report.
      await pass(4000)
      server.chats.set(plan, [...before, reply('a2', 'Written while the server restarted.')])
      await pass(5000)
      expect(shows(outageLine)).toBe(false)
      expect(shows(eventsLine)).toBe(false)
      expect(getReports()).toEqual([])
      server.up()
      await pass(1000)
      await renderedUntil(() => server.chats.reads.length > reads && server.chats.openStreams().includes(plan))
      release()
      // The read after the reconnect brings the entry written while the stream was down.
      await expect.element(page.getByText('Written while the server restarted.')).toBeVisible()
      await expect.element(page.getByText('Here is a first sketch.')).toBeVisible()
      await expect.element(page.getByText(outageLine)).not.toBeInTheDocument()
      await expect.element(page.getByText(eventsLine)).not.toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
      expect(getReports()).toEqual([])
      // The new stream works: a pushed change shows.
      server.chats.push(plan, [reply('a3', 'Back on the stream.')])
      await expect.element(page.getByText('Back on the stream.')).toBeVisible()
    })

  for (const device of devices)
    it(`shows the line and reports once when the reconnect still misses after the grace, on ${device.name}`, async () => {
      const server = withServer()
      await openPlan(server, device.size)
      const release = holdTimers()
      server.restart()
      await pass(9500)
      expect(shows(outageLine)).toBe(false)
      expect(shows(eventsLine)).toBe(false)
      expect(getReports()).toEqual([])
      // Past the window, the next miss shows the line, and report() gets it once however often it misses again.
      await pass(6000)
      await renderedUntil(() => shows(/^Transcript updates lost — connecting again$/))
      // The desktop's status bar says the event stream is lost too; it is not reported.
      if (device.size[0] >= 700) await renderedUntil(() => shows(eventsLine))
      expect(getReports().map((r) => r.error.message)).toEqual([
        'A chat transcript stream missed: status 502 (chat mac-mini/c1)',
      ])
      // Once the server is back, the next try connects, and the lines go. The held clock moves the retry time.
      server.up()
      await pass(1000)
      await renderedUntil(() => !shows(outageLine) && !shows(eventsLine))
      release()
      await expect.element(page.getByText('Here is a first sketch.')).toBeVisible()
      await expect.element(page.getByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
      expect(getReports()).toHaveLength(1)
    })

  for (const device of devices)
    it(`still shows a failed watch (an error event, review R35) at once and reports it once, on ${device.name}`, async () => {
      const server = withServer()
      await openPlan(server, device.size)
      // The clock stands still: the line comes with no grace.
      const release = holdTimers()
      server.chats.fail(plan, 'herdr-unavailable')
      await renderedUntil(() => shows(/^Transcript updates lost — connecting again$/))
      expect(getReports().map((r) => r.error.message)).toEqual([
        'A chat transcript stream missed: ended herdr-unavailable (chat mac-mini/c1)',
      ])
      release()
      await expect.element(page.getByText('Transcript updates lost — connecting again')).toBeVisible()
    })
})
