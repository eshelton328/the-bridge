import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { errorAnswer, type FakeTranscriptServer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { type FakeWorkspacesServer, fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// Review R41, with backend #427's route: × on a workspace in the live list's edit mode asks with a dialog that lists
// the chats that end with it, and Close posts `POST /api/workspaces/:workspace/close` with `{ confirm, panes }`, the
// number of chats the dialog listed. The workspace leaves with the list read after `workspaces.changed`, never
// before. Each 409 state has one line; `panesChanged` reads the list again and asks again with the new list. Each live
// test takes the owner's path: the app with no URL, then Workspaces, with the contract-checked fakes as the server;
// nothing reaches a real server.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const orchard = 'test-box/w-orchard'
const meadow = 'test-box/w-meadow'
const sketch = 'test-box/c1'
const notes = 'test-box/c2'
const pond = 'test-box/c3'

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
    { id: orchard, label: 'orchard', chats: [summary(sketch, 'sketch the plan'), summary(notes, 'tidy the notes')] },
    { id: meadow, label: 'meadow', chats: [summary(pond, 'survey the pond')] },
  ],
}

type Fakes = { chats: FakeTranscriptServer; list: FakeWorkspacesServer }

/** The stubbed server: the fakes' routes, and a rejection for anything else. */
function withChats(listed: typeof list = list): Fakes {
  const chats = fakeTranscriptServer()
  for (const c of listed.workspaces.flatMap((w) => w.chats)) chats.set(c.id, [])
  const workspaces = fakeWorkspacesServer(chats, listed)
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
const sizes = [
  ['phone', phone],
  ['tablet', tablet],
] as const

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
  await expect.element(page.getByText('sketch the plan', { exact: true })).toBeVisible()
}

/** Taps Edit and waits for Done. */
async function tapEdit() {
  await userEvent.click(page.getByRole('button', { name: 'Edit', exact: true }))
  await expect.element(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible()
}

const line = (text: string) => page.getByText(text, { exact: true })

const notReady = (state: 'working' | 'needsYou' | 'panesChanged' | 'holdsServer' | 'group') => () =>
  errorAnswer({ kind: 'workspace-not-ready', state, message: 'not now', requestId: 'r-409' }, 409)

/** Taps × on orchard and gives its dialog. */
async function askOrchard() {
  await userEvent.click(page.getByRole('button', { name: 'Close orchard' }))
  const dialog = page.getByRole('alertdialog', { name: 'Close orchard?' })
  await expect.element(dialog).toBeVisible()
  return dialog
}

/** The chats the open dialog lists, in order. */
const listedChats = () =>
  page
    .getByRole('alertdialog')
    .getByRole('listitem')
    .elements()
    .map((e) => e.textContent)

const orchardShown = () => page.getByRole('button', { name: 'Move orchard' }).elements().length

describe("the live list's × (R41, backend #427)", () => {
  for (const [name, size] of sizes) {
    it(`asks with the workspace, its chats and their number, and Cancel sends nothing, on the ${name}`, async () => {
      const fakes = withChats()
      await tapWorkspaces(size)
      await tapEdit()
      await expect.element(page.getByRole('button', { name: 'Close meadow' })).toBeVisible()
      const dialog = await askOrchard()
      await expect.element(dialog.getByText('These 2 chats end with it. This can’t be undone.')).toBeVisible()
      expect(listedChats()).toEqual(['sketch the plan', 'tidy the notes'])
      await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }))
      await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument()
      expect(fakes.list.edits).toEqual([])
      expect(orchardShown()).toBe(1)
    })

    it(`posts the confirm and the count on Close, and the workspace leaves after the event, on the ${name}`, async () => {
      const fakes = withChats()
      await tapWorkspaces(size)
      await tapEdit()
      const dialog = await askOrchard()
      await userEvent.click(dialog.getByRole('button', { name: 'Close', exact: true }))
      await expect
        .poll(() => fakes.list.edits)
        .toEqual([{ action: 'close', target: orchard, body: { confirm: orchard, panes: 2 } }])
      await expect.poll(orchardShown).toBe(0)
      await expect.element(page.getByRole('button', { name: 'Move meadow' })).toBeVisible()
      expect(page.getByText('sketch the plan', { exact: true }).elements()).toHaveLength(0)
    })

    it(`asks again with the new list when the server counts other chats, on the ${name}`, async () => {
      const fakes = withChats()
      await tapWorkspaces(size)
      await tapEdit()
      const dialog = await askOrchard()
      expect(listedChats()).toEqual(['sketch the plan', 'tidy the notes'])
      // A chat opens in orchard as the server counts, with no event: the server's count is not the dialog's.
      fakes.list.answerEdits(() => {
        fakes.list.answerEdits(undefined)
        fakes.list.putChat(orchard, summary('test-box/c4', 'water the trees'), true)
        return notReady('panesChanged')()
      })
      await userEvent.click(dialog.getByRole('button', { name: 'Close', exact: true }))
      await expect.poll(listedChats).toEqual(['sketch the plan', 'tidy the notes', 'water the trees'])
      await expect
        .element(page.getByRole('alertdialog').getByText('These 3 chats end with it. This can’t be undone.'))
        .toBeVisible()
      expect(fakes.list.edits).toHaveLength(1)
      await userEvent.click(page.getByRole('alertdialog').getByRole('button', { name: 'Close', exact: true }))
      await expect.poll(orchardShown).toBe(0)
      expect(fakes.list.edits.map((e) => e.body)).toEqual([
        { confirm: orchard, panes: 2 },
        { confirm: orchard, panes: 3 },
      ])
    })
  }

  const states = [
    ['working', 'A chat in it is working — stop it first'],
    ['needsYou', 'A chat in it needs you'],
    ['holdsServer', 'This workspace runs the Bridge server, so it can’t close from here'],
    ['group', 'Close it in herdr'],
  ] as const
  for (const [state, text] of states)
    for (const [name, size] of sizes)
      it(`shows one line for ${state} and keeps the workspace, on the ${name}`, async () => {
        const fakes = withChats()
        await tapWorkspaces(size)
        await tapEdit()
        fakes.list.answerEdits(notReady(state))
        await userEvent.click((await askOrchard()).getByRole('button', { name: 'Close', exact: true }))
        await expect.element(line(text)).toBeVisible()
        await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument()
        expect(orchardShown()).toBe(1)
        // No force: the line offers nothing but Dismiss.
        expect(page.getByRole('button', { name: /force/i }).elements()).toHaveLength(0)
      })

  it('shows the server’s 400 as one line and reads the list again', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapEdit()
    fakes.list.answerEdits(() =>
      errorAnswer(
        {
          kind: 'invalid-input',
          issues: ['confirm'],
          message: 'the confirm does not name this workspace',
          requestId: 'r-400',
        },
        400,
      ),
    )
    fakes.list.putWorkspace({ id: 'test-box/w-hedge', label: 'hedge', chats: [] }, true)
    await userEvent.click((await askOrchard()).getByRole('button', { name: 'Close', exact: true }))
    await expect.element(line('Not closed — the confirm does not name this workspace')).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Move hedge' })).toBeVisible()
    expect(orchardShown()).toBe(1)
  })

  it('shows one line for a workspace that is gone and reads the list again', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapEdit()
    fakes.list.answerEdits(() =>
      errorAnswer({ kind: 'not-found', path: '/api/x', message: 'Not found', requestId: 'r-404' }, 404),
    )
    fakes.list.putWorkspace({ id: 'test-box/w-hedge', label: 'hedge', chats: [] }, true)
    await userEvent.click((await askOrchard()).getByRole('button', { name: 'Close', exact: true }))
    await expect.element(line('Not closed — that workspace is gone')).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Move hedge' })).toBeVisible()
  })

  it('shows a 5xx as one line by kind and keeps the workspace', async () => {
    const fakes = withChats()
    await tapWorkspaces(tablet)
    await tapEdit()
    fakes.list.answerEdits(() =>
      errorAnswer({ kind: 'herdr-unavailable', message: 'herdr is down', requestId: 'r-503' }, 503),
    )
    await userEvent.click((await askOrchard()).getByRole('button', { name: 'Close', exact: true }))
    await expect.element(line('Not closed — herdr-unavailable')).toBeVisible()
    expect(orchardShown()).toBe(1)
  })

  it('draws no × on a workspace with no chats, as a close needs one', async () => {
    const fakes = withChats()
    fakes.list.putWorkspace({ id: 'test-box/w-hedge', label: 'hedge', chats: [] }, true)
    await tapWorkspaces(phone)
    await tapEdit()
    await expect.element(page.getByRole('button', { name: 'Rename hedge' })).toBeVisible()
    expect(page.getByRole('button', { name: 'Close hedge' }).elements()).toHaveLength(0)
  })
})

describe('the fixtures keep their close dialog (M13)', () => {
  it('asks with the frame’s words in M13 on the phone, with no list of chats', async () => {
    await render(phone, '/workspaces?state=phoneCloseWorkspace')
    const dialog = page.getByRole('alertdialog', { name: 'Close omni-brain?' })
    await expect.element(dialog.getByText(/drift check and the brain git shell all end with it/)).toBeVisible()
    expect(dialog.getByRole('listitem').elements()).toHaveLength(0)
  })
})
