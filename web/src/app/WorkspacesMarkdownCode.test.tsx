import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { clearReports, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { type FakeTranscriptServer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'

// Chat rich text (2026-11-25, the owner: "rendering code snippets like a
// block of code ... mono space ... badge"): a reply's fenced code and inline
// code in a live chat's transcript. Each test takes the owner's path: it
// opens the app with no URL parameters, taps Workspaces and the live chat
// (the phone and the tablet) or shows the workbench's pane (the desktop),
// with a stubbed server whose transcript routes are the contract-checked fake
// (lib/fakeTranscriptServer.ts). The fence is the library's
// MarkdownCodeBlock: its label, syntax colours, a long line that scrolls in
// the block and never the page, and Copy, which writes the whole code
// through copyText and says Copied; a refused copy says Copy failed and
// reports the clipboard's error, never the code. Inline code is a badge.
// Every value is made up.
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

/** The reply's code: a TypeScript fence with a line far wider than a phone. */
const code = [
  'const total = sum(2, "sample")',
  `// ${'a made-up note that runs long enough to need sideways room '.repeat(3).trim()}`,
].join('\n')
const text = ['Run `pnpm verify` first, then:', '', '```ts', code, '```'].join('\n')

/** A transcript fake with plan's transcript as one reply of `text`. */
function withCodeReply() {
  const server = fakeTranscriptServer()
  server.set(plan, [reply('a1', text)])
  fakeServer(server)
  return server
}

/** Swaps the clipboard's writeText for this test: it keeps what it was given, or rejects with `error`. */
function fakeClipboard(error?: Error): string[] {
  const copied: string[] = []
  const { clipboard } = navigator
  const writeText = clipboard.writeText.bind(clipboard)
  clipboard.writeText = (value) => {
    if (error !== undefined) return Promise.reject(error)
    copied.push(value)
    return Promise.resolve()
  }
  onTestFinished(() => {
    clipboard.writeText = writeText
  })
  return copied
}

/** Fails unless `scope` shows the fence as a coloured, sideways-scrolling code block and the inline code as a badge. */
async function expectCodeBlock(scope: Element) {
  const block = scope.querySelector('[data-language="ts"]')
  if (block === null) throw new Error('no code block')
  // The first load of the highlighter in a test run compiles highlight.js, which can take some seconds.
  await expect.poll(() => block.querySelector('[data-kind="keyword"]')?.textContent, { timeout: 10_000 }).toBe('const')
  expect(block.querySelector('[data-kind="comment"]')).not.toBeNull()
  const body = block.querySelector('pre')
  if (body === null) throw new Error('no code body')
  expect(body.textContent).toBe(code)
  // The long line stays one line and scrolls inside the block; the page never scrolls sideways.
  expect(body.scrollWidth).toBeGreaterThan(body.clientWidth)
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth)
  const inline = [...scope.querySelectorAll('code')].find((el) => el.textContent === 'pnpm verify')
  if (inline === undefined) throw new Error('no inline code')
  expect(getComputedStyle(inline).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
}

const devices = [
  { name: 'the phone', size: [390, 844] },
  { name: 'the tablet', size: [744, 1133] },
] as const

describe("a reply's code (chat rich text)", () => {
  for (const device of devices)
    it(`draws a coloured code block and an inline badge, and copies the code, on ${device.name}`, async () => {
      withCodeReply()
      const copied = fakeClipboard()
      await tapWorkspaces(device.size)
      await tapChat('plan the slice')
      const chat = chatRegion('plan the slice')
      await expect.element(chat.getByText('ts', { exact: true })).toBeVisible()
      await expectCodeBlock(chat.element())
      await userEvent.click(chat.getByRole('button', { name: 'Copy code' }))
      await expect.poll(() => copied).toEqual([code])
      await expect.element(chat.getByText('Copied', { exact: true })).toBeVisible()
      expect(getReports()).toEqual([])
    })

  it('draws and copies it in the desktop workbench pane', async () => {
    withCodeReply()
    const copied = fakeClipboard()
    await tapWorkspaces([1512, 982])
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(page.getByText('pnpm verify', { exact: true })).toBeVisible()
    const pane = workbenchPane('plan the slice')
    if (pane === null) throw new Error('no pane')
    await expect.poll(() => pane.querySelector('[data-language="ts"]')).not.toBeNull()
    await expectCodeBlock(pane)
    await userEvent.click(page.getByRole('button', { name: 'Copy code' }))
    await expect.poll(() => copied).toEqual([code])
    expect(getReports()).toEqual([])
  })

  it('says Copy failed when the clipboard refuses, and reports its error without the code, on the phone', async () => {
    withCodeReply()
    fakeClipboard(new Error('sample clipboard fault'))
    await tapWorkspaces([390, 844])
    await tapChat('plan the slice')
    const chat = chatRegion('plan the slice')
    await userEvent.click(chat.getByRole('button', { name: 'Copy code' }))
    await expect.element(chat.getByText('Copy failed', { exact: true })).toBeVisible()
    await expect.poll(() => getReports().length).toBe(1)
    const [fault] = getReports()
    expect(fault?.error instanceof Error ? fault.error.message : fault?.error).toBe('sample clipboard fault')
    // The report holds the clipboard's error alone: none of the code.
    expect(JSON.stringify(fault)).not.toContain('total')
  })
})
