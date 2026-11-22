import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { createClientErrorSender, type PostReport } from '../errors/clientErrorSender.ts'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { addSink, clearReports, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { errorAnswer, type FakeTranscriptServer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { type FakeWorkspacesServer, fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { markApp } from './appMarker.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// Slice W2: a live chat's pane layout writes, focus, zoom, swap and close
// (backend #333). Each test takes the owner's path: it opens the app with no
// URL parameters and taps Workspaces, then a chat on the phone and the
// tablet, or hides the sidebar for the desktop workbench, with a stubbed
// server whose routes are the contract-checked fakes. The page never moves a
// pane itself: each write's 204 is followed by the fake's `layout.changed`,
// and the page reads the layout again. A focus goes only on a tap on a
// pane's header or a Send in it, never on a click in the transcript or the
// composer, a scroll or a text selection, and never on the phone.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const live = 'mac-mini/w-live'
const solo = 'mac-mini/w-solo'
const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'
const logs = 'mac-mini/c3'
const drift = 'mac-mini/c4'
const lone = 'mac-mini/c5'

const summary = (id: string, kind: 'claude' | 'shell', title: string) => ({
  id,
  kind,
  title,
  model: kind === 'shell' ? 'zsh' : 'claude-opus-5-5',
  contextUsed: null,
  modelId: null,
  effort: null,
  pane: `${id}-pane`,
  status: 'idle',
  parent: null,
})
// live work: plan, review and the shell tail logs in its first (active) tab, drift check in a second tab. solo work:
// one chat alone in its tab.
const list = {
  machine: 'mac-mini',
  workspaces: [
    {
      id: live,
      label: 'live work',
      chats: [
        summary(plan, 'claude', 'plan the slice'),
        summary(review, 'claude', 'review notes'),
        summary(logs, 'shell', 'tail logs'),
        summary(drift, 'claude', 'drift check'),
      ],
    },
    { id: solo, label: 'solo work', chats: [summary(lone, 'claude', 'lone chat')] },
  ],
}
const tabs = { [live]: [[plan, review, logs], [drift]] }

const entry = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })

type Fakes = {
  chats: FakeTranscriptServer
  list: FakeWorkspacesServer
  /** The workspace ID of each layout read, and the count of list reads, in order. */
  layoutReads: string[]
  listReads: () => number
}

function withChats(): Fakes {
  const chats = fakeTranscriptServer()
  chats.set(plan, [entry('u1', 'Fix the build')])
  chats.set(review, [entry('u2', 'Review the notes')])
  chats.set(drift, [])
  chats.set(lone, [])
  const workspaces = fakeWorkspacesServer(chats, list, { tabs })
  const layoutReads: string[] = []
  let lists = 0
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const layout = /^\/api\/workspaces\/([^/]+)\/layout$/.exec(path)
      if (layout !== null) layoutReads.push(decodeURIComponent(layout[1] ?? ''))
      if (path === '/api/workspaces') lists += 1
      const answer = chats.handle(path, init) ?? workspaces.handle(path, init)
      if (answer !== undefined) return Promise.resolve(answer)
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
  return { chats, list: workspaces, layoutReads, listReads: () => lists }
}

let view: { unmount: () => Promise<void> } | undefined
const cleanups: (() => void)[] = []

stubLiveServer()
answerLateServerReads()

afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) cleanup()
  await view?.unmount()
  view = undefined
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  resetRetries()
  queryClient.clear()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

const phone = [390, 844] as const
const tablet = [756, 1129] as const
const desktop = [1512, 982] as const

async function tapWorkspaces(size: readonly [number, number]) {
  await setViewport(size[0], size[1])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    defaultErrorComponent: RouteError,
  })
  const before = new Set(document.body.children)
  view = await testRender(
    <>
      <RouterProvider router={router} />
      <ErrorTray />
    </>,
    rootErrorOptions,
  )
  // The app gets the window's height, as main.ts gives it, so each pane shows its transcript.
  const container = [...document.body.children].find((child) => !before.has(child))
  if (container === undefined) throw new Error('no view container')
  container.id = 'root'
  onTestFinished(markApp())
  onTestFinished(() => {
    container.removeAttribute('id')
  })
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  expect(router.state.location.searchStr).toBe('')
}

/** The desktop workbench: Workspaces, then the sidebar hidden, with live work's three panes drawn. */
async function showPanes() {
  await tapWorkspaces(desktop)
  await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
  await expect.poll(drawn).toEqual(['plan the slice', 'review notes', 'tail logs'])
  // The page loads once more when the event stream opens; let it settle before a test acts.
  await new Promise((resolve) => setTimeout(resolve, 300))
}

/** Taps the live chat `title` in the list (phone, tablet) and waits for its header. */
async function tapChat(title: string) {
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
}

/** The titles of the panes drawn, by their Maximise or Unzoom buttons, in the page's order. */
const drawn = () =>
  [...document.querySelectorAll('button[aria-label^="Maximise "], button[aria-label^="Unzoom "]')].map((b) =>
    (b.getAttribute('aria-label') ?? '').replace(/^(Maximise|Unzoom) /, ''),
  )

const region = (title: string) => page.getByRole('region', { name: title })
const actionsButton = (title: string) => page.getByRole('button', { name: `${title} actions` })

/** The layout writes the page posted, without the chats' transcripts or text. */
const writesOf = (fakes: Fakes) => fakes.list.writes.map((w) => ({ chat: w.chat, action: w.action, body: w.body }))

/** Waits `ms` so a call the page should not make has the time to show. */
const quiet = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

/** Opens the pane menu of `title` and picks `label`. */
async function pickInMenu(title: string, label: string) {
  await userEvent.click(actionsButton(title))
  await userEvent.click(page.getByRole('menuitem', { name: label }))
}

describe('zoom (W2)', () => {
  it('shows only the zoomed pane on the event, and Unzoom brings the split back', async () => {
    const fakes = withChats()
    await showPanes()
    await pickInMenu('review notes', 'Zoom pane')
    await expect.poll(drawn).toEqual(['review notes'])
    expect(writesOf(fakes)).toEqual([{ chat: review, action: 'zoom', body: { zoomed: true } }])
    expect(fakes.chats.paths).toEqual([])
    // The status bar says the tab is zoomed; the header's button ends it.
    await expect.element(page.getByText('live work · zoomed · 1 of 3 panes')).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Unzoom review notes' }))
    await expect.poll(drawn).toEqual(['plan the slice', 'review notes', 'tail logs'])
    expect(writesOf(fakes)[1]).toEqual({ chat: review, action: 'zoom', body: { zoomed: false } })
    expect(getReports()).toEqual([])
  })

  it("zooms with the pane header's Maximise and offers Unzoom pane in the zoomed pane's menu", async () => {
    const fakes = withChats()
    await showPanes()
    await userEvent.click(page.getByRole('button', { name: 'Maximise tail logs' }))
    await expect.poll(drawn).toEqual(['tail logs'])
    await userEvent.click(actionsButton('tail logs'))
    await expect.element(page.getByRole('menuitem', { name: 'Unzoom pane' })).toBeVisible()
    expect(page.getByRole('menuitem', { name: 'Zoom pane' }).elements()).toHaveLength(0)
    await userEvent.click(page.getByRole('menuitem', { name: 'Unzoom pane' }))
    await expect.poll(drawn).toHaveLength(3)
    expect(writesOf(fakes).map((w) => w.body)).toEqual([{ zoomed: true }, { zoomed: false }])
  })

  it('stays pending until the event, and reads the layout itself when none comes in 2.5 s', async () => {
    const fakes = withChats()
    await showPanes()
    fakes.list.quietWrites(true)
    const before = fakes.layoutReads.length
    await userEvent.click(page.getByRole('button', { name: 'Maximise plan the slice' }))
    // No optimistic layout: the split stays, and Maximise is off while the write waits.
    await expect.element(page.getByRole('button', { name: 'Maximise plan the slice' })).toBeDisabled()
    await quiet(1500)
    expect(drawn()).toEqual(['plan the slice', 'review notes', 'tail logs'])
    expect(fakes.layoutReads.length).toBe(before)
    await expect.poll(drawn, { timeout: 4000 }).toEqual(['plan the slice'])
    expect(fakes.layoutReads.slice(before)).toContain(live)
  })
})

describe('one write at a time (W2)', () => {
  it("turns Maximise off while the pane's focus waits, so no zoom is dropped", async () => {
    const fakes = withChats()
    await showPanes()
    fakes.list.quietWrites(true)
    await userEvent.click(region('review notes').getByRole('heading', { name: 'review notes' }))
    await expect.poll(() => writesOf(fakes)).toEqual([{ chat: review, action: 'focus', body: {} }])
    await expect.element(page.getByRole('button', { name: 'Maximise review notes' })).toBeDisabled()
    // Once the page reads the layout itself, Maximise zooms again.
    await expect.element(page.getByRole('button', { name: 'Maximise review notes' }), { timeout: 4000 }).toBeEnabled()
  })
})

describe('focus (W2)', () => {
  it('sends one focus for a tap on a pane header, and none when herdr focuses that chat already', async () => {
    const fakes = withChats()
    await showPanes()
    await userEvent.click(region('review notes').getByRole('heading', { name: 'review notes' }))
    await expect.poll(() => writesOf(fakes)).toEqual([{ chat: review, action: 'focus', body: {} }])
    // The event brings the new focus; a second tap on the same header sends nothing.
    await expect.element(region('review notes')).toHaveAttribute('aria-current', 'true')
    await quiet()
    await userEvent.click(region('review notes').getByRole('heading', { name: 'review notes' }))
    await quiet()
    expect(writesOf(fakes)).toHaveLength(1)
    // herdr focuses review notes now, so a tap on plan the slice's header sends its focus.
    await userEvent.click(region('plan the slice').getByRole('heading', { name: 'plan the slice' }))
    await expect.poll(() => writesOf(fakes)).toHaveLength(2)
    expect(writesOf(fakes)[1]).toEqual({ chat: plan, action: 'focus', body: {} })
  })

  it('sends no focus for a click in the transcript or the composer, a scroll, a text selection or the menu', async () => {
    const fakes = withChats()
    await showPanes()
    const pane = region('review notes')
    await userEvent.click(pane.getByText('Review the notes'))
    await userEvent.click(pane.getByRole('textbox'))
    for (const el of pane.element().querySelectorAll('*'))
      if (el.scrollHeight > el.clientHeight) el.dispatchEvent(new Event('scroll'))
    pane.element().dispatchEvent(new WheelEvent('wheel', { deltaY: 200, bubbles: true }))
    // A drag that selects the title ends with a click on the header: the selection is not a tap.
    const title = pane.getByRole('heading', { name: 'review notes' }).element()
    window.getSelection()?.selectAllChildren(title)
    title.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    window.getSelection()?.removeAllRanges()
    await userEvent.click(actionsButton('review notes'))
    await userEvent.keyboard('{Escape}')
    await quiet()
    expect(writesOf(fakes)).toEqual([])
  })

  it('sends one focus with a Send in a pane herdr does not focus, and none in the focused one', async () => {
    const fakes = withChats()
    await showPanes()
    await userEvent.click(region('review notes').getByRole('textbox'))
    await userEvent.keyboard('check the notes{Enter}')
    await expect.poll(() => fakes.chats.prompts).toEqual([{ chat: review, text: 'check the notes' }])
    expect(writesOf(fakes)).toEqual([{ chat: review, action: 'focus', body: {} }])
    await expect.element(region('review notes')).toHaveAttribute('aria-current', 'true')
    await quiet()
    await userEvent.click(region('review notes').getByRole('textbox'))
    await userEvent.keyboard('and again{Enter}')
    await expect.poll(() => fakes.chats.prompts).toHaveLength(2)
    await quiet()
    expect(writesOf(fakes)).toHaveLength(1)
  })

  it("sends a focus for a tap on the header of the chat beside the desktop's sidebar, not for opening it", async () => {
    const fakes = withChats()
    await tapWorkspaces(desktop)
    await userEvent.click(page.getByText('review notes', { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: 'review notes' })).toBeVisible()
    await quiet()
    expect(writesOf(fakes)).toEqual([])
    await userEvent.click(page.getByRole('heading', { name: 'review notes' }))
    await expect.poll(() => writesOf(fakes)).toEqual([{ chat: review, action: 'focus', body: {} }])
  })

  it('sends one focus from the keyboard with Focus in terminal, which the focused pane does not offer', async () => {
    const fakes = withChats()
    await showPanes()
    await userEvent.click(actionsButton('plan the slice'))
    await expect.element(page.getByRole('menuitem', { name: 'New chat' })).toBeVisible()
    await expect.element(page.getByRole('menuitem', { name: 'Focus in terminal' })).not.toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    actionsButton('review notes').element().focus()
    await userEvent.keyboard('{Enter}')
    const row = page.getByRole('menuitem', { name: 'Focus in terminal' })
    await expect.element(row).toBeVisible()
    // The arrow keys move the menu's highlight down to the row, and Enter picks it.
    for (let i = 0; i < 12 && !row.element().hasAttribute('data-highlighted'); i++)
      await userEvent.keyboard('{ArrowDown}')
    expect(row.element().hasAttribute('data-highlighted')).toBe(true)
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => writesOf(fakes)).toEqual([{ chat: review, action: 'focus', body: {} }])
  })

  it("opens a sidebar row's chat of a zoomed tab beside the sidebar, as of any tab", async () => {
    withChats()
    await tapWorkspaces(desktop)
    await userEvent.click(page.getByText('review notes', { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: 'review notes' })).toBeVisible()
    // herdr zooms review notes (from the terminal, or the workbench before the sidebar came back).
    const zoomed = await fetch(`/api/chats/${encodeURIComponent(review)}/zoom`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ zoomed: true }),
    })
    expect(zoomed.status).toBe(204)
    await quiet()
    await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Show the workspace sidebar' })).not.toBeInTheDocument()
  })

  it('sends no focus on the phone: opening a chat, a tap on its header and a Send', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapChat('review notes')
    await userEvent.click(page.getByRole('heading', { name: 'review notes' }))
    await userEvent.click(region('review notes').getByRole('textbox'))
    await userEvent.keyboard('from the phone')
    await userEvent.click(page.getByRole('button', { name: 'Send' }))
    await expect.poll(() => fakes.chats.prompts).toEqual([{ chat: review, text: 'from the phone' }])
    await quiet()
    expect(writesOf(fakes)).toEqual([])
  })
})

describe('swap (W2)', () => {
  it("lists only the other chats of the pane's tab, and swaps the panes on the event", async () => {
    const fakes = withChats()
    await showPanes()
    await userEvent.click(actionsButton('review notes'))
    await userEvent.click(page.getByRole('menuitem', { name: 'Swap with…' }))
    await expect.element(page.getByRole('menuitem', { name: 'plan the slice' })).toBeVisible()
    const choices = page
      .getByRole('menuitem')
      .elements()
      .map((e) => e.textContent)
    expect(choices).toContain('plan the slice')
    expect(choices).toContain('tail logs')
    // drift check is in the workspace's other tab, and the pane does not swap with itself.
    expect(choices).not.toContain('drift check')
    expect(choices.filter((c) => c === 'review notes')).toEqual([])
    await userEvent.click(page.getByRole('menuitem', { name: 'plan the slice' }))
    await expect.poll(drawn).toEqual(['review notes', 'plan the slice', 'tail logs'])
    expect(writesOf(fakes)).toEqual([{ chat: review, action: 'swap', body: { with: plan } }])
  })
})

describe('close (W2)', () => {
  it('asks with the chat named, posts its ID as the confirm, and drops the pane on the event', async () => {
    const fakes = withChats()
    await showPanes()
    await pickInMenu('tail logs', 'Close pane…')
    const dialog = page.getByRole('alertdialog', { name: 'Close tail logs?' })
    await expect.element(dialog).toBeVisible()
    expect(writesOf(fakes)).toEqual([])
    await userEvent.click(dialog.getByRole('button', { name: 'Close' }))
    await expect.poll(drawn).toEqual(['plan the slice', 'review notes'])
    expect(writesOf(fakes)).toEqual([{ chat: logs, action: 'close', body: { confirm: logs } }])
    expect(fakes.chats.paths).toEqual([])
    await expect.element(dialog).not.toBeInTheDocument()
  })

  it('says a working chat is working and offers Stop, which stops it', async () => {
    const fakes = withChats()
    await showPanes()
    fakes.list.setStatus(review, 'working')
    await expect.element(region('review notes').getByText('Working', { exact: true })).toBeVisible()
    await pickInMenu('review notes', 'Close pane…')
    const dialog = page.getByRole('alertdialog', { name: 'Close review notes?' })
    await userEvent.click(dialog.getByRole('button', { name: 'Close' }))
    await expect.element(dialog.getByText('Not closed — the chat is working. Stop it first, or cancel.')).toBeVisible()
    await userEvent.click(dialog.getByRole('button', { name: 'Stop' }))
    await expect.poll(() => fakes.chats.stops).toEqual([review])
    expect(drawn()).toContain('review notes')
    expect(getReports()).toEqual([])
  })

  it('says a chat that waits for an answer needs one first, with no Stop', async () => {
    const fakes = withChats()
    await showPanes()
    fakes.list.setStatus(plan, 'needsYou')
    await expect.element(region('plan the slice').getByText('Needs you', { exact: true })).toBeVisible()
    await pickInMenu('plan the slice', 'Close pane…')
    const dialog = page.getByRole('alertdialog', { name: 'Close plan the slice?' })
    await userEvent.click(dialog.getByRole('button', { name: 'Close' }))
    await expect.element(dialog.getByText('Not closed — the chat needs an answer first.')).toBeVisible()
    expect(dialog.getByRole('button', { name: 'Stop' }).elements()).toHaveLength(0)
    expect(getReports()).toEqual([])
  })

  it('closes from the phone sheet, which has no zoom or swap', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapChat('review notes')
    await userEvent.click(actionsButton('review notes'))
    await expect.element(page.getByText('Close pane…', { exact: true })).toBeVisible()
    expect(page.getByText('Zoom pane').elements()).toHaveLength(0)
    expect(page.getByText('Swap with…').elements()).toHaveLength(0)
    await userEvent.click(page.getByText('Close pane…', { exact: true }))
    await userEvent.click(
      page.getByRole('alertdialog', { name: 'Close review notes?' }).getByRole('button', { name: 'Close' }),
    )
    await expect.poll(() => writesOf(fakes)).toEqual([{ chat: review, action: 'close', body: { confirm: review } }])
    // The chat leaves the list on the server's events, and the phone goes back to it.
    await expect.element(page.getByText('review notes', { exact: true })).not.toBeInTheDocument()
  })

  it('reads the list again itself when no event comes 2.5 s after a close, so the phone drops the chat', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapChat('review notes')
    fakes.list.quietWrites(true)
    await userEvent.click(actionsButton('review notes'))
    await userEvent.click(page.getByText('Close pane…', { exact: true }))
    await userEvent.click(
      page.getByRole('alertdialog', { name: 'Close review notes?' }).getByRole('button', { name: 'Close' }),
    )
    await expect.poll(() => writesOf(fakes)).toEqual([{ chat: review, action: 'close', body: { confirm: review } }])
    await expect.element(page.getByText('review notes', { exact: true }), { timeout: 5000 }).not.toBeInTheDocument()
  })

  it("closes from the tablet's menu, which has no zoom or swap, and a Send there sends no focus", async () => {
    const fakes = withChats()
    await tapWorkspaces(tablet)
    await tapChat('review notes')
    await userEvent.click(region('review notes').getByRole('textbox'))
    await userEvent.keyboard('from the tablet')
    await userEvent.click(page.getByRole('button', { name: 'Send' }))
    await expect.poll(() => fakes.chats.prompts).toHaveLength(1)
    await userEvent.click(actionsButton('review notes'))
    await expect.element(page.getByRole('menuitem', { name: 'Close pane…' })).toBeVisible()
    expect(page.getByRole('menuitem', { name: 'Zoom pane' }).elements()).toHaveLength(0)
    expect(page.getByRole('menuitem', { name: 'Swap with…' }).elements()).toHaveLength(0)
    await userEvent.click(page.getByRole('menuitem', { name: 'Close pane…' }))
    await userEvent.click(
      page.getByRole('alertdialog', { name: 'Close review notes?' }).getByRole('button', { name: 'Close' }),
    )
    await expect.poll(() => writesOf(fakes)).toEqual([{ chat: review, action: 'close', body: { confirm: review } }])
  })
})

describe('a stale view and a failed write (W2)', () => {
  it('reads the layout again, quietly, on 409 singlePane and otherTab', async () => {
    const fakes = withChats()
    await showPanes()
    for (const state of ['singlePane', 'otherTab'] as const) {
      const before = fakes.layoutReads.length
      fakes.list.answerWrites(() =>
        errorAnswer({ kind: 'chat-not-ready', state, message: 'Not ready', requestId: 'r-409' }, 409),
      )
      await pickInMenu('review notes', state === 'singlePane' ? 'Zoom pane' : 'Swap with…')
      if (state === 'otherTab') await userEvent.click(page.getByRole('menuitem', { name: 'tail logs' }))
      await expect.poll(() => fakes.layoutReads.slice(before)).toContain(live)
      expect(drawn()).toEqual(['plan the slice', 'review notes', 'tail logs'])
      await quiet(200)
    }
    expect(page.getByText(/^Not (zoomed|swapped)/).elements()).toHaveLength(0)
    expect(getReports()).toEqual([])
  })

  it('reads the list again on a 404', async () => {
    const fakes = withChats()
    await showPanes()
    const before = fakes.listReads()
    fakes.list.answerWrites(() =>
      errorAnswer({ kind: 'not-found', path: '/api/chats/x', message: 'Not found', requestId: 'r-404' }, 404),
    )
    await pickInMenu('review notes', 'Zoom pane')
    await expect.poll(() => fakes.listReads()).toBeGreaterThan(before)
    expect(getReports()).toEqual([])
  })

  it('says herdr is unavailable in the status bar and reports the kind only', async () => {
    const fakes = withChats()
    const posted: string[] = []
    const post = vi.fn<PostReport>((body) => {
      posted.push(body)
      return Promise.resolve(204)
    })
    cleanups.push(addSink(createClientErrorSender({ post })))
    await showPanes()
    fakes.list.answerWrites(() =>
      errorAnswer({ kind: 'herdr-unavailable', message: 'herdr review notes down', requestId: 'r-503' }, 503),
    )
    await pickInMenu('review notes', 'Zoom pane')
    await expect.element(page.getByText('Not zoomed — herdr-unavailable')).toBeVisible()
    expect(getReports().map((r): unknown[] => [r.error.name, Reflect.get(r.error, 'miss')])).toEqual([
      ['LayoutWriteMissError', 'herdr-unavailable'],
    ])
    await expect.poll(() => posted).toHaveLength(1)
    expect(posted.join()).not.toContain('review notes')
    expect(posted.join()).not.toContain('c2')
  })

  it("makes no call for a control a pane does not show: a tab's only pane has no zoom or swap", async () => {
    const fakes = withChats()
    await showPanes()
    await userEvent.click(page.getByRole('tab', { name: /solo work/ }))
    await expect.poll(drawn).toEqual(['lone chat'])
    await userEvent.click(actionsButton('lone chat'))
    await expect.element(page.getByRole('menuitem', { name: 'Close pane…' })).toBeVisible()
    expect(page.getByRole('menuitem', { name: 'Zoom pane' }).elements()).toHaveLength(0)
    expect(page.getByRole('menuitem', { name: 'Swap with…' }).elements()).toHaveLength(0)
    await userEvent.keyboard('{Escape}')
    // Maximise draws, as Figma has it, and sends nothing for a tab of one pane.
    await userEvent.click(page.getByRole('button', { name: 'Maximise lone chat' }))
    await quiet()
    expect(writesOf(fakes)).toEqual([])
  })
})
