import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import Markdown from 'react-markdown'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { clearReports, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { type FakeWorkspacesServer, fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { afterRendering, setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { markApp } from './appMarker.ts'
import { markdownShown } from './longLiveChat.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// Slice W2: each layout write makes the server send `layout.changed` for
// its workspace, and the page reads that layout again. A layout change of
// another workspace changes nothing the shown chats draw, so it parses no
// transcript entry's Markdown again (as a keystroke does not, review R28,
// WorkspacesTypingRenders.test.tsx). The test takes the owner's path with
// two live chats of 40 Markdown entries each and counts react-markdown's
// renders (one per message or reply). A drag of the handle between them
// (W2c) moves the panes and sends a ratio, and renders no entry either, and
// so does a move of another chat of the shown workspace to another tab (W2d).
vi.mock('react-markdown', { spy: true })

const live = 'mac-mini/w-live'
const other = 'mac-mini/w-other'
const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'
const away = 'mac-mini/c3'
const spare = 'mac-mini/c4'
const extra = 'mac-mini/c5'

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
  workspaces: [
    {
      id: live,
      label: 'live work',
      chats: [
        summary(plan, 'plan the slice'),
        summary(review, 'review notes'),
        summary(spare, 'spare chat'),
        summary(extra, 'extra chat'),
      ],
    },
    { id: other, label: 'other work', chats: [summary(away, 'away chat')] },
  ],
}

const transcript = (tag: string, count: number): TranscriptEntry[] =>
  Array.from({ length: count }, (_, i) =>
    i % 2 === 0
      ? { type: 'user', id: `${tag}-u${String(i)}`, text: `${tag} question ${String(i)} with *emphasis*`, cut: false }
      : { type: 'assistant', id: `${tag}-a${String(i)}`, text: `## Step ${String(i)}\n\n- the **item**`, cut: false },
  )

function withChats(): { list: FakeWorkspacesServer; layoutReads: string[] } {
  const chats = fakeTranscriptServer()
  chats.set(plan, transcript('plan', 40))
  chats.set(review, transcript('review', 40))
  chats.set(away, [])
  chats.set(spare, [])
  chats.set(extra, [])
  // live work's first tab, the one drawn, holds the two long chats; spare and extra sit in two other tabs.
  const workspaces = fakeWorkspacesServer(chats, list, { tabs: { [live]: [[plan, review], [spare], [extra]] } })
  const layoutReads: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const layout = /^\/api\/workspaces\/([^/]+)\/layout$/.exec(path)
      if (layout !== null) layoutReads.push(decodeURIComponent(layout[1] ?? ''))
      const answer = chats.handle(path, init) ?? workspaces.handle(path, init)
      if (answer !== undefined) return Promise.resolve(answer)
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
  return { list: workspaces, layoutReads }
}

let view: { unmount: () => Promise<void> } | undefined

stubLiveServer()
answerLateServerReads()

afterEach(async () => {
  await view?.unmount()
  view = undefined
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  resetRetries()
  queryClient.clear()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

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
}

describe('a layout change of another workspace renders no transcript entry (W2)', () => {
  it("in the desktop workbench's panes", async () => {
    const fakes = withChats()
    await tapWorkspaces([1512, 982])
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await markdownShown(80)
    vi.mocked(Markdown).mockClear()
    const before = fakes.layoutReads.length
    fakes.list.layoutChanged(other)
    // The page reads the other workspace's layout again, and draws nothing new for the shown chats.
    await expect.poll(() => fakes.layoutReads.slice(before)).toContain(other)
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(vi.mocked(Markdown).mock.calls.length).toBe(0)
    expect(getReports()).toEqual([])
  })

  it('in a move of another chat of the shown workspace to another tab (W2d)', async () => {
    const fakes = withChats()
    await tapWorkspaces([1512, 982])
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await markdownShown(80)
    vi.mocked(Markdown).mockClear()
    const before = fakes.layoutReads.length
    // spare chat moves from tab 2 to tab 3, as the move of another page or of herdr itself does: tab 2 closes.
    const moved = fakes.list.handle(`/api/chats/${encodeURIComponent(spare)}/move`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tab: `${live}:t3`, direction: 'row' }),
    })
    expect(moved?.status).toBe(204)
    await expect.poll(() => fakes.layoutReads.slice(before)).toContain(live)
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(vi.mocked(Markdown).mock.calls.length).toBe(0)
    expect(getReports()).toEqual([])
  })

  it('in the chat open on the phone', async () => {
    const fakes = withChats()
    await tapWorkspaces([390, 844])
    await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
    await markdownShown(40)
    vi.mocked(Markdown).mockClear()
    const before = fakes.layoutReads.length
    fakes.list.layoutChanged(other)
    await expect.poll(() => fakes.layoutReads.slice(before)).toContain(other)
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(vi.mocked(Markdown).mock.calls.length).toBe(0)
  })

  it('in a drag of the handle between the panes, and in the ratio it sends', async () => {
    const fakes = withChats()
    await tapWorkspaces([1512, 982])
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await markdownShown(80)
    vi.mocked(Markdown).mockClear()
    const handle = page.getByRole('separator', { name: 'Resize columns' }).element()
    const box = handle.getBoundingClientRect()
    const [x, y] = [box.left + box.width / 2, box.top + box.height / 2]
    const at = (type: string, dx: number) =>
      new PointerEvent(type, { bubbles: true, clientX: x + dx, clientY: y, pointerId: 1, isPrimary: true, button: 0 })
    handle.dispatchEvent(at('pointerdown', 0))
    for (const dx of [40, 80, 120, 160, 200]) {
      document.dispatchEvent(at('pointermove', dx))
      await afterRendering()
    }
    document.dispatchEvent(at('pointerup', 200))
    await expect.poll(() => fakes.list.writes.map((w) => w.action)).toEqual(['ratio'])
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(Number(handle.getAttribute('aria-valuenow'))).toBeGreaterThan(55)
    expect(vi.mocked(Markdown).mock.calls.length).toBe(0)
    expect(getReports()).toEqual([])
  })
})
