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
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'

// The files sent with a prompt (`UserEntry.files`, backend #325) show as
// chips on the owner's message in a live chat's transcript. Each test takes
// the owner's path: it opens the app with no URL parameters, taps Workspaces
// and a live chat (the phone and the tablet) or shows the workbench's panes
// (the desktop), with a stubbed server (`fetch`) whose transcript routes are
// the contract-checked fake (lib/fakeTranscriptServer.ts). A prompt with text
// and files shows the text and a chip for each name; a prompt of files alone
// shows only the chips, with no empty bubble; a long name truncates in its
// chip and never makes the transcript wider than the screen.
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
const sent = (id: string, text: string, files: string[]): TranscriptEntry => ({
  type: 'user',
  id,
  text,
  cut: false,
  files,
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

const devices = [
  { name: 'the phone', size: [390, 844] },
  { name: 'the tablet', size: [756, 1129] },
] as const

/** A transcript fake with plan's transcript as `entries`, and review's with one prompt. */
function withPlan(entries: TranscriptEntry[]) {
  const server = fakeTranscriptServer()
  server.set(plan, entries)
  server.set(review, [user('u9', 'Review the notes')])
  fakeServer(server)
  return server
}

/** The chips of the files sent with the prompts in `scope`, as their names. */
const chipNames = (scope: Element) =>
  [...scope.querySelectorAll('[role="group"][aria-label="Files sent"]')].map((group) =>
    [...group.children].map((chip) => chip.textContent),
  )

/** The message bubbles in `scope`: the library Message's root (an `article`). */
const bubbles = (scope: Element) => scope.querySelectorAll('article.message__root')
/** The text in the body of each bubble in `scope`, without the hidden author name. */
const bubbleTexts = (scope: Element) =>
  [...bubbles(scope)].map((bubble) => bubble.querySelector('.message__body')?.textContent)

// A name of the most characters a file name may have (255), with no space to break at.
const longName = `${'quarterly-report-final-'.repeat(10)}${'v'.repeat(21)}.pdf`

/** Fails unless `inner`'s box ends inside `outer`'s, and the page does not scroll sideways. */
function expectInside(inner: Element, outer: Element) {
  const a = inner.getBoundingClientRect()
  const b = outer.getBoundingClientRect()
  expect(a.width).toBeGreaterThan(0)
  expect(a.left).toBeGreaterThanOrEqual(b.left - 0.5)
  expect(a.right).toBeLessThanOrEqual(b.right + 0.5)
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth)
}

describe('the files sent with a prompt (UserEntry.files)', () => {
  for (const device of devices)
    it(`shows a prompt's text and a chip for each of its files on ${device.name}`, async () => {
      withPlan([sent('u1', 'Read these two', ['plan.pdf', 'shot.png'])])
      await tapWorkspaces(device.size)
      await tapChat('plan the slice')
      const chat = chatRegion('plan the slice')
      await expect.element(chat.getByText('Read these two')).toBeVisible()
      await expect.element(chat.getByRole('group', { name: 'Files sent' })).toBeVisible()
      expect(chipNames(chat.element())).toEqual([['plan.pdf', 'shot.png']])
      // The names are chips, not a line of the message's text.
      expect(chat.element().textContent).not.toContain('Files:')
      expect(bubbleTexts(chat.element())).toEqual(['Read these two'])
      expect(getReports()).toEqual([])
    })

  for (const device of devices)
    it(`shows a prompt of files alone as chips with no empty bubble on ${device.name}`, async () => {
      withPlan([sent('u1', '', ['notes.md']), sent('u2', 'And this', ['a.png'])])
      await tapWorkspaces(device.size)
      await tapChat('plan the slice')
      const chat = chatRegion('plan the slice')
      await expect.element(chat.getByText('And this')).toBeVisible()
      expect(chipNames(chat.element())).toEqual([['notes.md'], ['a.png']])
      // Only the prompt with text has a bubble.
      expect(bubbleTexts(chat.element())).toEqual(['And this'])
      expect(getReports()).toEqual([])
    })

  for (const device of devices)
    it(`truncates a long file name in its chip, inside the transcript, on ${device.name}`, async () => {
      withPlan([sent('u1', 'Long one', [longName, 'b.png'])])
      await tapWorkspaces(device.size)
      await tapChat('plan the slice')
      const chat = chatRegion('plan the slice')
      await expect.element(chat.getByText('Long one')).toBeVisible()
      const group = chat.getByRole('group', { name: 'Files sent' }).element()
      const [long, short] = [...group.children]
      if (long === undefined || short === undefined) throw new Error('no chips')
      expect(longName).toHaveLength(255)
      expect(long.textContent).toBe(longName)
      expectInside(long, chat.element())
      expectInside(group, chat.element())
      // The chip cuts its name, so the bubble under it stays as wide as its text allows.
      const bubble = bubbles(chat.element())[0]
      if (bubble === undefined) throw new Error('no bubble')
      expectInside(bubble, chat.element())
      expect(bubble.getBoundingClientRect().width).toBeLessThanOrEqual(chat.element().getBoundingClientRect().width)
      expect(getReports()).toEqual([])
    })

  for (const device of devices)
    it(`opens a long name in full with a tap on its chip on ${device.name}`, async () => {
      withPlan([sent('u1', 'Long one', [longName])])
      await tapWorkspaces(device.size)
      await tapChat('plan the slice')
      const chat = chatRegion('plan the slice')
      const chip = chat.getByRole('group', { name: 'Files sent' }).getByRole('button')
      await userEvent.click(chip)
      const full = page.getByRole('dialog', { name: 'File name' })
      await expect.element(full).toBeVisible()
      expect(full.element().textContent).toBe(longName)
      // The whole name wraps inside the popover, and the popover stays on the screen.
      const box = full.element().getBoundingClientRect()
      expect(box.left).toBeGreaterThanOrEqual(0)
      expect(box.right).toBeLessThanOrEqual(window.innerWidth)
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth)
      await userEvent.keyboard('{Escape}')
      await expect.element(full).not.toBeInTheDocument()
      expect(getReports()).toEqual([])
    })

  it('shows the chips in the desktop workbench, and a long name inside its pane', async () => {
    withPlan([sent('u1', 'Desk files', [longName, 'c.txt']), sent('u2', '', ['only.md'])])
    await tapWorkspaces([1512, 982])
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(page.getByText('Desk files')).toBeVisible()
    const pane = workbenchPane('plan the slice')
    if (pane === null) throw new Error('no pane')
    expect(chipNames(pane)).toEqual([[longName, 'c.txt'], ['only.md']])
    expect(bubbleTexts(pane)).toEqual(['Desk files'])
    const group = pane.querySelector('[role="group"][aria-label="Files sent"]')
    const long = group?.children[0]
    if (group === null || long === undefined) throw new Error('no chips')
    expectInside(long, pane)
    expect(getReports()).toEqual([])
  })
})
