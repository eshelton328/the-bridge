import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { type FakeTranscriptServer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { type FakeWorkspacesServer, fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// Reviews R41 and R42: the live page offers only what a server route backs. The phone's and the tablet's list has
// Edit, which renames and orders the workspaces since backend #423 (WorkspacesLiveEdits.test.tsx); a live chat's
// actions are New chat (`POST /api/chats`), Fork (`POST /api/chats/:chat/fork`, backend #443,
// WorkspacesLiveFork.test.tsx), Side chat (`POST /api/chats/:chat/side`, backend #460, WorkspacesLiveSide.test.tsx),
// Move to workspace (`POST /api/chats/:chat/workspace`, backend #435,
// WorkspacesLiveMove.test.tsx), Rename chat (`POST /api/chats/:chat/rename`), Close pane… (`POST
// /api/chats/:chat/close`, after its confirm), Compact context… and Clear context… (`POST /api/chats/:chat/command`),
// and none of the sample's Subtask. The fixture states keep Edit and every
// action. Each live test takes the owner's path: the app with no URL, then
// Workspaces, with the contract-checked fakes as the server; nothing reaches a real server.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'test-box/w-orchard'
const sketch = 'test-box/c1'
const notes = 'test-box/c2'

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
      id: workspace,
      label: 'orchard',
      chats: [summary(sketch, 'sketch the plan'), summary(notes, 'tidy the notes')],
    },
    // A second workspace, so a chat has somewhere to move to.
    { id: 'test-box/w-meadow', label: 'meadow', chats: [summary('test-box/c3', 'survey the pond')] },
  ],
}

type Fakes = { chats: FakeTranscriptServer; list: FakeWorkspacesServer }

/** The stubbed server: the fakes' routes, and a rejection for anything else. */
function withChats(): Fakes {
  const chats = fakeTranscriptServer()
  for (const c of [sketch, notes, 'test-box/c3']) chats.set(c, [])
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

async function render(size: readonly [number, number], entry: string) {
  await setViewport(size[0], size[1])
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [entry] }) })
  view = await testRender(<RouterProvider router={router} />)
  return router
}

/** Opens the app at `size` with no URL and taps Workspaces in the tab bar. */
async function tapWorkspaces(size: readonly [number, number]) {
  const router = await render(size, '/')
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  expect(router.state.location.searchStr).toBe('')
}

/** Taps the live chat `title` in the list. */
async function tapChat(title: string) {
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
}

const actionsButton = (title: string) => page.getByRole('button', { name: `${title} actions` })
const editButton = () => page.getByRole('button', { name: 'Edit', exact: true })
const addButton = () => page.getByRole('button', { name: 'New chat or workspace', exact: true })

/** The labels of the open menu's rows (the tablet's menu) or of the sheet's rows (the phone's sheet), in order. */
const menuLabels = () =>
  page
    .getByRole('menuitem')
    .elements()
    .map((e) => e.textContent.trim())
const sheetLabels = () =>
  page
    .getByRole('radio')
    .elements()
    .map((e) => e.getAttribute('aria-label') ?? e.closest('label')?.textContent.trim() ?? '')

const kept = [
  'New chat',
  'Fork',
  'Side chat (/btw)',
  'Move to workspace',
  'Rename chat',
  'Close pane…',
  'Compact context…',
  'Clear context…',
]
// The phone's sheet names Rename as M4 does.
const keptOnPhone = [
  'New chat',
  'Fork',
  'Side chat',
  'Move to workspace',
  'Rename',
  'Close pane…',
  'Compact context…',
  'Clear context…',
]

describe('the live list has Edit (R41, backend #423)', () => {
  for (const [name, size] of [
    ['phone', phone],
    ['tablet', tablet],
  ] as const)
    it(`shows + and Edit on the ${name}`, async () => {
      withChats()
      await tapWorkspaces(size)
      await expect.element(page.getByText('sketch the plan', { exact: true })).toBeVisible()
      await expect.element(addButton()).toBeVisible()
      await expect.element(editButton()).toBeVisible()
    })

  for (const [entry, size] of [
    ['/workspaces?source=fixtures', phone],
    ['/workspaces?source=fixtures', tablet],
    ['/workspaces?state=phoneEdit', phone],
    ['/workspaces?state=tabletEdit', tablet],
  ] as const)
    it(`keeps Edit or Done in the fixtures: ${entry} at ${String(size[0])}`, async () => {
      await render(size, entry)
      await expect.element(addButton()).toBeVisible()
      await expect.element(page.getByRole('button', { name: /^(Edit|Done)$/ })).toBeVisible()
    })
})

describe("a live chat's actions are the eight the server backs (R42, backend #435, #443, #460)", () => {
  it('lists New chat, Fork, Side chat, Move to workspace, Rename chat, Close pane…, Compact context… and Clear context… in the tablet menu', async () => {
    withChats()
    await tapWorkspaces(tablet)
    await tapChat('sketch the plan')
    await userEvent.click(actionsButton('sketch the plan'))
    await expect.element(page.getByRole('menuitem', { name: 'New chat' })).toBeVisible()
    expect(menuLabels()).toEqual(kept)
  })

  it('lists the same eight in the phone sheet', async () => {
    withChats()
    await tapWorkspaces(phone)
    await tapChat('sketch the plan')
    await userEvent.click(actionsButton('sketch the plan'))
    await expect.element(page.getByText('Close pane…', { exact: true })).toBeVisible()
    for (const label of keptOnPhone) await expect.element(page.getByText(label, { exact: true })).toBeVisible()
    expect(page.getByText('Subtask', { exact: true }).elements()).toHaveLength(0)
    expect(sheetLabels()).toHaveLength(keptOnPhone.length)
  })

  it('starts a chat beside this one from New chat on the tablet', async () => {
    const fakes = withChats()
    await tapWorkspaces(tablet)
    await tapChat('sketch the plan')
    await userEvent.click(actionsButton('sketch the plan'))
    await userEvent.click(page.getByRole('menuitem', { name: 'New chat' }))
    await userEvent.fill(page.getByRole('textbox', { name: 'NAME · OPTIONAL' }), 'pear-trial')
    await userEvent.click(page.getByRole('button', { name: 'Start chat' }))
    await expect.poll(() => fakes.list.starts).toHaveLength(1)
    expect(fakes.list.starts[0]).toMatchObject({ kind: 'claude', name: 'pear-trial', place: { beside: sketch } })
  })

  it('closes the pane after its confirm on the tablet', async () => {
    const fakes = withChats()
    await tapWorkspaces(tablet)
    await tapChat('tidy the notes')
    await userEvent.click(actionsButton('tidy the notes'))
    await userEvent.click(page.getByRole('menuitem', { name: 'Close pane…' }))
    const dialog = page.getByRole('alertdialog', { name: 'Close tidy the notes?' })
    await expect.element(dialog).toBeVisible()
    expect(fakes.list.writes).toEqual([])
    await userEvent.click(dialog.getByRole('button', { name: 'Close' }))
    await expect
      .poll(() => fakes.list.writes.filter((w) => w.action === 'close'))
      .toEqual([{ chat: notes, action: 'close', body: { confirm: notes } }])
  })

  it('sends /compact and /clear from their dialogs on the tablet', async () => {
    const fakes = withChats()
    await tapWorkspaces(tablet)
    await tapChat('sketch the plan')
    await userEvent.click(actionsButton('sketch the plan'))
    await userEvent.click(page.getByRole('menuitem', { name: 'Compact context…' }))
    await userEvent.click(
      page.getByRole('dialog', { name: 'Compact the context' }).getByRole('button', { name: 'Compact' }),
    )
    await expect.poll(() => fakes.chats.commands).toEqual([{ chat: sketch, request: { command: 'compact' } }])
    await userEvent.click(actionsButton('sketch the plan'))
    await userEvent.click(page.getByRole('menuitem', { name: 'Clear context…' }))
    await userEvent.click(
      page.getByRole('alertdialog', { name: 'Clear the context?' }).getByRole('button', { name: 'Clear' }),
    )
    await expect.poll(() => fakes.chats.commands).toHaveLength(2)
    expect(fakes.chats.commands[1]).toEqual({ chat: sketch, request: { command: 'clear' } })
  })
})

describe('the fixture chat actions keep every item (R42)', () => {
  it('lists the sample actions in T4 on the tablet', async () => {
    await render(tablet, '/workspaces?state=tabletChatActions')
    for (const label of ['New chat', 'Fork', 'Side chat (/btw)', 'Subtask', 'Move to workspace', 'Rename chat'])
      await expect.element(page.getByRole('menuitem', { name: label })).toBeVisible()
  })

  it('lists the sample actions in M4 on the phone', async () => {
    await render(phone, '/workspaces?state=phoneChatActions')
    for (const label of ['Fork', 'Side chat', 'Subtask', 'Move to workspace', 'Rename', 'Close chat'])
      await expect.element(page.getByText(label, { exact: true })).toBeVisible()
  })
})
