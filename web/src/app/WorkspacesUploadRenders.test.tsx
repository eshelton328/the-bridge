import type { ReactNode } from 'react'
import Markdown from 'react-markdown'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { type FakeTranscriptServer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { queryClient } from '../lib/queryClient.ts'
import { afterRendering, setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'

// The #329 flake: WorkspacesPage subscribed to every upload change, so each
// chunk's progress and each status change rendered the whole page (94 page
// renders for 10 small files), and a slow CI runner missed the uploads'
// end. Each pane now reads its own chat's files (useLiveUploads.ts,
// ChatPane's `files`), and liveUploads.ts publishes a chunk's progress at
// most once an animation frame. These tests take the owner's path, add two
// files to a live chat and count, from the pick to the uploads' end, the
// renders of the screen (one per page render), the chat header and
// react-markdown (one per transcript message or reply): none may render.
const { renders, counted } = vi.hoisted(() => {
  const renders = { screen: 0, header: 0 }
  type Module = Record<string, (props: object) => ReactNode>
  /** The module with its component `name` counting its renders in `renders[key]`. */
  const counted = (real: Module, name: string, key: keyof typeof renders): Module => ({
    ...real,
    [name]: (props: object) => ((renders[key] += 1), real[name]?.(props)),
  })
  return { renders, counted }
})
vi.mock('react-markdown', { spy: true })
vi.mock('../pages/workspaces/screens/WorkspacesScreen.tsx', async (original) =>
  counted(await original(), 'WorkspacesScreen', 'screen'),
)
vi.mock('../pages/workspaces/blocks/ChatHead.tsx', async (original) => counted(await original(), 'ChatHead', 'header'))

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'
const drift = 'mac-mini/c3'
const logs = 'mac-mini/c4'

type Status = 'working' | 'idle'
const summary = (id: string, kind: 'claude' | 'codex' | 'shell', title: string, status: Status) => ({
  id,
  kind,
  title,
  model: kind === 'codex' ? 'gpt-5.5' : kind === 'shell' ? 'zsh' : 'claude-opus-5-5',
  contextUsed: null,
  modelId: null,
  effort: null,
  pane: `${id}-pane`,
  status,
  parent: null,
})
const chats = [
  summary(plan, 'claude', 'plan the slice', 'idle'),
  summary(review, 'claude', 'review notes', 'idle'),
  summary(drift, 'codex', 'drift check', 'working'),
  summary(logs, 'shell', 'tail logs', 'working'),
]
const pane = (chat: string) => ({ kind: 'pane', chat })
const split = (first: unknown, second: unknown) => ({ kind: 'split', direction: 'row', ratio: 0.5, first, second })
const layout = JSON.stringify({
  workspace,
  tabs: [
    {
      id: 'mac-mini/w-live:t1',
      label: 'main',
      active: true,
      root: split(split(pane(plan), pane(review)), split(pane(drift), pane(logs))),
      focusedChat: plan,
      chats,
    },
  ],
})

const phone = [390, 844] as const
const desktop = [1512, 982] as const

/** The stubbed server: the workspaces, their layout, the event stream, and the fake's chat and upload routes. */
function fakeServer(fake: FakeTranscriptServer) {
  vi.stubGlobal('XMLHttpRequest', fake.uploads.XMLHttpRequest)
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const answer = fake.handle(path, init)
      if (answer !== undefined) return Promise.resolve(answer)
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

/** The fake with 4-byte chunks, so a 10-byte file goes up in three chunks, and a transcript in each Claude chat. */
function withChats() {
  const fake = fakeTranscriptServer({ uploads: { chunkSize: 4 } })
  fake.set(plan, [
    { type: 'user', id: 'u1', text: 'Fix the **build**', cut: false },
    { type: 'user', id: 'u3', text: 'Then run the *tests*', cut: false },
  ])
  fake.set(review, [{ type: 'user', id: 'u2', text: 'Review the notes', cut: false }])
  fakeServer(fake)
  return fake
}

let view: { unmount: () => Promise<void> } | undefined

stubLiveServer()

// A read that a page starts after its test ended gets no answer, not the real server (lib/lateServerReads.ts).
answerLateServerReads()

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  resetRetries()
  queryClient.clear()
  clearReports()
  await setViewport(desktop[0], desktop[1])
})

const chatOf = (title: string) => page.getByRole('region', { name: title })

/** Opens the app at `size` with no URL parameters, taps Workspaces, then the live chat `title` (its pane on the desktop). */
async function openChat(size: readonly [number, number], title: string) {
  await setViewport(size[0], size[1])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    defaultErrorComponent: RouteError,
  })
  view = await testRender(<RouterProvider router={router} />, rootErrorOptions)
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  if (size === desktop) {
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(chatOf(title).getByRole('textbox')).toBeVisible()
  } else {
    await userEvent.click(page.getByText(title, { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
  }
  await expect.element(chatOf(title).getByText('tests')).toBeVisible()
  // The page reads the list and its layout again once the event stream opens, and renders for it: the count starts
  // after that load, so it holds only what the upload renders.
  const reads = () =>
    vi
      .mocked(fetch)
      .mock.calls.filter(([input]) =>
        (input instanceof Request ? input.url : input instanceof URL ? input.href : input).endsWith('/api/workspaces'),
      ).length
  await expect.poll(reads).toBeGreaterThanOrEqual(2)
  await expect.poll(() => router.state.status).toBe('idle')
  await afterRendering()
}

/** The renders of the screen, the chat header and react-markdown from a pick of two files to the end of their uploads. */
async function rendersWhileUploading(title: string, fake: FakeTranscriptServer) {
  const input = chatOf(title).element().querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) throw new Error('no file input')
  vi.mocked(Markdown).mockClear()
  renders.screen = 0
  renders.header = 0
  await userEvent.upload(input, [
    new File(['abcdefghij'], 'notes-a.pdf', { type: 'application/pdf' }),
    new File(['klmnopqrst'], 'notes-b.pdf', { type: 'application/pdf' }),
  ])
  await expect.poll(() => fake.uploads.complete().length).toBe(2)
  // Every chunk sent its progress, and the composer drew both chips ready.
  expect(fake.uploads.chunks).toHaveLength(6)
  await expect.element(chatOf(title).getByRole('button', { name: 'Send', exact: true })).toBeEnabled()
  return { screen: renders.screen, header: renders.header, markdown: vi.mocked(Markdown).mock.calls.length }
}

const none = { screen: 0, header: 0, markdown: 0 }

describe("an upload renders only its chat's composer (the #329 flake)", () => {
  it('renders no page, header or transcript entry on the phone', async () => {
    const fake = withChats()
    await openChat(phone, 'plan the slice')
    expect(await rendersWhileUploading('plan the slice', fake)).toEqual(none)
    expect(getReports()).toEqual([])
  })

  it("renders no page, header or transcript entry in the desktop workbench's pane", async () => {
    const fake = withChats()
    await openChat(desktop, 'plan the slice')
    expect(await rendersWhileUploading('plan the slice', fake)).toEqual(none)
    expect(getReports()).toEqual([])
  })
})
