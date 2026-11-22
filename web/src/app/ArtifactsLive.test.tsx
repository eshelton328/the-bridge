import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { artifactsError, type FakeArtifactsServer, fakeArtifactsServer } from '../lib/fakeArtifactsServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The live Artifacts library (pages/artifacts/liveArtifacts.ts) on the owner's path: the app with no URL
// parameters, then Artifacts from the rail on the desktop or from More on the phone, with the contract-checked fake
// of the server's routes (lib/fakeArtifactsServer.ts). Every link, title and project is made up.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()

/** A made-up artifact: a Claude artifact a chat published `age` minutes ago, or a Codex site the owner added. */
function artifact(n: number, title: string, age: number, source: 'claude' | 'codex' = 'claude') {
  const id = n.toString(16).padStart(16, '0')
  return {
    id,
    link:
      source === 'claude'
        ? `https://claude.ai/artifact/00000000-0000-0000-0000-${id.slice(4)}`
        : `https://sample-${String(n)}.example.com/`,
    source,
    title,
    description: `${title}, made up for the test`,
    project: n % 2 === 0 ? null : 'sample-project',
    chat: source === 'claude' ? `mac-mini/s${String(n)}` : null,
    publishedAt: minutesAgo(age),
    foundAt: minutesAgo(age),
    foundBy: source === 'claude' ? 'session' : 'owner',
  }
}

const plan = artifact(1, 'Sample plan', 30)
const notes = artifact(2, 'Sample notes', 3 * 24 * 60, 'codex')
const chart = artifact(3, 'Sample chart', 10)

/** The fake with `artifacts`, as the page's fetch; the owner last looked an hour ago. */
function withServer(artifacts: readonly unknown[] = [plan, notes]): FakeArtifactsServer {
  const server = fakeArtifactsServer({ artifacts, lastSeenAt: minutesAgo(60) })
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const answer = server.handle(new URL(url, window.location.origin).pathname, init)
      return answer === undefined ? Promise.reject(new TypeError(`no stub for ${url}`)) : Promise.resolve(answer)
    }),
  )
  return server
}

answerLateServerReads()

afterEach(async () => {
  Reflect.deleteProperty(document, 'visibilityState')
  Reflect.deleteProperty(document, 'hidden')
  await unmountRendered()
  vi.unstubAllGlobals()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

const devices = [
  { name: 'the desktop', size: [1512, 982], item: 'artifact card' },
  { name: 'the phone', size: [390, 844], item: 'artifact row' },
] as const
type Device = (typeof devices)[number]

/** Opens the app with no URL parameters at the device's size and taps Artifacts in the rail, or in More on the phone. */
async function tapArtifacts(device: Device) {
  await setViewport(device.size[0], device.size[1])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    defaultErrorComponent: RouteError,
  })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  await openArtifacts(device)
  await expect.poll(() => router.state.location.pathname).toBe('/artifacts')
  expect(router.state.location.searchStr).toBe('')
  return router
}

/** Taps Artifacts from the page that shows. */
async function openArtifacts(device: Device) {
  if (device.item === 'artifact row') {
    await userEvent.click(page.getByRole('button', { name: /^More/ }))
    await userEvent.click(page.getByRole('dialog').getByRole('button', { name: /^Artifacts/ }))
  } else await userEvent.click(page.getByRole('button', { name: /^Artifacts/ }))
}

const shown = (device: Device) =>
  [...document.querySelectorAll(`[data-figma^="${device.item} · "]`)].map((el) =>
    el.getAttribute('data-figma')?.replace(`${device.item} · `, ''),
  )
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

const statusLine = (text: string) => page.getByRole('status').filter({ hasText: text })
const quiet = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))
const foundGroup = () => page.getByText('Found since you last looked')

describe('the live Artifacts library', () => {
  for (const device of devices) {
    it(`lists the server's artifacts, newest first, with no sample one, on ${device.name}`, async () => {
      const server = withServer()
      await tapArtifacts(device)
      await expect.poll(() => shown(device)).toEqual(['Sample plan', 'Sample notes'])
      await expect.element(statusLine('Checked Claude just now')).toBeVisible()
      await expect.element(page.getByText('Skill eval pass rates')).not.toBeInTheDocument()
      expect(server.calls('list')).toHaveLength(1)
      expect(getReports()).toEqual([])
    })

    it(`shows a partial list, then reads once more for the rest, with no loop, on ${device.name}`, async () => {
      const server = withServer()
      server.findLater([chart])
      await tapArtifacts(device)
      await expect.poll(() => shown(device)).toEqual(['Sample chart', 'Sample plan', 'Sample notes'])
      expect(server.calls('list')).toHaveLength(2)
      await expect.element(statusLine('Checked Claude just now')).toBeVisible()
      await quiet()
      expect(server.calls('list')).toHaveLength(2)
    })

    it(`reads once more after a partial list and no more while the lists stay partial, on ${device.name}`, async () => {
      const server = withServer()
      const partial = () =>
        new Response(
          JSON.stringify({ checkedAt: minutesAgo(0), lastSeenAt: minutesAgo(60), partial: true, artifacts: [plan] }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      server.answerNext('list', partial, 3)
      await tapArtifacts(device)
      await expect.element(statusLine('Checked part of Claude — the rest comes next')).toBeVisible()
      await expect.poll(() => server.calls('list').length).toBe(2)
      await quiet()
      expect(server.calls('list')).toHaveLength(2)
      await expect.poll(() => shown(device)).toEqual(['Sample plan'])
    })

    it(`marks what was found since the last look, posts seen once and starts the next visit from it, on ${device.name}`, async () => {
      const server = withServer()
      await tapArtifacts(device)
      await expect.poll(() => shown(device)).toEqual(['Sample plan', 'Sample notes'])
      await expect.element(foundGroup()).toBeVisible()
      await expect.poll(() => server.calls('seen').map((c) => c.body)).toEqual([{}])
      // The visit keeps its New marks; the next visit starts from the seen.
      const back = device.item === 'artifact row' ? /^More/ : /^Inbox/
      if (device.item === 'artifact row') {
        await userEvent.click(page.getByRole('button', { name: back }))
        await userEvent.click(page.getByRole('dialog').getByRole('button', { name: /^Toolkit/ }))
      } else await userEvent.click(page.getByRole('button', { name: back }))
      await quiet(100)
      await openArtifacts(device)
      await expect.poll(() => server.calls('list').length).toBe(2)
      await expect.poll(() => shown(device)).toEqual(['Sample plan', 'Sample notes'])
      await expect.element(foundGroup()).not.toBeInTheDocument()
      expect(server.calls('seen')).toHaveLength(2)
    })

    it(`says in one short line that the server failed, reports its kind and status only, on ${device.name}`, async () => {
      const server = withServer()
      server.answerNext('list', () => artifactsError('internal', 500))
      await tapArtifacts(device)
      await expect.element(statusLine('Library not read — the server answered 500')).toBeVisible()
      expect(shown(device)).toEqual([])
      expect(getReports().map((r) => [r.error.name, r.error.message])).toEqual([
        ['ArtifactsMissError', 'An artifacts request missed: list internal 500'],
      ])
      await quiet()
      expect(server.calls('seen')).toHaveLength(0)
    })

    it(`reads a list that got no answer while hidden again once the page shows, with no line, on ${device.name}`, async () => {
      const server = withServer()
      const router = await tapArtifacts(device)
      await expect.poll(() => shown(device)).toEqual(['Sample plan', 'Sample notes'])
      setHidden(true)
      server.answerNext('list', () => Promise.reject(new TypeError('Load failed')))
      void router.invalidate()
      await expect.poll(() => server.calls('list').length).toBe(2)
      await quiet()
      expect(server.calls('list')).toHaveLength(2)
      setHidden(false)
      await expect.poll(() => server.calls('list').length).toBe(3)
      await expect.element(statusLine('Checked Claude just now')).toBeVisible()
      await expect.element(page.getByText(/^Library not read/)).not.toBeInTheDocument()
      expect(getReports()).toEqual([])
    })

    it(`says the server did not answer, with no report, on ${device.name}`, async () => {
      const server = withServer()
      server.answerNext('list', () => Promise.reject(new TypeError('Failed to fetch')))
      await tapArtifacts(device)
      await expect.element(statusLine('Library not read — the server did not answer')).toBeVisible()
      expect(shown(device)).toEqual([])
      expect(getReports()).toEqual([])
    })
  }
})
