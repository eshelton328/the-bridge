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
import { holdTimers } from '../lib/holdTimers.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'

// Slice 3b: a live chat's pane shows its transcript. Each test takes the
// owner's path: it opens the app with no URL parameters, taps Workspaces and
// a live chat (the phone and the tablet) or shows the workbench's panes (the
// desktop), with a stubbed server (`fetch`) whose transcript routes are the
// contract-checked fake (lib/fakeTranscriptServer.ts). A pushed
// `transcript.changed` changes the entries in place; a miss shows a quiet
// line with Retry in the pane and reports once (d-115); a stream route that
// answers 404 (backend 3b-2 alone) shows the transcript with no line.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'
const drift = 'mac-mini/c3'
const logs = 'mac-mini/c4'

const summary = (id: string, kind: 'claude' | 'codex' | 'shell', title: string) => ({
  id,
  kind,
  title,
  model: kind === 'codex' ? 'gpt-5.5' : kind === 'shell' ? 'zsh' : 'claude-opus-5-5',
  contextUsed: null,
  modelId: null,
  effort: null,
  pane: `${id}-pane`,
  status: 'working',
  parent: null,
})
const chats = [
  summary(plan, 'claude', 'plan the slice'),
  summary(review, 'claude', 'review notes'),
  summary(drift, 'codex', 'drift check'),
  summary(logs, 'shell', 'tail logs'),
]
const split = (direction: 'row' | 'column', first: unknown, second: unknown) => ({
  kind: 'split',
  direction,
  ratio: 0.5,
  first,
  second,
})
const pane = (chat: string) => ({ kind: 'pane', chat })

const layout = JSON.stringify({
  workspace,
  tabs: [
    {
      id: 'mac-mini/w-live:t1',
      label: 'main',
      active: true,
      // Rows first: plan and review on top, drift and logs under them.
      root: split('column', split('row', pane(plan), pane(review)), split('row', pane(drift), pane(logs))),
      focusedChat: plan,
      chats,
    },
  ],
})

const user = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })
const reply = (id: string, text: string, cut = false): TranscriptEntry => ({ type: 'assistant', id, text, cut })
const tool = (id: string, running: boolean): TranscriptEntry => ({
  type: 'tool',
  id,
  name: 'Bash',
  target: 'pnpm',
  running,
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

/** A transcript fake with plan's transcript: the owner's prompt, a running tool call and a reply. */
function withPlan(options: Parameters<typeof fakeTranscriptServer>[0] = {}) {
  const server = fakeTranscriptServer(options)
  server.set(plan, [user('u1', 'Fix the build'), tool('t1', true), reply('a1', 'Looking at the build now.')])
  server.set(review, [user('u2', 'Review the notes')])
  fakeServer(server)
  return server
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

const devices = [
  { name: 'the phone', size: [390, 844] },
  { name: 'the tablet', size: [756, 1129] },
] as const

describe("a live chat's transcript (slice 3b)", () => {
  for (const device of devices)
    it(`shows the transcript of a tapped live chat and a pushed change on ${device.name}`, async () => {
      const server = withPlan()
      await tapWorkspaces(device.size)
      await tapChat('plan the slice')
      const chat = chatRegion('plan the slice')
      await expect.element(page.getByText('Fix the build')).toBeVisible()
      await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
      await expect.element(page.getByText('Transcript not live yet')).not.toBeInTheDocument()
      // The chat's own stream, and only its: the list's other chat has none.
      await expect.poll(() => server.openStreams()).toEqual([plan])
      server.push(plan, [tool('t1', false), reply('a2', 'The build passes.')])
      await expect.element(page.getByText('The build passes.')).toBeVisible()
      // The replaced entry keeps its place: the new reply comes after the first one.
      const texts = chat.element().textContent
      expect(texts.indexOf('Looking at the build now.')).toBeLessThan(texts.indexOf('The build passes.'))
      await expect.element(page.getByText('Earlier entries not live yet')).not.toBeInTheDocument()
      // Back to the list closes the stream.
      await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
      await expect.poll(() => server.openStreams()).toEqual([])
      expect(getReports()).toEqual([])
    })

  it("shows each pane's transcript in the desktop workbench, and a pushed change in its pane", async () => {
    const server = withPlan()
    await tapWorkspaces([1512, 982])
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(page.getByText('Fix the build')).toBeVisible()
    await expect.element(page.getByText('Review the notes')).toBeVisible()
    // Only the Claude chats read: the Codex chat's transcript and the shell's terminal are not live yet.
    await expect.poll(() => [...server.openStreams()].sort()).toEqual([plan, review])
    expect([...new Set(server.reads)].sort()).toEqual([plan, review])
    expect(workbenchPane('drift check')?.textContent).toContain('Transcript not live yet')
    expect(workbenchPane('tail logs')?.textContent).toContain('Terminal not live yet')
    server.push(review, [reply('a9', 'Two notes need a source.')])
    await expect.element(page.getByText('Two notes need a source.')).toBeVisible()
    expect(workbenchPane('review notes')?.textContent).toContain('Two notes need a source.')
    expect(workbenchPane('plan the slice')?.textContent).not.toContain('Two notes need a source.')
    // The reply is named after the chat's agent.
    expect(workbenchPane('review notes')?.textContent).toContain('Claude')
    expect(getReports()).toEqual([])
  })

  for (const device of devices)
    it(`reads nothing for a tapped Codex chat, whose transcript stays not live, on ${device.name}`, async () => {
      const server = withPlan()
      await tapWorkspaces(device.size)
      await tapChat('drift check')
      await expect.element(page.getByText('Transcript not live yet')).toBeVisible()
      await new Promise((resolve) => setTimeout(resolve, 300))
      expect(server.opens).toEqual([])
      expect(server.reads).toEqual([])
      expect(getReports()).toEqual([])
    })

  it("copies a live reply's text with its Copy button, on the phone", async () => {
    withPlan()
    const written: string[] = []
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation((text) => {
      written.push(text)
      return Promise.resolve()
    })
    await tapWorkspaces([390, 844])
    await tapChat('plan the slice')
    await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
    // "Copied" waits for the test's clock, not the runner's (lib/holdTimers.ts).
    const release = holdTimers()
    await userEvent.click(chatRegion('plan the slice').getByRole('button', { name: 'Copy' }))
    await expect.poll(() => written).toEqual(['Looking at the build now.'])
    // The button says it copied, as a sample reply's does (audit P-4).
    await expect.element(chatRegion('plan the slice').getByRole('button', { name: 'Copied' })).toBeVisible()
    release()
    expect(getReports()).toEqual([])
  })

  it("reads Copy failed on a live reply's Copy when the clipboard refuses, and reports without its text", async () => {
    withPlan()
    const broken = new Error('the clipboard broke')
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(() => Promise.reject(broken))
    await tapWorkspaces([756, 1129])
    await tapChat('plan the slice')
    const chat = chatRegion('plan the slice')
    await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
    const release = holdTimers()
    await userEvent.click(chat.getByRole('button', { name: 'Copy' }))
    await expect.element(chat.getByRole('button', { name: 'Copy failed' })).toBeVisible()
    release()
    expect(getReports().map((r) => r.error)).toEqual([broken])
    expect(JSON.stringify(getReports().map((r) => [r.error.message, r.error.stack]))).not.toContain('Looking at')
    // The open ErrorTray shows the clipboard's error alone.
    const trays = () => [...document.querySelectorAll('aside[aria-label="Error reports"]')]
    await userEvent.click(page.getByRole('button', { name: '1 error' }))
    await expect
      .poll(() =>
        trays()
          .map((t) => t.textContent)
          .join('\n'),
      )
      .toContain('the clipboard broke')
    expect(
      trays()
        .map((t) => t.textContent)
        .join('\n'),
    ).not.toContain('Looking at')
  })

  it('shows a quiet empty line for a Claude chat whose transcript has no entries', async () => {
    const server = fakeTranscriptServer()
    server.set(plan, [])
    fakeServer(server)
    await tapWorkspaces([390, 844])
    await tapChat('plan the slice')
    await expect.element(page.getByText('No messages yet')).toBeVisible()
    server.push(plan, [user('u1', 'First message')])
    await expect.element(page.getByText('First message')).toBeVisible()
    await expect.element(page.getByText('No messages yet')).not.toBeInTheDocument()
    expect(getReports()).toEqual([])
  })

  it('shows the earlier line and the cut line', async () => {
    const server = fakeTranscriptServer()
    server.set(plan, [reply('a1', 'A very long reply', true)], true)
    fakeServer(server)
    await tapWorkspaces([390, 844])
    await tapChat('plan the slice')
    await expect.element(page.getByText('Earlier entries not live yet')).toBeVisible()
    await expect.element(page.getByText('Cut — full text not live yet')).toBeVisible()
  })

  it('shows the transcript with no line and no report when the stream route answers 404 (3b-2 alone)', async () => {
    const server = withPlan({ streams: 'missing' })
    await tapWorkspaces([390, 844])
    await tapChat('plan the slice')
    await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(server.opens).toEqual([plan])
    expect(server.reads).toEqual([plan])
    await expect.element(page.getByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
    await expect.element(page.getByText(/^Transcript (not live|updates)/)).not.toBeInTheDocument()
    expect(getReports()).toEqual([])
  })

  it('shows the quiet line for an unknown chat: a 404 read with a 404 stream, reported once', async () => {
    const server = withPlan({ streams: 'missing' })
    server.answerReads(
      () =>
        new Response(
          JSON.stringify({ error: { kind: 'not-found', path: '/api/chats/x', message: 'no chat', requestId: 'r-4' } }),
          { status: 404 },
        ),
    )
    await tapWorkspaces([390, 844])
    await tapChat('plan the slice')
    const chat = chatRegion('plan the slice')
    await expect.element(chat.getByText('Transcript not live — status 404')).toBeVisible()
    await expect.element(chat.getByRole('button', { name: 'Retry' })).toBeVisible()
    expect(getReports().map((r) => r.error.message)).toEqual([
      'A chat transcript read missed: status 404 not-found (chat mac-mini/c1)',
    ])
  })

  it('shows a missed read in the pane with Retry, reports it once, and Retry reads the transcript', async () => {
    const server = withPlan()
    server.answerReads(
      () =>
        new Response(
          JSON.stringify({ error: { kind: 'herdr-unavailable', message: 'herdr is down', requestId: 'r-9' } }),
          { status: 503 },
        ),
    )
    await tapWorkspaces([756, 1129])
    await tapChat('plan the slice')
    const chat = chatRegion('plan the slice')
    await expect.element(chat.getByText('Transcript not live — herdr-unavailable')).toBeVisible()
    await userEvent.click(chat.getByRole('button', { name: 'Retry' }))
    await expect.poll(() => server.reads.length).toBe(2)
    await expect.element(chat.getByText('Transcript not live — herdr-unavailable')).toBeVisible()
    expect(getReports().map((r) => r.error.message)).toEqual([
      'A chat transcript read missed: herdr-unavailable (chat mac-mini/c1)',
    ])
    server.answerReads(undefined)
    await userEvent.click(chat.getByRole('button', { name: 'Retry' }))
    await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
    await expect.element(chat.getByText('Transcript not live — herdr-unavailable')).not.toBeInTheDocument()
    expect(getReports()).toHaveLength(1)
  })

  it('shows a dropped stream in the pane, not only in the status bar, and connects again', async () => {
    const server = withPlan()
    await tapWorkspaces([390, 844])
    await tapChat('plan the slice')
    const chat = chatRegion('plan the slice')
    await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
    await expect.poll(() => server.openStreams()).toEqual([plan])
    server.drop(plan)
    await expect.element(chat.getByText('Transcript updates lost — connecting again')).toBeVisible()
    await expect.element(chat.getByRole('button', { name: 'Retry' })).toBeVisible()
    // The entries stay, and the stream comes back after the server's retry time (100 ms in the fake).
    await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
    await expect.poll(() => server.reads.length).toBe(2)
    await expect.element(chat.getByText('Transcript updates lost — connecting again')).not.toBeInTheDocument()
    expect(getReports().map((r) => r.error.message)).toEqual([
      'A chat transcript stream missed: ended (chat mac-mini/c1)',
    ])
    for (const r of getReports()) expect(JSON.stringify([r.error.message, r.error.stack])).not.toMatch(/build|pnpm/)
  })

  // #313: a chat that leaves the list (after /clear, or when its pane closes) ends its stream with one `error` event of
  // kind not-found. The page ends it quietly; any other kind is still an outage.
  const sizes = [
    { name: 'the phone', size: [390, 844] },
    { name: 'the desktop', size: [1512, 982] },
  ] as const
  /** Opens plan's transcript on the owner's path: the phone taps it, the desktop shows the workbench's panes. */
  async function openPlan(size: readonly [number, number]) {
    await tapWorkspaces(size)
    if (size[0] < 700) await tapChat('plan the slice')
    else await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
  }
  // A miss's line; a Codex pane's "Transcript not live yet" is not one.
  const outageLine = /^Transcript (not live —|updates)/

  for (const device of sizes) {
    it(`ends the stream quietly when the chat leaves the list (not-found), on ${device.name}`, async () => {
      const server = withPlan()
      await openPlan(device.size)
      await expect.poll(() => server.openStreams()).toContain(plan)
      const reads = server.reads.length
      const opens = server.opens.length
      server.gone(plan)
      await expect.poll(() => server.openStreams()).not.toContain(plan)
      // Longer than the fake's retry time (100 ms): a page that connects again would have done so by now.
      await new Promise((resolve) => setTimeout(resolve, 600))
      expect(server.reads.length).toBe(reads)
      expect(server.opens.length).toBe(opens)
      await expect.element(page.getByText(outageLine)).not.toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
      // The entries read before stay.
      await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
      expect(getReports()).toEqual([])
    })

    it(`still shows the outage line and reports once for another error kind, on ${device.name}`, async () => {
      const server = withPlan()
      await openPlan(device.size)
      await expect.poll(() => server.openStreams()).toContain(plan)
      server.fail(plan, 'herdr-unavailable')
      await expect.element(page.getByText('Transcript updates lost — connecting again')).toBeVisible()
      // It connects again and reads the transcript again.
      await expect.poll(() => server.reads.filter((c) => c === plan).length).toBe(2)
      expect(getReports().map((r) => r.error.message)).toEqual([
        'A chat transcript stream missed: ended herdr-unavailable (chat mac-mini/c1)',
      ])
    })
  }

  it('keeps the fixtures: ?source=fixtures reads no transcript', async () => {
    const server = withPlan()
    await setViewport(390, 844)
    router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/workspaces?source=fixtures'] }),
      defaultErrorComponent: RouteError,
    })
    view = await testRender(<RouterProvider router={router} />, rootErrorOptions)
    await userEvent.click(page.getByText('bridge themes', { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    expect(server.opens).toEqual([])
    expect(server.reads).toEqual([])
  })
})
