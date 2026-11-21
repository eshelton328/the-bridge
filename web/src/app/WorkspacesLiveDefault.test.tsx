import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { type LayoutNode, WorkspacesResponse } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { clearReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'

// d-117: in development the Workspaces page reads the live source when the
// URL names no ?state= and no ?source=. Each test takes the owner's path:
// it opens the app with no URL parameters and taps Workspaces in the tab
// bar or the rail, with a stubbed server (`fetch`). A failed read shows no
// sample workspace, only the notice and Retry; a live chat shows no sample
// transcript or terminal: a Claude chat shows its own transcript (slice 3b,
// WorkspacesLiveTranscript.test.tsx tests it). ?state= and ?source=fixtures
// still show fixtures.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const notice = 'Live data unavailable — no workspaces shown'
/** Rows and texts of the sample data, which a live page never shows. */
// The home's sample rows, and its status bar summary and alert, which name a sample workspace and chat.
const sample = [
  'bridge themes',
  'release notes',
  'omni-brain',
  'hono server',
  'omni-brain · 4 panes',
  'the-bridge › hono server needs you',
]

type Chat = { local: string; kind: 'claude' | 'codex' | 'shell'; title: string; model: string | null }

const summary = (c: Chat) => ({
  id: `mac-mini/${c.local}`,
  kind: c.kind,
  title: c.title,
  model: c.model,
  contextUsed: null,
  status: 'idle',
  parent: null,
})

/** The server's answer: `chats` in the workspace "live work", then each of `more` with its own chats. */
const workspacesBody = (chats: readonly Chat[], more: readonly { label: string; chats: readonly Chat[] }[] = []) =>
  JSON.stringify({
    machine: 'mac-mini',
    workspaces: [
      { id: 'mac-mini/w-live', label: 'live work', chats: chats.map(summary) },
      ...more.map((w) => ({
        id: `mac-mini/w-${w.label.replace(' ', '-')}`,
        label: w.label,
        chats: w.chats.map(summary),
      })),
    ],
  })

const plan: Chat = { local: 'p1', kind: 'claude', title: 'plan the slice', model: 'claude-opus-5-5' }
const logs: Chat = { local: 's1', kind: 'shell', title: 'tail logs', model: 'zsh' }
/** The one entry of plan's transcript, from the contract-checked transcript fake. */
const planEntry = 'Plan the slice from the contract'

/**
 * A workspace's layout (`GET /api/workspaces/:workspace/layout`, slice 3a) from the list that `reply` gives: one tab
 * with the workspace's chats side by side, its first chat focused. A layout read that misses is reported (d-115), so
 * these tests, which are about the list, give one (WorkspacesLiveLayout.test.tsx tests the layouts and their misses).
 */
async function layoutAnswer(reply: () => Response, url: string): Promise<Response> {
  const id = decodeURIComponent(
    /\/api\/workspaces\/([^/]+)\/layout$/.exec(new URL(url, window.location.origin).pathname)?.[1] ?? '',
  )
  const list: unknown = await reply().json()
  const parsed = WorkspacesResponse.safeParse(list)
  const chats = parsed.success ? (parsed.data.workspaces.find((w) => w.id === id)?.chats ?? []) : []
  const [first, ...rest] = chats
  if (first === undefined)
    return new Response(JSON.stringify({ error: { kind: 'not-found', message: 'none', requestId: 'r-9' } }), {
      status: 404,
    })
  const root = rest.reduce<LayoutNode>(
    (left, c) => ({ kind: 'split', direction: 'row', ratio: 0.5, first: left, second: { kind: 'pane', chat: c.id } }),
    { kind: 'pane', chat: first.id },
  )
  const tab = { id: `${id}:t1`, label: 'main', active: true, root, focusedChat: first.id, chats }
  return new Response(JSON.stringify({ workspace: id, tabs: [tab] }), { status: 200 })
}

/**
 * The stubbed server. `reply` answers each `GET /api/workspaces`: a Response, or `'down'` for no answer; a
 * workspace's layout comes from it (`layoutAnswer`). The event stream opens with `open` when the server is up, and
 * fails as a network error when it is down; `send` writes an event to every open stream.
 */
function fakeServer(first: (() => Response) | 'down') {
  let reply = first
  const encoder = new TextEncoder()
  const streams: ReadableStreamDefaultController<Uint8Array>[] = []
  const reads: string[] = []
  const transcripts = fakeTranscriptServer()
  transcripts.set('mac-mini/p1', [{ type: 'user', id: 'u1', text: planEntry, cut: false }])
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const layout = url.includes('/api/workspaces/') && url.endsWith('/layout')
      if (url.includes('/api/workspaces') && !layout) reads.push(url)
      if (reply === 'down') return Promise.reject(new TypeError('Failed to fetch'))
      const transcript = transcripts.handle(new URL(url, window.location.origin).pathname, init)
      if (transcript !== undefined) return Promise.resolve(transcript)
      if (layout) return layoutAnswer(reply, url)
      if (url.includes('/api/events')) {
        const body = new ReadableStream<Uint8Array>({
          start: (control) => {
            streams.push(control)
            control.enqueue(encoder.encode('event: open\nretry: 200\ndata: {}\n\n'))
          },
        })
        init?.signal?.addEventListener('abort', () => {
          try {
            body.cancel().catch(() => undefined)
          } catch {
            // The stream is locked by its reader, which the abort ends.
          }
        })
        return Promise.resolve(new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } }))
      }
      if (url.includes('/api/workspaces')) return Promise.resolve(reply())
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
  return {
    reads,
    answer: (next: (() => Response) | 'down') => {
      reply = next
    },
    send: (event: string, data: unknown) => {
      for (const control of streams) {
        try {
          control.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          // A stream the page closed.
        }
      }
    },
  }
}

const ok =
  (chats: readonly Chat[], more: readonly { label: string; chats: readonly Chat[] }[] = []) =>
  () =>
    new Response(workspacesBody(chats, more), { status: 200 })
const review: Chat = { local: 'p3', kind: 'codex', title: 'review notes', model: 'gpt-5.5' }
const errorAnswer = (status: number, kind: string) => () =>
  new Response(JSON.stringify({ error: { kind, message: 'it failed', requestId: 'r-7' } }), { status })

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

/**
 * The app with no URL parameters, as the owner opens it: "/" goes to the Inbox. As in main.ts, the root error hooks
 * report and the dev ErrorTray shows the reports.
 */
async function openApp(path = '/') {
  router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultErrorComponent: RouteError,
  })
  view = await testRender(
    <>
      <RouterProvider router={router} />
      <ErrorTray />
    </>,
    rootErrorOptions,
  )
}

/** The dev ErrorTray's badge, such as "3 errors". */
const trayBadge = () => page.getByRole('complementary', { name: 'Error reports' })

/** Opens the app on the phone and taps Workspaces in the tab bar; the URL has no parameters. */
async function tapWorkspacesOnPhone() {
  await setViewport(390, 844)
  await openApp()
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router?.state.location.pathname).toBe('/workspaces')
  expect(router?.state.location.searchStr).toBe('')
}

const noticeAlert = () => page.getByRole('alert').filter({ hasText: notice })

async function expectNoSample() {
  for (const text of sample) await expect.element(page.getByText(text, { exact: true })).not.toBeInTheDocument()
}

describe('Workspaces on the live source by default (d-117)', () => {
  it("lists the server's chats, and a tapped chat shows its own transcript, never the sample's", async () => {
    fakeServer(ok([plan, logs]))
    await tapWorkspacesOnPhone()
    await expect.element(page.getByText('live work')).toBeVisible()
    await expect.element(page.getByText('plan the slice')).toBeVisible()
    await expect.element(page.getByText('tail logs')).toBeVisible()
    await expectNoSample()
    await expect.element(noticeAlert()).not.toBeInTheDocument()
    await userEvent.click(page.getByRole('button', { name: 'plan the slice', exact: true }))
    await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
    await expect.element(page.getByText(planEntry)).toBeVisible()
    // The sample transcript of the home's chat never shows.
    await expect.element(page.getByText('Opus', { exact: true })).not.toBeInTheDocument()
    await expect.element(page.getByText('Terminal not live yet')).not.toBeInTheDocument()
  })

  it('shows that the terminal of a live shell is not live yet, in the workbench on a desktop', async () => {
    fakeServer(ok([logs]))
    await setViewport(1512, 982)
    await openApp()
    await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
    await expect.poll(() => router?.state.location.pathname).toBe('/workspaces')
    await expect.element(page.getByText('Terminal not live yet')).toBeVisible()
    await expect.element(page.getByText('Transcript not live yet')).not.toBeInTheDocument()
    await expectNoSample()
  })

  it('shows the notice and no sample rows with the server down, and Retry loads the list once it answers', async () => {
    const server = fakeServer('down')
    await tapWorkspacesOnPhone()
    await expect.element(noticeAlert()).toBeVisible()
    await expect
      .element(noticeAlert().getByText('The-bridge server did not answer. Start it or check the tailnet, then retry.'))
      .toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'Workspaces' })).toBeVisible()
    await expectNoSample()
    // The event stream's first failure loads the page once more, for the status bar; the server comes back after it.
    await expect.poll(() => server.reads.length).toBe(2)
    await expect.element(noticeAlert()).toBeVisible()
    server.answer(ok([plan]))
    await userEvent.click(noticeAlert().getByRole('button', { name: 'Retry' }))
    await expect.poll(() => server.reads.length).toBe(3)
    await expect.element(page.getByText('plan the slice')).toBeVisible()
    await expect.element(noticeAlert()).not.toBeInTheDocument()
    await expectNoSample()
  })

  it('shows the notice with Retry and no sample rows on the desktop, with the server down', async () => {
    const server = fakeServer('down')
    await setViewport(1512, 982)
    await openApp()
    await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
    await expect.poll(() => router?.state.location.pathname).toBe('/workspaces')
    await expect.element(noticeAlert()).toBeVisible()
    await expectNoSample()
    await expect.poll(() => server.reads.length).toBe(2)
    server.answer(ok([plan]))
    await userEvent.click(noticeAlert().getByRole('button', { name: 'Retry' }))
    await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
    await expect.element(page.getByText(planEntry)).toBeVisible()
    await expect.element(noticeAlert()).not.toBeInTheDocument()
  })

  it("opens each workspace's own chats: from the sidebar, and in its tab with the sidebar hidden", async () => {
    fakeServer(ok([plan], [{ label: 'second space', chats: [review] }]))
    await setViewport(1512, 982)
    await openApp()
    await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
    await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
    // A chat of the second workspace opens alone from the sidebar.
    await userEvent.click(page.getByRole('button', { name: 'review notes', exact: true }))
    await expect.element(page.getByRole('heading', { name: 'review notes' })).toBeVisible()
    await expect.element(page.getByText('Transcript not live yet')).toBeVisible()
    // With the sidebar hidden, each tab shows its own chat, not the other workspace's.
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await userEvent.click(page.getByRole('tab', { name: /live work/ }))
    await expect.element(page.getByRole('button', { name: 'Maximise plan the slice' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Maximise review notes' })).not.toBeInTheDocument()
    await userEvent.click(page.getByRole('tab', { name: /second space/ }))
    await expect.element(page.getByRole('button', { name: 'Maximise review notes' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Maximise plan the slice' })).not.toBeInTheDocument()
  })

  it('keeps the notice and Retry with the desktop sidebar hidden, with the server down', async () => {
    const server = fakeServer('down')
    await setViewport(1512, 982)
    await openApp()
    await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
    await expect.element(noticeAlert()).toBeVisible()
    await expect.poll(() => server.reads.length).toBe(2)
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(noticeAlert()).toBeVisible()
    await expectNoSample()
    server.answer(ok([plan]))
    await userEvent.click(noticeAlert().getByRole('button', { name: 'Retry' }))
    await expect.element(page.getByRole('button', { name: 'Maximise plan the slice' })).toBeVisible()
    await expect.element(noticeAlert()).not.toBeInTheDocument()
  })

  it('clears the notice with no tap once the event stream reaches the server again', async () => {
    const server = fakeServer('down')
    await tapWorkspacesOnPhone()
    await expect.element(noticeAlert()).toBeVisible()
    await expect.poll(() => server.reads.length).toBe(2)
    await expect.element(noticeAlert()).toBeVisible()
    server.answer(ok([plan]))
    // The stream connects again after its retry time (5 s), then the page loads again.
    await expect.element(page.getByText('plan the slice'), { timeout: 12_000 }).toBeVisible()
    await expect.element(noticeAlert()).not.toBeInTheDocument()
  })

  const kinds = [
    {
      name: 'unreachable, a 502 from the proxy with no error body',
      answer: () => new Response('', { status: 502 }),
      text: 'The-bridge server did not answer (502). Start it or check the tailnet, then retry.',
    },
    {
      name: 'herdr-unavailable (503)',
      answer: errorAnswer(503, 'herdr-unavailable'),
      text: 'Herdr is not available on the server (request r-7). Start it, then retry.',
    },
    {
      name: 'herdr-bad-reply (502)',
      answer: errorAnswer(502, 'herdr-bad-reply'),
      text: "The server could not read herdr's reply (request r-7). Check the server's log, then retry.",
    },
    {
      name: 'forbidden (403)',
      answer: errorAnswer(403, 'forbidden'),
      text: 'The server refused this device (403, request r-7).',
    },
    {
      name: 'internal (500)',
      answer: errorAnswer(500, 'internal'),
      text: 'The server failed while it read the workspaces (request r-7). Check its log, then retry.',
    },
  ]
  for (const kind of kinds)
    it(`shows the ${kind.name} text, with no sample rows`, async () => {
      fakeServer(kind.answer)
      await tapWorkspacesOnPhone()
      await expect.element(noticeAlert()).toBeVisible()
      await expect.element(noticeAlert().getByText(kind.text)).toBeVisible()
      await expect.element(noticeAlert().getByRole('button', { name: 'Retry' })).toBeVisible()
      await expectNoSample()
    })

  it('shows the timeout text after 8 s with no answer, with no sample rows', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              const reason: unknown = init.signal?.reason
              reject(reason instanceof Error ? reason : new Error('aborted'))
            })
          }),
      ),
    )
    await tapWorkspacesOnPhone()
    await expect
      .element(
        noticeAlert().getByText(
          'The-bridge server took more than 8 seconds to answer. Check that it is not stuck, then retry.',
        ),
        { timeout: 12_000 },
      )
      .toBeVisible()
    await expectNoSample()
  })

  it('shows a chat that an event adds, with no reload', async () => {
    const server = fakeServer(ok([plan]))
    await tapWorkspacesOnPhone()
    await expect.element(page.getByText('plan the slice')).toBeVisible()
    const loads = server.reads.length
    server.answer(ok([plan, { local: 'p2', kind: 'codex', title: 'review the diff', model: 'gpt-5.5' }]))
    server.send('workspaces.changed', { source: 'mac-mini/agents', seq: 1, type: 'workspaces.changed', data: {} })
    await expect.element(page.getByText('review the diff')).toBeVisible()
    expect(server.reads.length).toBeGreaterThan(loads)
    expect(router?.state.location.pathname).toBe('/workspaces')
  })

  it('still shows the fixtures for ?state= and ?source=fixtures, and reads no server', async () => {
    const server = fakeServer(ok([plan]))
    await setViewport(390, 844)
    for (const path of ['/workspaces?source=fixtures', '/workspaces?state=phoneHome']) {
      await openApp(path)
      await expect.element(page.getByText('release notes')).toBeVisible()
      await expect.element(page.getByText('plan the slice')).not.toBeInTheDocument()
      await view?.unmount()
      view = undefined
    }
    expect(server.reads).toEqual([])
  })
})

// What the page shows of a miss is not counted again: the dev ErrorTray shows no badge for an expected miss, during
// the outage or after the list comes back. The status bar shows only live values.
describe('a live miss is a state the page shows, not an error (d-117)', () => {
  it('shows no ErrorTray badge with the server down, nor once Retry loads the list, on the desktop', async () => {
    const server = fakeServer('down')
    await setViewport(1512, 982)
    await openApp()
    await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
    await expect.element(noticeAlert()).toBeVisible()
    await expect.poll(() => server.reads.length).toBe(2)
    await expect.element(trayBadge()).not.toBeInTheDocument()
    server.answer(ok([plan]))
    await userEvent.click(noticeAlert().getByRole('button', { name: 'Retry' }))
    await expect.element(page.getByText('plan the slice', { exact: true }).first()).toBeVisible()
    await expect.element(trayBadge()).not.toBeInTheDocument()
  })

  it('shows no sample summary in the status bar with the server down, and the live one once it answers', async () => {
    const server = fakeServer('down')
    await setViewport(1512, 982)
    await openApp()
    await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
    await expect.element(noticeAlert()).toBeVisible()
    await expect.poll(() => server.reads.length).toBe(2)
    await expect.element(page.getByText('omni-brain · 4 panes', { exact: true })).not.toBeInTheDocument()
    await expect.element(page.getByText(/· \d+ panes?$/)).not.toBeInTheDocument()
    server.answer(ok([plan, review]))
    await userEvent.click(noticeAlert().getByRole('button', { name: 'Retry' }))
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(page.getByText('live work · 2 panes', { exact: true })).toBeVisible()
  })

  it('still shows RouteError, and counts it in the ErrorTray, for a reply the contract refuses', async () => {
    fakeServer(() => new Response(JSON.stringify({ machine: 'mac-mini', workspaces: 'not a list' }), { status: 200 }))
    await setViewport(1512, 982)
    await openApp()
    await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
    await expect.element(noticeAlert()).not.toBeInTheDocument()
    await expect.poll(() => router?.state.location.pathname).toBe('/workspaces')
    await expect.element(page.getByText('This page failed to load')).toBeVisible()
    // A real error is still reported, so the dev ErrorTray counts it.
    await expect.element(trayBadge().getByRole('button', { name: '1 error' })).toBeVisible()
  })
})

// A live Codex chat cannot send yet (until W8; a live Claude chat sends, WorkspacesLiveSend.test.tsx): its composer is
// disabled and says so, and Send stays off (that no send reaches the store is in WorkspacesSendDraft.test.tsx). A live
// chat's header has no "context" label, as it has no context share. A fixtures chat still sends.
describe('a live chat that cannot send yet (d-117)', () => {
  const sizes = [
    { name: 'the phone', size: [390, 844] },
    { name: 'the tablet', size: [756, 1129] },
    { name: 'the desktop', size: [1512, 982] },
  ] as const
  for (const device of sizes) {
    it(`disables a Codex chat's composer with "Sending not live yet" and sends nothing, on ${device.name}`, async () => {
      fakeServer(ok([review]))
      await setViewport(device.size[0], device.size[1])
      await openApp()
      await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
      await expect.poll(() => router?.state.location.searchStr).toBe('')
      await userEvent.click(page.getByText('review notes', { exact: true }).first())
      await expect.element(page.getByRole('heading', { name: 'review notes' })).toBeVisible()
      const box = page.getByRole('textbox', { name: 'Sending not live yet' })
      await expect.element(box).toBeDisabled()
      await expect.element(box).toHaveAttribute('placeholder', 'Sending not live yet')
      // A press on the box and Enter send nothing.
      await userEvent.click(box, { force: true })
      await userEvent.keyboard('hello{Enter}')
      await expect.element(box).toHaveValue('')
      await expect.element(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled()
    })

    it(`draws no "context" label in a live chat's header, which has no context share, on ${device.name}`, async () => {
      fakeServer(ok([plan]))
      await setViewport(device.size[0], device.size[1])
      await openApp()
      await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
      await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
      await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
      await expect.element(page.getByText(planEntry)).toBeVisible()
      await expect.element(page.getByText('context', { exact: true })).not.toBeInTheDocument()
    })
  }

  it('still sends from a ?source=fixtures chat, whose header keeps its "context" label', async () => {
    const server = fakeServer(ok([plan]))
    await setViewport(390, 844)
    await openApp('/workspaces?source=fixtures')
    await userEvent.click(page.getByText('bridge themes', { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect.element(page.getByText('context', { exact: true })).toBeVisible()
    const box = page.getByRole('textbox')
    await expect.element(box).toBeEnabled()
    await userEvent.fill(box, 'send this')
    await userEvent.click(page.getByRole('button', { name: 'Send', exact: true }))
    // The store's send resolves, and a sent message empties the box.
    await expect.element(box).toHaveValue('')
    expect(server.reads).toEqual([])
  })
})
