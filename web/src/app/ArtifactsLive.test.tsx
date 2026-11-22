import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { artifactsError } from '../lib/fakeArtifactsServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { setViewport } from '../lib/rendering.ts'
import { unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import {
  chart,
  devices,
  minutesAgo,
  openArtifacts,
  plan,
  quiet,
  shown,
  statusLine,
  tapArtifacts,
  withServer,
} from './artifactsLiveHelpers.ts'

// The live Artifacts library (pages/artifacts/liveArtifacts.ts) on the owner's path: the app with no URL
// parameters, then Artifacts from the rail on the desktop or from More on the phone, with the contract-checked fake
// of the server's routes (lib/fakeArtifactsServer.ts). Every link, title and project is made up.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

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
