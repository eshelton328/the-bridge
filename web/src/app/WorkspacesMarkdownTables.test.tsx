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
import { type FakeTranscriptServer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { expectGfmInline, expectReadableTable, gfmText, tableIn } from './markdownGfmChecks.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'

// Review R51 ("The table did not render"): a reply's GitHub Markdown in a live
// chat's transcript. Each test takes the owner's path: it opens the app with
// no URL parameters, taps Workspaces and the live chat (the phone and the
// tablet) or shows the workbench's pane (the desktop), with a stubbed server
// (`fetch`) whose transcript routes are the contract-checked fake
// (lib/fakeTranscriptServer.ts). A pipe table renders as a table that
// scrolls sideways in its own frame, with its first column readable and no
// page-wide sideways scroll; a strikethrough, a task list and a bare link
// render too (markdownGfmChecks.ts). Every value is made up.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
// One live Claude chat, alone in its workspace's layout.
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
let router: ReturnType<typeof createRouter> | undefined

// Each test stubs fetch itself; between tests, a read that a page started after its test ended gets the stubbed
// server, never the one on this machine (liveServerStub.ts).
stubLiveServer()

// A read that a page starts after its test ended gets no answer, not the real server (lib/lateServerReads.ts).
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

/** Opens the app at `size` and taps Workspaces in the rail or the tab bar; the URL has no parameters. */
async function tapWorkspaces(size: readonly [number, number]) {
  await setViewport(size[0], size[1])
  router = createRouter({
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
  await expect.poll(() => router?.state.location.pathname).toBe('/workspaces')
  expect(router.state.location.searchStr).toBe('')
}

/** Taps the live chat `title` in the list, on the phone or the tablet. */
async function tapChat(title: string) {
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
}

/** The region of the phone's or tablet's open chat, named by its title. */
const chatRegion = (title: string) => page.getByRole('region', { name: title })
/** The workbench pane of `title`: the pane around its Maximise button. */
const workbenchPane = (title: string) =>
  page
    .getByRole('button', { name: `Maximise ${title}`, exact: true })
    .element()
    .closest('[data-figma]')

const reply = (id: string, text: string): TranscriptEntry => ({ type: 'assistant', id, text, cut: false })

/** A transcript fake with plan's transcript as one reply of `gfmText`. */
function withTableReply() {
  const server = fakeTranscriptServer()
  server.set(plan, [reply('a1', gfmText)])
  fakeServer(server)
  return server
}

const devices = [
  { name: 'the phone', size: [390, 844] },
  { name: 'the tablet', size: [744, 1133] },
] as const

describe("a reply's GitHub Markdown (review R51)", () => {
  for (const device of devices)
    it(`renders a pipe table, a strikethrough, a task list and a bare link on ${device.name}`, async () => {
      withTableReply()
      await tapWorkspaces(device.size)
      await tapChat('plan the slice')
      const chat = chatRegion('plan the slice')
      await expect.element(chat.getByText('Sample rollout status:')).toBeVisible()
      await expect.element(chat.getByRole('table')).toBeVisible()
      expectGfmInline(chat.element())
      expectReadableTable(tableIn(chat.element()), chat.element())
      expect(getReports()).toEqual([])
    })

  it('renders a strikethrough, a task list and a bare link with no table, on the phone', async () => {
    const server = fakeTranscriptServer()
    server.set(plan, [reply('a1', gfmText.split('\n').slice(6).join('\n'))])
    fakeServer(server)
    await tapWorkspaces([390, 844])
    await tapChat('plan the slice')
    const chat = chatRegion('plan the slice')
    await expect.element(chat.getByText('Ship the sample change')).toBeVisible()
    expect(chat.element().querySelector('table')).toBeNull()
    expectGfmInline(chat.element())
    expect(getReports()).toEqual([])
  })

  it('renders them in the desktop workbench pane', async () => {
    withTableReply()
    await tapWorkspaces([1512, 982])
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(page.getByText('Sample rollout status:')).toBeVisible()
    const pane = workbenchPane('plan the slice')
    if (pane === null) throw new Error('no pane')
    await expect.poll(() => pane.querySelector('table')).not.toBeNull()
    expectGfmInline(pane)
    expectReadableTable(tableIn(pane), pane)
    expect(getReports()).toEqual([])
  })
})
