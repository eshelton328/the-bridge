import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
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

// Backend #435: a live chat's Move to workspace, in the phone's sheet, the tablet's menu and the desktop's chat and pane
// menus, lists the other workspaces of the list (never its own, and no New workspace, which has no route) and posts
// `POST /api/chats/:chat/workspace` with `{ workspace }`. The chat's last workspace closes with it, so that move asks
// first. A 200 keeps the chat open, with the same ID, in its new workspace once the list read shows it there, and an
// emptied workspace leaves with that read. Each 409 state has one line, a 404 one line and a read of the list, and a
// 5xx a report. Each live test takes the owner's path: the app with no URL, then Workspaces, with the contract-checked
// fakes as the server; nothing reaches a real server.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const orchard = 'test-box/w-orchard'
const meadow = 'test-box/w-meadow'
const barn = 'test-box/w-barn'
const sketch = 'test-box/c1'
const notes = 'test-box/c2'
const pond = 'test-box/c3'
const fence = 'test-box/c4'

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
    { id: barn, label: 'barn', chats: [summary(fence, 'mend the fence')] },
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
const desktop = [1512, 982] as const
type Size = 'phone' | 'tablet' | 'desktop' | 'workbench'
const sizes: readonly (readonly [Size, readonly [number, number]])[] = [
  ['phone', phone],
  ['tablet', tablet],
  ['desktop', desktop],
  ['workbench', desktop],
]

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
    if (title !== 'sketch the plan' && title !== 'tidy the notes')
      await userEvent.click(page.getByRole('tab', { name: /meadow|barn/ }).first())
    await expect.poll(drawn).toContain(title)
    return
  }
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
}

const actionsButton = (title: string) => page.getByRole('button', { name: `${title} actions` })

/** Opens `title`'s actions and its Move to workspace list, and gives the names that list offers, in order. */
async function openMoveList(size: Size, title: string): Promise<string[]> {
  await userEvent.click(actionsButton(title).first())
  if (size === 'phone') {
    await userEvent.click(page.getByText('Move to workspace', { exact: true }))
    const picker = page.getByRole('radiogroup', { name: 'Move to workspace' })
    await expect.element(picker).toBeVisible()
    return picker
      .getByRole('radio')
      .elements()
      .map((e) => e.closest('label')?.textContent.trim() ?? e.getAttribute('aria-label') ?? '')
  }
  await userEvent.click(page.getByRole('menuitem', { name: 'Move to workspace' }))
  const picker = page.getByRole('menu', { name: 'Move to workspace' })
  await expect.element(picker.getByRole('menuitem').first()).toBeVisible()
  return picker
    .getByRole('menuitem')
    .elements()
    .map((e) => e.textContent.trim())
}

/** Picks `workspace` in the open Move to workspace list. */
async function pick(size: Size, workspace: string) {
  if (size === 'phone')
    await userEvent.click(
      page.getByRole('radiogroup', { name: 'Move to workspace' }).getByText(workspace, { exact: true }),
    )
  else await userEvent.click(page.getByRole('menuitem', { name: workspace, exact: true }))
}

/** The URL of a request. */
const urlOf = (input: RequestInfo | URL) =>
  typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

/** The number of list reads the page made. */
const listReads = () =>
  vi.mocked(globalThis.fetch).mock.calls.filter(([input]) => urlOf(input).endsWith('/api/workspaces')).length
/** Holds each request that `match` takes for `ms` before the stubbed server answers it. */
function slow(match: (path: string, init?: RequestInit) => boolean, ms: number) {
  const inner = globalThis.fetch
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (match(new URL(urlOf(input), window.location.origin).pathname, init))
        await new Promise((resolve) => setTimeout(resolve, ms))
      return inner(input, init)
    }),
  )
}

const line = (text: string) => page.getByText(text, { exact: true })
const moves = (fakes: Fakes) => fakes.list.edits.filter((e) => e.action === 'moveChat')
const notReady = (state: 'sameWorkspace' | 'working' | 'needsYou' | 'holdsServer') => () =>
  errorAnswer({ kind: 'chat-not-ready', state, message: 'not now', requestId: 'r-409' }, 409)

describe('Move to workspace on a live chat (backend #435)', () => {
  for (const [name] of sizes) {
    it(`offers the other workspaces only, with no New workspace, on the ${name}`, async () => {
      withChats()
      await openChat(name, 'sketch the plan')
      expect(await openMoveList(name, 'sketch the plan')).toEqual(['meadow', 'barn'])
      expect(page.getByText('New workspace', { exact: false }).elements()).toHaveLength(0)
    })

    it(`posts the workspace, and the chat stays open in it after the list read, on the ${name}`, async () => {
      const fakes = withChats()
      await openChat(name, 'sketch the plan')
      await openMoveList(name, 'sketch the plan')
      const before = listReads()
      await pick(name, 'meadow')
      await expect
        .poll(() => moves(fakes))
        .toEqual([{ action: 'moveChat', target: sketch, body: { workspace: meadow } }])
      // The same chat, open: on the phone and the tablet its view, on the desktop its pane or its view. herdr put it in
      // a new tab of meadow, which the workbench shows, as it does after a Move to tab.
      if (name === 'workbench') await expect.poll(drawn).toEqual(['sketch the plan'])
      else await expect.element(page.getByRole('heading', { name: 'sketch the plan' })).toBeVisible()
      // Its list is the new workspace's: meadow is its own now, so the list offers orchard and barn.
      // The list read after the move has come.
      await expect.poll(listReads, { timeout: 4000 }).toBeGreaterThan(before)
      expect(await openMoveList(name, 'sketch the plan')).toEqual(['orchard', 'barn'])
      expect(page.getByRole('alertdialog').elements()).toHaveLength(0)
    })

    it(`asks before it moves a workspace's last chat, and that workspace leaves after the read, on the ${name}`, async () => {
      const fakes = withChats()
      await openChat(name, 'survey the pond')
      expect(await openMoveList(name, 'survey the pond')).toEqual(['orchard', 'barn'])
      await pick(name, 'orchard')
      const dialog = page.getByRole('alertdialog', { name: 'Move survey the pond to orchard?' })
      await expect.element(dialog).toBeVisible()
      await expect.element(dialog.getByText('Moving it closes meadow.')).toBeVisible()
      expect(moves(fakes)).toEqual([])
      await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }))
      await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument()
      expect(moves(fakes)).toEqual([])
      await openMoveList(name, 'survey the pond')
      await pick(name, 'orchard')
      await userEvent.click(page.getByRole('alertdialog').getByRole('button', { name: 'Move', exact: true }))
      await expect
        .poll(() => moves(fakes))
        .toEqual([{ action: 'moveChat', target: pond, body: { workspace: orchard } }])
      expect(fakes.list.workspaces().map((w) => w.label)).toEqual(['orchard', 'barn'])
      await expect.poll(() => page.getByText('meadow', { exact: true }).elements().length).toBe(0)
      if (name === 'workbench') await expect.poll(drawn).toEqual(['survey the pond'])
      else await expect.element(page.getByRole('heading', { name: 'survey the pond' })).toBeVisible()
      // The workbench shows orchard, the chat's workspace now, never the closed meadow.
      if (name === 'workbench' || name === 'desktop') {
        if (name === 'desktop') await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
        await expect.element(page.getByRole('tab', { name: /orchard/, selected: true })).toBeVisible()
        await expect.poll(drawn).toContain('survey the pond')
      }
    })
  }

  it('opens the moved chat with a list read that comes after the 2.5 s wait', async () => {
    const fakes = withChats()
    await openChat('workbench', 'sketch the plan')
    // From the move on, each list read answers 3 s late: after the page's own read at 2.5 s gave up waiting.
    let moved = false
    slow((path, init) => {
      if (path.endsWith('/workspace') && init?.method === 'POST') moved = true
      return moved && path === '/api/workspaces'
    }, 3000)
    await openMoveList('workbench', 'sketch the plan')
    await pick('workbench', 'meadow')
    await expect.poll(() => moves(fakes)).toHaveLength(1)
    await expect.poll(drawn, { timeout: 9000 }).toEqual(['sketch the plan'])
    await expect.element(page.getByRole('tab', { name: /meadow/, selected: true })).toBeVisible()
  })

  it('opens the moved chat only with the list read that shows it moved, not with another change', async () => {
    const fakes = withChats()
    await openChat('workbench', 'sketch the plan')
    // A chat opens in barn while the move is on its way: the list read for it changes the list, but not the move.
    let opened = false
    slow((path, init) => {
      if (!(path.endsWith('/workspace') && init?.method === 'POST')) return false
      if (!opened) {
        opened = true
        fakes.list.putChat(barn, summary('test-box/c5', 'feed the hens'))
      }
      return true
    }, 1000)
    await openMoveList('workbench', 'sketch the plan')
    await pick('workbench', 'meadow')
    await expect.poll(() => moves(fakes), { timeout: 3000 }).toHaveLength(1)
    await expect.poll(drawn, { timeout: 6000 }).toEqual(['sketch the plan'])
    await expect.element(page.getByRole('tab', { name: /meadow/, selected: true })).toBeVisible()
  })

  it('offers no Move to workspace with no other workspace', async () => {
    withChats({ machine: 'test-box', workspaces: [list.workspaces[0] ?? { id: orchard, label: 'orchard', chats: [] }] })
    await openChat('tablet', 'sketch the plan')
    await userEvent.click(actionsButton('sketch the plan'))
    await expect.element(page.getByRole('menuitem', { name: 'New chat' })).toBeVisible()
    expect(page.getByRole('menuitem', { name: 'Move to workspace' }).elements()).toHaveLength(0)
  })

  for (const [state, text] of [
    ['sameWorkspace', 'It is already in meadow'],
    ['working', 'It is working — stop it first'],
    ['needsYou', 'It needs you — answer it first'],
    ['holdsServer', 'This chat runs the Bridge server, so it can’t move'],
  ] as const)
    it(`says "${text}" for 409 ${state}, and the chat stays where it is`, async () => {
      const fakes = withChats()
      fakes.list.answerEdits(notReady(state))
      await openChat('tablet', 'sketch the plan')
      await openMoveList('tablet', 'sketch the plan')
      await pick('tablet', 'meadow')
      await expect.element(line(text)).toBeVisible()
      expect(moves(fakes)).toHaveLength(1)
      await expect.element(page.getByRole('heading', { name: 'sketch the plan' })).toBeVisible()
      await userEvent.click(actionsButton('sketch the plan'))
      await userEvent.click(page.getByRole('menuitem', { name: 'Move to workspace' }))
      await expect.element(page.getByRole('menuitem', { name: 'meadow', exact: true })).toBeVisible()
      expect(page.getByRole('menuitem', { name: 'orchard', exact: true }).elements()).toHaveLength(0)
    })

  it('says the chat or workspace is gone for a 404, and reads the list again', async () => {
    const fakes = withChats()
    await openChat('phone', 'sketch the plan')
    await openMoveList('phone', 'sketch the plan')
    // barn closes on the Mac with no event before the move reaches the server.
    fakes.list.answerEdits(() => {
      fakes.list.answerEdits(undefined)
      return errorAnswer({ kind: 'not-found', path: '/api/x', message: 'Not found', requestId: 'r-404' }, 404)
    })
    const before = listReads()
    await pick('phone', 'barn')
    await expect.element(line('Not moved — that chat or workspace is gone')).toBeVisible()
    await expect.poll(listReads).toBeGreaterThan(before)
  })

  it('reports a 5xx with the kind and the status only', async () => {
    clearReports()
    onTestFinished(clearReports)
    const fakes = withChats()
    fakes.list.answerEdits(() =>
      errorAnswer({ kind: 'herdr-unavailable', message: 'herdr is down', requestId: 'r-503' }, 503),
    )
    await openChat('tablet', 'sketch the plan')
    await openMoveList('tablet', 'sketch the plan')
    await pick('tablet', 'meadow')
    await expect.element(line('Not moved — herdr-unavailable')).toBeVisible()
    const messages = getReports().map((r) => r.error.message)
    expect(messages).toContain('A workspace edit (moveChat) missed: herdr-unavailable 503')
    expect(messages.join(' ')).not.toContain('sketch')
    expect(messages.join(' ')).not.toContain('meadow')
  })

  it('sends one move at a time', async () => {
    const fakes = withChats()
    await openChat('tablet', 'sketch the plan')
    // The first move gets no answer while the second is picked.
    let answer: (() => void) | undefined
    const inner = globalThis.fetch
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (urlOf(input).endsWith('/workspace') && answer === undefined)
          await new Promise<void>((resolve) => {
            answer = resolve
          })
        return inner(input, init)
      }),
    )
    await openMoveList('tablet', 'sketch the plan')
    await pick('tablet', 'meadow')
    await expect.poll(() => answer !== undefined).toBe(true)
    await openMoveList('tablet', 'sketch the plan')
    await pick('tablet', 'barn')
    await expect.element(line('Not moved — wait for the last change')).toBeVisible()
    answer?.()
    await expect.poll(() => moves(fakes)).toEqual([{ action: 'moveChat', target: sketch, body: { workspace: meadow } }])
  })
})

describe('the fixtures keep their Move to workspace list', () => {
  it('lists the sample workspaces and New workspace in T4 on the tablet, and a pick posts nothing', async () => {
    const posts = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'POST') posts(urlOf(input))
        return Promise.reject(new TypeError('no server'))
      }),
    )
    await render(tablet, '/workspaces?state=tabletChatActions')
    await userEvent.click(page.getByRole('menuitem', { name: 'Move to workspace' }))
    await expect.element(page.getByRole('menuitem', { name: /New workspace/ })).toBeVisible()
    await userEvent.click(page.getByRole('menuitem', { name: /New workspace/ }))
    expect(posts).not.toHaveBeenCalled()
    expect(page.getByRole('alertdialog').elements()).toHaveLength(0)
  })

  it('lists New workspace in the phone sheet of M4', async () => {
    // M4 draws the sheet with Move to workspace's list open.
    await render(phone, '/workspaces?state=phoneChatActions')
    await expect.element(page.getByText(/New workspace/)).toBeVisible()
  })
})
