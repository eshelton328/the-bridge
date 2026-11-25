import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterAll, afterEach, beforeAll, describe, expect, it, onTestFinished, vi } from 'vitest'
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
import { renderedUntil, setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { markApp } from './appMarker.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// The Workspaces list read (`GET /api/workspaces`) back from the background. iOS closes the reads of a page in the
// background, and the page sees the close only when it shows again. A list read that gets no answer at all then (no
// status) while the page is hidden, after it hid during the read or within 5 s after it showed again shows no
// notice, and the list is read again once the page shows, as the layout read does since #364 (pageResume.ts). A
// second one in the same trip, or any answer from the server, is a server outage: the page keeps its list for the
// 10 s grace and then shows the notice (review R43b, `WorkspacesQuietReconnect.test.tsx`). Each test takes the
// owner's path: the app with no URL parameters, then Workspaces, with the contract-checked fake as the server.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const live = 'mac-mini/w-live'
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
  status: 'idle',
  parent: null,
})
const list = {
  machine: 'mac-mini',
  workspaces: [{ id: live, label: 'live work', chats: [summary(plan, 'plan the slice'), summary(review, 'review')] }],
}
/** The list after herdr renamed the workspace: a read that reaches the server draws the new label. */
const renamed = { ...list, workspaces: list.workspaces.map((w) => ({ ...w, label: 'renamed work' })) }

/** A list read's answer: a response, or a promise of one, which rejects for a read that gets no answer. */
type ListAnswer = () => Response | Promise<Response>

/** A read that gets no answer at all, as fetch rejects when iOS closes it. */
const noAnswer: ListAnswer = () => Promise.reject(new TypeError('Load failed'))
const answerWith =
  (body: unknown): ListAnswer =>
  () =>
    new Response(JSON.stringify(body), { status: 200 })

/**
 * The fake server, with the list read's answer from `answer` while it is set (the fake's own list when not); `reads`
 * counts the list reads.
 */
function withServer() {
  const chats = fakeTranscriptServer()
  for (const c of [plan, review]) chats.set(c, [])
  const workspaces = fakeWorkspacesServer(chats, list)
  let answer: ListAnswer | undefined
  let reads = 0
  // The list reads when the page last opened its event stream: the watch's own first read comes after it.
  let readsAtOpen: number | undefined
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      if (path === '/api/events') readsAtOpen = reads
      if (path === '/api/workspaces') {
        reads += 1
        if (answer !== undefined) return Promise.resolve().then(answer)
      }
      const found = chats.handle(path, init) ?? workspaces.handle(path, init)
      if (found !== undefined) return Promise.resolve(found)
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
  return {
    workspaces,
    reads: () => reads,
    /** The event watch has read the list since it opened its stream. */
    watched: () => readsAtOpen !== undefined && reads > readsAtOpen,
    answer: (next: ListAnswer | undefined) => {
      answer = next
    },
  }
}

let view: { unmount: () => Promise<void> } | undefined

stubLiveServer()
answerLateServerReads()

// The app client tries a 5xx twice more. The tries stay; only their waits (1 s and 2 s) go.
const queryDefaults = queryClient.getDefaultOptions()
beforeAll(() => {
  queryClient.setDefaultOptions({ ...queryDefaults, queries: { ...queryDefaults.queries, retryDelay: 0 } })
})
afterAll(() => {
  queryClient.setDefaultOptions(queryDefaults)
})

afterEach(async () => {
  Reflect.deleteProperty(document, 'visibilityState')
  Reflect.deleteProperty(document, 'hidden')
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
  { name: 'the desktop', size: [1512, 982] },
  { name: 'the phone', size: [390, 844] },
] as const

/** Opens the app with no URL parameters at `size` and taps Workspaces in the rail or the tab bar. */
async function tapWorkspaces(size: readonly [number, number]) {
  await setViewport(size[0], size[1])
  const router = createRouter({
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
  await expect.element(page.getByText('live work').first()).toBeVisible()
}

/** Makes the page hidden (`hidden` true) or visible again, with the events Safari sends. */
function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (hidden ? 'hidden' : 'visible'),
  })
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  if (hidden) window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))
  document.dispatchEvent(new Event('visibilitychange'))
  if (!hidden) window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
}

const notice = () => page.getByRole('alert').filter({ hasText: 'Live data unavailable — no workspaces shown' })
/** The grace of a live read with no answer after the page showed a list (`reconnectGraceMs`, review R43b). */
const graceMs = 10_000

const quiet = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

describe('the Workspaces list read back from the background', () => {
  for (const device of devices)
    it(`reads the list that got no answer while hidden again once the page shows, with no notice, on ${device.name}`, async () => {
      const server = withServer()
      await tapWorkspaces(device.size)
      await quiet()
      const reads = server.reads()
      setHidden(true)
      server.answer(noAnswer)
      server.workspaces.listChanged()
      await expect.poll(server.reads).toBe(reads + 1)
      // Hidden, the read waits for the page to show, and the page says nothing.
      await quiet()
      expect(server.reads()).toBe(reads + 1)
      await expect.element(notice()).not.toBeInTheDocument()
      server.answer(answerWith(renamed))
      // The page's clock stands still (lib/holdTimers.ts): the read goes again when the page shows, not on a timer.
      const release = holdTimers()
      setHidden(false)
      await expect.poll(server.reads).toBe(reads + 2)
      release()
      await expect.element(page.getByText('renamed work').first()).toBeVisible()
      await quiet()
      await expect.element(notice()).not.toBeInTheDocument()
      expect(getReports()).toEqual([])
    })

  for (const device of devices)
    it(`reads the list with no answer just after the page showed again at once, with no notice, and shows a second one, on ${device.name}`, async () => {
      const server = withServer()
      await tapWorkspaces(device.size)
      // The count starts after the watch's own first read, which a slow runner sends later than any fixed wait.
      await renderedUntil(server.watched)
      await quiet()
      const reads = server.reads()
      // iOS: the page cannot run in the background, so its read misses only once the page shows again.
      setHidden(true)
      setHidden(false)
      let tries = 0
      server.answer(() => {
        tries += 1
        return tries === 1 ? noAnswer() : answerWith(renamed)()
      })
      const release = holdTimers()
      server.workspaces.listChanged()
      // The event's settle time starts the load; nothing after it waits on the clock.
      for (let at = 0; at < 10 && server.reads() < reads + 1; at += 1) await vi.advanceTimersByTimeAsync(100)
      await expect.poll(server.reads).toBe(reads + 2)
      release()
      await expect.element(page.getByText('renamed work').first()).toBeVisible()
      await quiet()
      await expect.element(notice()).not.toBeInTheDocument()
      // One quiet miss for each trip: a list read with no answer after it is an outage, which shows the notice once
      // the grace passes (R43b).
      server.answer(noAnswer)
      const held = holdTimers()
      server.workspaces.listChanged()
      for (let at = 0; at < 10 && server.reads() < reads + 3; at += 1) await vi.advanceTimersByTimeAsync(100)
      await renderedUntil(() => server.reads() === reads + 3)
      expect(notice().query()).toBeNull()
      // The grace's end loads the page again (the event's settle time), and that read misses too.
      await vi.advanceTimersByTimeAsync(graceMs)
      for (let at = 0; at < 10 && server.reads() < reads + 4; at += 1) await vi.advanceTimersByTimeAsync(100)
      held()
      await expect.element(notice()).toBeVisible()
      await expect
        .element(notice().getByText('The-bridge server did not answer. Start it or check the tailnet, then retry.'))
        .toBeVisible()
      expect(server.reads()).toBe(reads + 4)
      expect(getReports()).toEqual([])
    })

  for (const device of devices)
    it(`keeps the list the page opened with through a 502 before its event watch read the list, on ${device.name}`, async () => {
      const server = withServer()
      // The route loader's reads answer; once the page draws the list, every read, the event watch's first one too
      // (it starts after the page drew), gets a 502 from the proxy of a server that went down (R43b, the-bridge #476).
      const drawn = () => document.body.textContent.includes('live work')
      // The 502 answers and the time of the first: a slow click can return after the watch's reads, so the case counts
      // them as they come, not from a read count taken after the click (the-bridge #496 verify, 11375 ms).
      let missed = 0
      let firstMiss: number | undefined
      server.answer(() => {
        if (!drawn()) return answerWith(list)()
        missed += 1
        firstMiss ??= performance.now()
        return new Response('Bad Gateway', { status: 502 })
      })
      await tapWorkspaces(device.size)
      // The watch's read and the app client's two more tries of the 5xx, before the grace's own reload: the wait ends
      // at the grace, so a page that reads the list only on that reload fails here.
      await renderedUntil(() => missed >= 3 || (firstMiss !== undefined && performance.now() - firstMiss >= graceMs))
      expect(missed).toBeGreaterThanOrEqual(3)
      expect(performance.now() - (firstMiss ?? 0)).toBeLessThan(graceMs)
      await quiet()
      expect(notice().query()).toBeNull()
      await expect.element(page.getByText('live work').first()).toBeVisible()
      expect(getReports()).toEqual([])
    })

  for (const device of devices)
    it(`shows the notice for a 502 answer after a quiet miss around a hide, on ${device.name}`, async () => {
      const server = withServer()
      await tapWorkspaces(device.size)
      await quiet()
      const reads = server.reads()
      setHidden(true)
      server.answer(noAnswer)
      server.workspaces.listChanged()
      await expect.poll(server.reads).toBe(reads + 1)
      await quiet()
      await expect.element(notice()).not.toBeInTheDocument()
      // The proxy answers for a server that is down: an answer, not the background's close.
      server.answer(() => new Response('Bad Gateway', { status: 502 }))
      const held = holdTimers()
      setHidden(false)
      // The app client tries a 5xx twice more, as before; the page keeps its list for the grace (R43b).
      for (let at = 0; at < 10 && server.reads() < reads + 4; at += 1) await vi.advanceTimersByTimeAsync(100)
      await renderedUntil(() => server.reads() === reads + 4)
      expect(notice().query()).toBeNull()
      await vi.advanceTimersByTimeAsync(graceMs)
      for (let at = 0; at < 10 && server.reads() < reads + 7; at += 1) await vi.advanceTimersByTimeAsync(100)
      held()
      await expect.element(notice()).toBeVisible()
      await expect
        .element(
          notice().getByText('The-bridge server did not answer (502). Start it or check the tailnet, then retry.'),
        )
        .toBeVisible()
      // The load after the grace reads again, and the app client tries it twice more.
      expect(server.reads()).toBe(reads + 7)
    })
})
