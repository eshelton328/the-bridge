import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { afterRendering, setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'
import { fitGaps, fitRects } from './skeletonFit.ts'

// R58 (the owner: "The skeletons on a page should match the structure of what will be loaded"): the Workspaces list
// while the page waits for its first list is the list's real layout, so nothing moves when the list comes. On the
// owner's path (the app with no URL parameters, then Workspaces from the tab bar), with a list read that waits, the
// test reads where the skeleton's blocks sit, lets the read answer and reads the loaded blocks: the header, the first
// workspace's header and its first two chat rows each sit within 2 px of the skeleton's, in top, height, left and width.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const summary = (id: string, title: string) => ({
  id,
  kind: 'claude' as const,
  title,
  model: 'claude-opus-5-5',
  contextUsed: null,
  modelId: 'opus',
  effort: null,
  pane: `${id}-pane`,
  status: 'idle' as const,
  parent: null,
})
const list = {
  machine: 'test-box',
  workspaces: [
    {
      id: 'test-box/w-orchard',
      label: 'orchard',
      chats: [summary('test-box/c1', 'sketch the plan'), summary('test-box/c2', 'tidy the notes')],
    },
    { id: 'test-box/w-meadow', label: 'meadow', chats: [summary('test-box/c3', 'survey the pond')] },
  ],
}

/** The fakes as the page's fetch; the first list read waits until `release`. */
function withHeldList() {
  const chats = fakeTranscriptServer()
  for (const c of list.workspaces.flatMap((w) => w.chats)) chats.set(c.id, [])
  const workspaces = fakeWorkspacesServer(chats, list)
  let release: (() => void) | undefined
  let held: Promise<void> | undefined = new Promise<void>((resolve) => {
    release = resolve
  })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      if (path === '/api/workspaces' && held !== undefined) {
        const wait = held
        held = undefined
        await wait
      }
      const answer = chats.handle(path, init) ?? workspaces.handle(path, init)
      if (answer !== undefined) return answer
      throw new TypeError(`no stub for ${url}`)
    }),
  )
  return { release: () => release?.() }
}

/** The boxes of the header's buttons, Edit and +, in order. */
function headerControls(): DOMRect[] {
  const header = document.querySelector('[data-fit="header"]')
  if (header === null) throw new Error('no list header')
  const buttons = [...header.querySelectorAll('button')].map((button) => button.getBoundingClientRect())
  expect(buttons.length).toBe(2)
  return buttons
}

let view: { unmount: () => Promise<void> } | undefined

stubLiveServer()
answerLateServerReads()

afterEach(async () => {
  await view?.unmount()
  view = undefined
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  queryClient.clear()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

const devices = [
  { name: 'the phone', size: [390, 844] },
  { name: 'the tablet', size: [744, 1133] },
  // The owner's iPad in full screen (R58 second sample, IMG_0041): 756 pt wide.
  { name: "the owner's iPad", size: [756, 1158] },
] as const

describe('the Workspaces skeleton (R58)', () => {
  for (const device of devices)
    it(`draws the list's real layout while it loads, and the loaded blocks land within 2 px, on ${device.name}`, async () => {
      const server = withHeldList()
      await setViewport(device.size[0], device.size[1])
      const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
      view = await testRender(<RouterProvider router={router} />)
      await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
      await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
      await expect.element(page.getByRole('status', { name: 'Loading Workspaces' })).toBeInTheDocument()
      await expect.element(page.getByRole('heading', { name: 'Workspaces', level: 1 })).toBeVisible()
      // The header's controls are off while the list loads, and no sample workspace shows.
      await expect.element(page.getByRole('button', { name: 'Edit', exact: true })).toBeDisabled()
      await expect.element(page.getByText('the-bridge', { exact: true })).not.toBeInTheDocument()
      await afterRendering()
      const controls = headerControls()
      const skeleton = fitRects()
      for (const block of ['header', 'group', 'items.0', 'items.1']) expect(skeleton.has(block)).toBe(true)
      server.release()
      await expect.element(page.getByText('sketch the plan', { exact: true })).toBeVisible()
      await expect.element(page.getByRole('status', { name: 'Loading Workspaces' })).not.toBeInTheDocument()
      await afterRendering()
      expect(fitGaps(skeleton, fitRects())).toEqual([])
      // Edit and + turn on in the same box: the header's controls do not move or change size.
      await expect.element(page.getByRole('button', { name: 'Edit', exact: true })).toBeEnabled()
      const now = headerControls()
      for (const [i, was] of controls.entries())
        for (const side of ['top', 'left', 'width', 'height'] as const)
          expect(Math.abs((now[i]?.[side] ?? Number.NaN) - was[side])).toBeLessThanOrEqual(2)
      expect(getReports()).toEqual([])
    })
})
