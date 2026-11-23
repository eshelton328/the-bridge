import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { ChatSummary } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { errorAnswer, type FakeTranscriptServer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { type FakeWorkspacesServer, fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// Backend #443: a live Claude chat's Fork, in the phone's sheet, the tablet's menu and the desktop's chat and pane
// menus, posts `POST /api/chats/:chat/fork` with a new create ID and nothing else, so the server names the copy
// "<name>-fork" and puts it beside the chat. The forked chat opens as a new chat does, once the list shows it ready or
// needing the owner; one that needs the owner says so under its composer. A Codex chat and a shell, which the server
// refuses (409 noSession), have no Fork. Each refusal has one line, a 404 one line and a read of the list, and a 5xx a
// report. Each live test takes the owner's path: the app with no URL, then Workspaces, with the contract-checked fakes
// as the server; nothing reaches a real server.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const orchard = 'test-box/w-orchard'
const meadow = 'test-box/w-meadow'
const sketch = 'test-box/c1'
const notes = 'test-box/c2'
const brief = 'test-box/c3'
const logs = 'test-box/c4'
/** The ID the fake gives the first chat it starts or forks. */
const forked = 'test-box/new1'

/** A listed chat as the server sends it; the fake checks it against the contract. */
type Listed = {
  id: string
  kind: 'claude' | 'codex' | 'shell'
  title: string
  model: string
  contextUsed: null
  modelId: 'opus' | null
  effort: null
  pane: string
  status: 'idle'
  parent: null
}
const summary = (id: string, title: string): Listed => ({
  id,
  kind: 'claude',
  title,
  model: 'claude-opus-5-5',
  contextUsed: null,
  modelId: 'opus',
  effort: null,
  pane: `${id}-pane`,
  status: 'idle',
  parent: null,
})
const list = {
  machine: 'test-box',
  workspaces: [
    { id: orchard, label: 'orchard', chats: [summary(sketch, 'sketch the plan'), summary(notes, 'tidy the notes')] },
    {
      id: meadow,
      label: 'meadow',
      chats: [
        { ...summary(brief, 'draft the brief'), kind: 'codex', model: 'gpt-5.5', modelId: null } satisfies Listed,
        { ...summary(logs, 'tail logs'), kind: 'shell', model: 'zsh', modelId: null } satisfies Listed,
      ],
    },
  ],
}

type Fakes = { chats: FakeTranscriptServer; list: FakeWorkspacesServer }

/** The stubbed server: the fakes' routes, and a rejection for anything else. */
function withChats(): Fakes {
  const chats = fakeTranscriptServer()
  for (const c of list.workspaces.flatMap((w) => w.chats)) chats.set(c.id, [])
  const workspaces = fakeWorkspacesServer(chats, list)
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const answer = chats.handle(path, init) ?? workspaces.handle(path, init)
      if (answer !== undefined) return Promise.resolve(answer)
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
  return { chats, list: workspaces }
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
  resetAllStores()
  await setViewport(1512, 982)
})

const phone = [390, 844] as const
const tablet = [744, 1133] as const
const desktop = [1512, 982] as const
type Size = 'phone' | 'tablet' | 'desktop' | 'workbench'
const sizes: readonly Size[] = ['phone', 'tablet', 'desktop', 'workbench']

async function render(size: readonly [number, number], entry: string) {
  await setViewport(size[0], size[1])
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [entry] }) })
  view = await testRender(<RouterProvider router={router} />)
  return router
}

/** The titles of the workbench's panes, by their Maximise or Unzoom buttons, in the page's order. */
const drawn = () =>
  [...document.querySelectorAll('button[aria-label^="Maximise "], button[aria-label^="Unzoom "]')].map((b) =>
    (b.getAttribute('aria-label') ?? '').replace(/^(Maximise|Unzoom) /, ''),
  )

/**
 * Opens the app at `size` with no URL, taps Workspaces in the tab bar and opens `title`: a tap on its row on the phone,
 * the tablet and the desktop's sidebar; the desktop's workbench hides the sidebar and shows it in a pane.
 */
async function openChat(size: Size, title: string) {
  const router = await render(size === 'phone' ? phone : size === 'tablet' ? tablet : desktop, '/')
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  expect(router.state.location.searchStr).toBe('')
  await expect.element(page.getByText('sketch the plan', { exact: true }).first()).toBeVisible()
  if (size === 'workbench') {
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    if (title === 'draft the brief') await userEvent.click(page.getByRole('tab', { name: /meadow/ }))
    await expect.poll(drawn).toContain(title)
    return
  }
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
}

const actionsButton = (title: string) => page.getByRole('button', { name: `${title} actions` })

/** Opens `title`'s actions: the phone's sheet, or the tablet's or the desktop's menu. */
async function openActions(size: Size, title: string) {
  await userEvent.click(actionsButton(title).first())
  if (size === 'phone') await expect.element(page.getByText('New chat', { exact: true })).toBeVisible()
  else await expect.element(page.getByRole('menuitem', { name: 'New chat' })).toBeVisible()
}

/** The Fork row of the open actions. */
const forkRow = (size: Size) =>
  size === 'phone' ? page.getByText('Fork', { exact: true }) : page.getByRole('menuitem', { name: 'Fork', exact: true })

/** Opens `title`'s actions and taps Fork. */
async function tapFork(size: Size, title: string) {
  await openActions(size, title)
  await userEvent.click(forkRow(size))
}

/** Whether the forked chat shows: its view or its pane. */
async function expectOpen(size: Size, title: string) {
  if (size === 'workbench') await expect.poll(drawn).toContain(title)
  else await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
}

/** The URL of a request. */
const urlOf = (input: RequestInfo | URL) =>
  typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

/** The number of list reads the page made. */
const listReads = () =>
  vi.mocked(globalThis.fetch).mock.calls.filter(([input]) => urlOf(input).endsWith('/api/workspaces')).length

const line = (text: string) => page.getByText(text, { exact: true })
const notReady = (state: 'noSession' | 'nameTaken' | 'folderNotAllowed') => () =>
  errorAnswer({ kind: 'chat-not-ready', state, message: 'not now', requestId: 'r-409' }, 409)

describe('Fork on a live Claude chat (backend #443)', () => {
  for (const size of sizes) {
    it(`posts a create ID only, and the forked chat opens once the list shows it, on the ${size}`, async () => {
      const fakes = withChats()
      await openChat(size, 'sketch the plan')
      await tapFork(size, 'sketch the plan')
      await expect.poll(() => fakes.list.forks).toHaveLength(1)
      const [first] = fakes.list.forks
      expect(first?.chat).toBe(sketch)
      expect(Object.keys(first?.body ?? {})).toEqual(['createId'])
      await expectOpen(size, 'sketch the plan-fork')
      // The chat it came from goes on: the list still has it.
      expect(fakes.list.chats().map((c) => c.id)).toContain(sketch)
    })
  }

  it('opens a forked chat that needs the owner, and says so under its composer', async () => {
    const fakes = withChats()
    fakes.list.startAs('needsYou')
    await openChat('phone', 'sketch the plan')
    await tapFork('phone', 'sketch the plan')
    await expectOpen('phone', 'sketch the plan-fork')
    await expect.element(page.getByText('This chat needs you on the Mac')).toBeVisible()
    expect(fakes.list.forks).toHaveLength(1)
  })

  it('opens a forked chat that was still starting once the list shows it ready', async () => {
    const fakes = withChats()
    fakes.list.startAs('starting')
    await openChat('tablet', 'sketch the plan')
    await tapFork('tablet', 'sketch the plan')
    await expect.poll(() => fakes.list.forks).toHaveLength(1)
    // Listed, but not ready: the page waits and keeps the chat it came from open.
    await expect.poll(() => fakes.list.chats().map((c) => c.id)).toContain(forked)
    await expect.element(page.getByRole('heading', { name: 'sketch the plan' })).toBeVisible()
    fakes.list.setStatus(forked, 'idle')
    await expectOpen('tablet', 'sketch the plan-fork')
  })

  it('stops waiting with one line when the list shows the forked pane as a shell (#443 real run)', async () => {
    const fakes = withChats()
    fakes.list.startAs('starting')
    await openChat('tablet', 'sketch the plan')
    await tapFork('tablet', 'sketch the plan')
    await expect.poll(() => fakes.list.chats().map((c) => c.id)).toContain(forked)
    // Claude ended in the new pane ("No conversation found"): herdr lists the pane's shell in its place.
    fakes.list.putOnPane(
      forked,
      ChatSummary.parse({
        ...summary('test-box/term-9', 'zsh'),
        kind: 'shell',
        model: 'zsh',
        modelId: null,
        pane: `${forked}-pane`,
      }),
    )
    await expect.element(line('Fork did not start — Claude ended in its new pane; look at it on the Mac')).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'sketch the plan' })).toBeVisible()
  })

  for (const size of ['phone', 'tablet', 'desktop', 'workbench'] as const)
    it(`offers no Fork for a Codex chat or a shell, which the server refuses, on the ${size}`, async () => {
      const fakes = withChats()
      await openChat(size, 'draft the brief')
      await openActions(size, 'draft the brief')
      expect(forkRow(size).elements()).toHaveLength(0)
      await userEvent.keyboard('{Escape}')
      if (size === 'workbench') {
        await expect.poll(drawn).toContain('tail logs')
        await openActions(size, 'tail logs')
        expect(forkRow(size).elements()).toHaveLength(0)
      }
      expect(fakes.list.forks).toEqual([])
    })

  for (const [state, text] of [
    ['noSession', 'Not forked — only a Claude chat can fork'],
    ['nameTaken', 'Not forked — another chat has the fork’s name'],
    ['folderNotAllowed', 'Not forked — the chat’s folder is not allowed for new chats'],
  ] as const)
    it(`says "${text}" for 409 ${state}, and the chat stays open`, async () => {
      const fakes = withChats()
      fakes.list.answerForks(notReady(state))
      await openChat('tablet', 'sketch the plan')
      await tapFork('tablet', 'sketch the plan')
      await expect.element(line(text)).toBeVisible()
      expect(fakes.list.forks).toHaveLength(1)
      await expect.element(page.getByRole('heading', { name: 'sketch the plan' })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: 'Dismiss' }))
      await expect.element(line(text)).not.toBeInTheDocument()
    })

  it('says the chat is gone for a 404, and reads the list again', async () => {
    const fakes = withChats()
    fakes.list.answerForks(() =>
      errorAnswer({ kind: 'not-found', path: '/api/x', message: 'Not found', requestId: 'r-404' }, 404),
    )
    await openChat('phone', 'sketch the plan')
    const before = listReads()
    await tapFork('phone', 'sketch the plan')
    await expect.element(line('Not forked — that chat is gone')).toBeVisible()
    await expect.poll(listReads).toBeGreaterThan(before)
  })

  it('reports a 5xx with the kind and the status only', async () => {
    clearReports()
    onTestFinished(clearReports)
    const fakes = withChats()
    fakes.list.answerForks(() => errorAnswer({ kind: 'internal', message: 'the fork failed', requestId: 'r-500' }, 500))
    await openChat('desktop', 'sketch the plan')
    await tapFork('desktop', 'sketch the plan')
    await expect.element(line('Not forked — internal')).toBeVisible()
    const messages = getReports().map((r) => r.error.message)
    expect(messages).toContain('A workspace edit (forkChat) missed: internal 500')
    expect(messages.join(' ')).not.toContain('sketch')
  })
})
