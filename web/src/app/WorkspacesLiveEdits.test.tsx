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

// Reviews R41 and R42, with backend #423's routes: the live list's Edit renames a workspace (`POST
// /api/workspaces/:workspace/rename`) and orders the workspaces (`POST /api/workspaces/order`, the whole list), and a
// live chat's Rename gives its pane a label (`POST /api/chats/:chat/rename`). Each shows from the list read after
// `workspaces.changed`, never before. Edit mode draws no control without a route: no × to close a workspace, no
// chat handle, no Move to…. Each live test takes the owner's path: the app with no URL, then Workspaces, with the
// contract-checked fakes as the server; nothing reaches a real server.
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
function withChats(): Fakes {
  const chats = fakeTranscriptServer()
  for (const c of [sketch, notes, pond]) chats.set(c, [])
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

/** The workspace names in the list, top to bottom, by their handles. */
const handleOrder = () =>
  page
    .getByRole('button', { name: /^Move / })
    .elements()
    .map((e) => e.getAttribute('aria-label'))

const line = (text: string) => page.getByText(text, { exact: true })

describe("the live list's Edit (R41)", () => {
  for (const [name, size] of sizes) {
    it(`shows Edit, and edit mode offers only a handle and Rename for each workspace on the ${name}`, async () => {
      withChats()
      await tapWorkspaces(size)
      await tapEdit()
      for (const w of ['orchard', 'meadow']) {
        await expect.element(page.getByRole('button', { name: `Move ${w}` })).toBeVisible()
        await expect.element(page.getByRole('button', { name: `Rename ${w}` })).toBeVisible()
        expect(page.getByRole('button', { name: `Close ${w}` }).elements()).toHaveLength(0)
      }
      // No route closes a workspace, orders or renames chats from here, or moves a chat to a workspace.
      expect(page.getByRole('button', { name: /^Move to/ }).elements()).toHaveLength(0)
      expect(page.getByRole('searchbox').elements()).toHaveLength(0)
      await userEvent.click(page.getByText('sketch the plan', { exact: true }))
      expect(page.getByRole('searchbox').elements()).toHaveLength(0)
    })

    it(`renames a workspace and shows the name from the list read on the ${name}`, async () => {
      const fakes = withChats()
      await tapWorkspaces(size)
      await tapEdit()
      await userEvent.click(page.getByRole('button', { name: 'Rename orchard' }))
      const field = page.getByRole('searchbox', { name: 'Rename orchard' })
      await expect.element(field).toHaveFocus()
      await userEvent.fill(field, '  grove  ')
      await userEvent.keyboard('{Enter}')
      await expect
        .poll(() => fakes.list.edits)
        .toEqual([{ action: 'renameWorkspace', target: orchard, body: { name: 'grove' } }])
      await expect.element(page.getByRole('button', { name: 'Move grove' })).toBeVisible()
      expect(fakes.list.workspaces()).toEqual([
        { id: orchard, label: 'grove' },
        { id: meadow, label: 'meadow' },
      ])
    })

    it(`posts the whole new order from a drag and shows the list's order on the ${name}`, async () => {
      const fakes = withChats()
      await tapWorkspaces(size)
      await tapEdit()
      expect(handleOrder()).toEqual(['Move orchard', 'Move meadow'])
      await userEvent.dragAndDrop(
        page.getByRole('button', { name: 'Move orchard' }),
        page.getByText('survey the pond', { exact: true }),
      )
      await expect.poll(() => fakes.list.edits).toEqual([{ action: 'order', body: { workspaces: [meadow, orchard] } }])
      await expect.poll(handleOrder).toEqual(['Move meadow', 'Move orchard'])
      expect(fakes.list.workspaces().map((w) => w.id)).toEqual([meadow, orchard])
      // Done leaves edit mode with the list in the server's order.
      await userEvent.click(page.getByRole('button', { name: 'Done', exact: true }))
      const groups = page
        .getByText(/^(orchard|meadow)$/)
        .elements()
        .map((e) => e.textContent)
      expect(groups).toEqual(['meadow', 'orchard'])
    })

    it(`reads the list again with one line when the order is stale on the ${name}`, async () => {
      const fakes = withChats()
      await tapWorkspaces(size)
      await tapEdit()
      // Herdr made a workspace the page has not read: the server refuses an order that leaves it out.
      fakes.chats.set('test-box/c4', [])
      fakes.list.putWorkspace(
        { id: 'test-box/w-hedge', label: 'hedge', chats: [summary('test-box/c4', 'trim the hedge')] },
        true,
      )
      // The keyboard's way: the focused handle moves one place up.
      const handle = page.getByRole('button', { name: 'Move meadow' }).element()
      if (handle instanceof HTMLElement) handle.focus()
      await userEvent.keyboard('{ArrowUp}')
      await expect.poll(() => fakes.list.edits).toEqual([{ action: 'order', body: { workspaces: [meadow, orchard] } }])
      await expect.element(line('Not reordered — the list changed; here it is again')).toBeVisible()
      await expect.poll(handleOrder).toEqual(['Move orchard', 'Move meadow', 'Move hedge'])
    })
  }

  it('ends a drag only with the pointer that started it (a second finger sends nothing)', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapEdit()
    const handle = page.getByRole('button', { name: 'Move orchard' }).element()
    const box = handle.getBoundingClientRect()
    const below = page.getByText('survey the pond', { exact: true }).element().getBoundingClientRect().bottom + 4
    const pointer = (type: string, pointerId: number, clientY: number) =>
      new PointerEvent(type, { pointerId, isPrimary: pointerId === 1, button: 0, bubbles: true, clientY })
    handle.dispatchEvent(pointer('pointerdown', 1, box.top + box.height / 2))
    // A second finger goes down and up under meadow: it must not end the drag.
    window.dispatchEvent(pointer('pointerup', 2, below))
    await expect.element(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible()
    expect(fakes.list.edits).toEqual([])
    // The first finger lifts where it started: the order is the same, so nothing goes.
    window.dispatchEvent(pointer('pointerup', 1, box.top + box.height / 2))
    await expect.poll(handleOrder).toEqual(['Move orchard', 'Move meadow'])
    expect(fakes.list.edits).toEqual([])
  })

  it('shows the server’s 400 as one line and keeps the old name', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapEdit()
    fakes.list.answerEdits(() =>
      errorAnswer(
        { kind: 'invalid-input', issues: ['name: custom'], message: 'herdr refused that name', requestId: 'r-400' },
        400,
      ),
    )
    await userEvent.click(page.getByRole('button', { name: 'Rename meadow' }))
    await userEvent.fill(page.getByRole('searchbox', { name: 'Rename meadow' }), 'field')
    await userEvent.keyboard('{Enter}')
    await expect.element(line('Not renamed — herdr refused that name')).toBeVisible()
    expect(fakes.list.edits).toHaveLength(1)
    await expect.element(page.getByRole('button', { name: 'Move meadow' })).toBeVisible()
    expect(page.getByRole('button', { name: 'Move field' }).elements()).toHaveLength(0)
  })

  it('sends no empty name and no name over the contract’s limit', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapEdit()
    await userEvent.click(page.getByRole('button', { name: 'Rename meadow' }))
    await userEvent.fill(page.getByRole('searchbox', { name: 'Rename meadow' }), '   ')
    await userEvent.keyboard('{Enter}')
    await expect.element(page.getByRole('searchbox')).not.toBeInTheDocument()
    await userEvent.click(page.getByRole('button', { name: 'Rename meadow' }))
    await userEvent.fill(page.getByRole('searchbox', { name: 'Rename meadow' }), 'm'.repeat(65))
    await userEvent.keyboard('{Enter}')
    await expect.element(line('Not renamed — a name has 1 to 64 characters and no control character')).toBeVisible()
    expect(fakes.list.edits).toEqual([])
  })
})

describe("a live chat's Rename (R42)", () => {
  /** Taps the live chat `title` in the list. */
  async function tapChat(title: string) {
    await userEvent.click(page.getByText(title, { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
  }

  it('renames the chat from the tablet menu and shows the label from the list read', async () => {
    const fakes = withChats()
    await tapWorkspaces(tablet)
    await tapChat('sketch the plan')
    await userEvent.click(page.getByRole('button', { name: 'sketch the plan actions' }))
    await userEvent.click(page.getByRole('menuitem', { name: 'Rename chat' }))
    const field = page.getByRole('searchbox', { name: 'Rename sketch the plan' })
    await userEvent.fill(field, 'draw the plan')
    await userEvent.keyboard('{Enter}')
    await expect
      .poll(() => fakes.list.edits)
      .toEqual([{ action: 'renameChat', target: sketch, body: { name: 'draw the plan' } }])
    await expect.element(page.getByRole('heading', { name: 'draw the plan' })).toBeVisible()
  })

  it('renames the chat from the phone sheet', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapChat('survey the pond')
    await userEvent.click(page.getByRole('button', { name: 'survey the pond actions' }))
    await userEvent.click(page.getByRole('dialog', { name: 'survey the pond' }).getByText('Rename', { exact: true }))
    await userEvent.fill(page.getByRole('searchbox', { name: 'Rename survey the pond' }), 'map the pond')
    await userEvent.keyboard('{Enter}')
    await expect
      .poll(() => fakes.list.edits)
      .toEqual([{ action: 'renameChat', target: pond, body: { name: 'map the pond' } }])
    await expect.element(page.getByRole('heading', { name: 'map the pond' })).toBeVisible()
  })

  it('keeps the old name with one line when the rename misses', async () => {
    const fakes = withChats()
    await tapWorkspaces(tablet)
    await tapChat('tidy the notes')
    fakes.list.answerEdits(() =>
      errorAnswer({ kind: 'herdr-unavailable', message: 'herdr is down', requestId: 'r-503' }, 503),
    )
    await userEvent.click(page.getByRole('button', { name: 'tidy the notes actions' }))
    await userEvent.click(page.getByRole('menuitem', { name: 'Rename chat' }))
    await userEvent.fill(page.getByRole('searchbox', { name: 'Rename tidy the notes' }), 'sort the notes')
    await userEvent.keyboard('{Enter}')
    await expect.element(line('Not renamed — herdr-unavailable')).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'tidy the notes' })).toBeVisible()
    expect(page.getByRole('heading', { name: 'sort the notes' }).elements()).toHaveLength(0)
  })
})

describe('the fixtures keep every edit control (R41)', () => {
  it('draws × and no workspace drag handle in M2 on the phone', async () => {
    await render(phone, '/workspaces?state=phoneEdit')
    await expect.element(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible()
    expect(page.getByRole('button', { name: /^Close / }).elements().length).toBeGreaterThan(0)
    expect(page.getByRole('button', { name: /^Move (?!to)/ }).elements()).toHaveLength(0)
  })

  it('draws Move to… in T1 on the tablet', async () => {
    await render(tablet, '/workspaces?state=tabletEdit')
    await expect.element(page.getByRole('button', { name: 'Move to…' }).first()).toBeVisible()
    expect(page.getByRole('button', { name: /^Close / }).elements().length).toBeGreaterThan(0)
  })
})
