import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { createClientErrorSender, type PostReport } from '../errors/clientErrorSender.ts'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { addSink, clearReports, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { errorAnswer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import {
  type FakeWorkspacesOptions,
  type FakeWorkspacesServer,
  fakeWorkspacesServer,
} from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { markApp } from './appMarker.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// Slice W2d: Move to tab… in a live pane's menu (backend #337). Each test
// takes the owner's path: the app with no URL parameters, Workspaces, then
// the sidebar hidden for the desktop workbench, or a chat tapped on the
// phone and the tablet, with the contract-checked fakes as the server. A
// pane moves only when the server's events bring the new layout, and the
// workbench follows its focused pane to the tab it went to.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const live = 'mac-mini/w-live'
const solo = 'mac-mini/w-solo'
const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'
const notes = 'mac-mini/c3'
const draft = 'mac-mini/c4'
const lone = 'mac-mini/c5'
const spare = 'mac-mini/c8'
const tab1 = `${live}:t1`
const tab2 = `${live}:t2`

const summary = (id: string, title: string) => ({
  id,
  kind: 'claude',
  title,
  model: 'claude-opus-5-5',
  contextUsed: null,
  modelId: null,
  effort: null,
  pane: `${id}-pane`,
  status: 'idle',
  parent: null,
})
const list = {
  machine: 'mac-mini',
  workspaces: [
    {
      id: live,
      label: 'live work',
      chats: [
        summary(plan, 'plan the slice'),
        summary(review, 'review notes'),
        summary(notes, 'notes chat'),
        summary(draft, 'draft chat'),
        summary(spare, 'spare chat'),
      ],
    },
    { id: solo, label: 'solo work', chats: [summary(lone, 'lone chat')] },
  ],
}
// live work: tab 1 holds plan and review (active), tab 2 notes and draft, tab 3 spare. solo work: one tab.
const threeTabs = { [live]: [[plan, review], [notes, draft], [spare]] }

type Fakes = { list: FakeWorkspacesServer; layoutReads: string[]; listReads: () => number }

function withChats(tabs: FakeWorkspacesOptions['tabs'] = threeTabs): Fakes {
  const chats = fakeTranscriptServer()
  for (const c of [plan, review, notes, draft, lone, spare]) chats.set(c, [])
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
  return { list: workspaces, layoutReads, listReads: () => lists }
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

/** The titles of the panes drawn, by their Maximise or Unzoom buttons, in the page's order. */
const drawn = () =>
  [...document.querySelectorAll('button[aria-label^="Maximise "], button[aria-label^="Unzoom "]')].map((b) =>
    (b.getAttribute('aria-label') ?? '').replace(/^(Maximise|Unzoom) /, ''),
  )

/** The desktop workbench: Workspaces, then the sidebar hidden, with `panes` drawn. */
async function showPanes(panes = ['plan the slice', 'review notes']) {
  await tapWorkspaces(desktop)
  await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
  await expect.poll(drawn).toEqual(panes)
  await new Promise((resolve) => setTimeout(resolve, 300))
}

const region = (title: string) => page.getByRole('region', { name: title })
const actionsButton = (title: string) => page.getByRole('button', { name: `${title} actions` })
const quiet = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))
const writesOf = (fakes: Fakes) => fakes.list.writes.map((w) => ({ chat: w.chat, action: w.action, body: w.body }))
const moveDialog = () => page.getByRole('dialog', { name: /^Move / })

/** Opens `title`'s Move to tab… list. */
async function openTabs(title: string) {
  await userEvent.click(actionsButton(title))
  await userEvent.click(page.getByRole('menuitem', { name: 'Move to tab…' }))
}

/** Picks `tab` in `title`'s Move to tab… list: its dialog opens. */
async function pickTab(title: string, tab: string) {
  await openTabs(title)
  await userEvent.click(page.getByRole('menuitem', { name: tab, exact: true }))
  await expect.element(moveDialog()).toBeVisible()
}

describe('Move to tab… (W2d)', () => {
  it("lists only the workspace's other tabs, by name, and is not there for a workspace of one tab", async () => {
    const fakes = withChats()
    await showPanes()
    await openTabs('review notes')
    await expect.element(page.getByRole('menuitem', { name: 'tab 2', exact: true })).toBeVisible()
    await expect.element(page.getByRole('menuitem', { name: 'tab 3', exact: true })).toBeVisible()
    expect(page.getByRole('menuitem', { name: 'tab 1', exact: true }).elements()).toHaveLength(0)
    await userEvent.keyboard('{Escape}')
    await userEvent.keyboard('{Escape}')
    await userEvent.click(page.getByRole('tab', { name: /solo work/ }))
    await expect.poll(drawn).toEqual(['lone chat'])
    await userEvent.click(actionsButton('lone chat'))
    await expect.element(page.getByRole('menuitem', { name: 'Split right' })).toBeVisible()
    expect(page.getByRole('menuitem', { name: 'Move to tab…' }).elements()).toHaveLength(0)
    await quiet()
    expect(writesOf(fakes)).toEqual([])
  })

  it('turns a tab herdr zooms off, says why, and sends nothing for it', async () => {
    const fakes = withChats()
    await showPanes()
    const before = fakes.layoutReads.length
    fakes.list.zoomTab(live, tab2)
    await expect.poll(() => fakes.layoutReads.slice(before)).toContain(live)
    await quiet()
    await openTabs('review notes')
    // The row's end says why it is off; it is part of the row's name.
    const zoomed = page.getByRole('menuitem', { name: /^tab 2\s*zoomed$/ })
    await expect.element(zoomed).toHaveAttribute('aria-disabled', 'true')
    await expect
      .element(page.getByRole('menuitem', { name: 'tab 3', exact: true }))
      .not.toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(zoomed, { force: true })
    await quiet()
    expect(moveDialog().elements()).toHaveLength(0)
    expect(writesOf(fakes)).toEqual([])
  })

  it('moves beside the focused pane to the right, draws the move only on the event, and follows the pane', async () => {
    const fakes = withChats()
    await showPanes()
    fakes.list.quietWrites(true)
    await pickTab('review notes', 'tab 2')
    await expect.element(page.getByRole('button', { name: /Place/ })).toHaveTextContent('Beside the focused pane')
    await userEvent.click(page.getByRole('button', { name: 'Move', exact: true }))
    await expect
      .poll(() => writesOf(fakes))
      .toEqual([{ chat: review, action: 'move', body: { tab: tab2, direction: 'row' } }])
    expect(moveDialog().elements()).toHaveLength(0)
    // No optimistic layout: nothing moves before the server's event.
    await quiet(1000)
    expect(drawn()).toEqual(['plan the slice', 'review notes'])
    fakes.list.layoutChanged(live)
    // The workbench shows tab 2, where herdr put review notes beside notes chat, the tab's focused pane, and keeps
    // review notes focused: a click on its ⋯ focused its pane, so it was the open pane.
    await expect.poll(() => [...drawn()].sort()).toEqual(['draft chat', 'notes chat', 'review notes'])
    await expect.element(region('review notes')).toHaveAttribute('aria-current', 'true')
    expect(fakes.list.tabs(live).map((t) => t.chats)).toEqual([[plan], [notes, review, draft], [spare]])
    // A move sends no focus: herdr's terminal stays where it was.
    expect(writesOf(fakes).map((w) => w.action)).toEqual(['move'])
    expect(getReports()).toEqual([])
  })

  it('moves beside a chosen pane of the tab, below it', async () => {
    const fakes = withChats()
    await showPanes()
    await pickTab('plan the slice', 'tab 2')
    await userEvent.click(page.getByRole('button', { name: /Place/ }))
    await userEvent.click(page.getByRole('menuitemradio', { name: 'Beside draft chat' }))
    await userEvent.click(page.getByText('Below', { exact: true }))
    await userEvent.click(page.getByRole('button', { name: 'Move', exact: true }))
    await expect
      .poll(() => writesOf(fakes))
      .toEqual([{ chat: plan, action: 'move', body: { tab: tab2, direction: 'column', beside: draft } }])
    await expect.poll(() => [...drawn()].sort()).toEqual(['draft chat', 'notes chat', 'plan the slice'])
    expect(fakes.list.tabs(live).map((t) => t.chats)).toEqual([[review], [notes, draft, plan], [spare]])
  })

  it('drops a tab whose last pane moved out from the list on the event, and draws the tab it went to', async () => {
    const fakes = withChats({ [live]: [[plan], [review, notes], [draft, spare]] })
    await showPanes(['plan the slice'])
    await pickTab('plan the slice', 'tab 2')
    await userEvent.click(page.getByRole('button', { name: 'Move', exact: true }))
    await expect.poll(() => [...drawn()].sort()).toEqual(['notes chat', 'plan the slice', 'review notes'])
    expect(fakes.list.tabs(live).filter((t) => t.root !== undefined)).toHaveLength(2)
    await quiet()
    await openTabs('plan the slice')
    await expect.element(page.getByRole('menuitem', { name: 'tab 3', exact: true })).toBeVisible()
    expect(page.getByRole('menuitem', { name: 'tab 1', exact: true }).elements()).toHaveLength(0)
    expect(page.getByRole('menuitem', { name: 'tab 2', exact: true }).elements()).toHaveLength(0)
  })

  it('reads the layout and the list itself when no event comes in 2.5 s', async () => {
    const fakes = withChats()
    await showPanes()
    fakes.list.quietWrites(true)
    await pickTab('review notes', 'tab 3')
    const [layouts, lists] = [fakes.layoutReads.length, fakes.listReads()]
    await userEvent.click(page.getByRole('button', { name: 'Move', exact: true }))
    await quiet(1500)
    expect(fakes.layoutReads.slice(layouts)).toEqual([])
    await expect.poll(() => fakes.layoutReads.slice(layouts), { timeout: 4000 }).toContain(live)
    await expect.poll(() => fakes.listReads()).toBeGreaterThan(lists)
    await expect.poll(() => [...drawn()].sort()).toEqual(['review notes', 'spare chat'])
  })

  it('offers no Move to tab… on the phone or the tablet', async () => {
    const fakes = withChats()
    for (const size of [phone, tablet]) {
      await tapWorkspaces(size)
      await userEvent.click(page.getByText('review notes', { exact: true }).first())
      await expect.element(page.getByRole('heading', { name: 'review notes' })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /review notes actions|Chat actions/ }).first())
      await expect.element(page.getByText('Close pane…')).toBeVisible()
      expect(page.getByText('Move to tab…').elements()).toHaveLength(0)
      await view?.unmount()
      view = undefined
      resetAllStores()
      queryClient.clear()
    }
    expect(writesOf(fakes)).toEqual([])
  })
})

describe('a refused move (W2d)', () => {
  it('reads the layout again, quietly, on 409 sameTab', async () => {
    const fakes = withChats()
    await showPanes()
    fakes.list.answerWrites(() =>
      errorAnswer({ kind: 'chat-not-ready', state: 'sameTab', message: 'Not ready', requestId: 'r-409' }, 409),
    )
    await pickTab('review notes', 'tab 2')
    const before = fakes.layoutReads.length
    await userEvent.click(page.getByRole('button', { name: 'Move', exact: true }))
    await expect.poll(() => fakes.layoutReads.slice(before)).toContain(live)
    await quiet()
    expect(drawn()).toEqual(['plan the slice', 'review notes'])
    expect(page.getByText(/^Not moved/).elements()).toHaveLength(0)
    expect(getReports()).toEqual([])
  })

  it('reads the layout again and says the tab is zoomed on 409 zoomedTab, with no report', async () => {
    const fakes = withChats()
    await showPanes()
    await pickTab('review notes', 'tab 2')
    // herdr zooms tab 2 from the terminal while the dialog is open.
    fakes.list.zoomTab(live, tab2)
    const before = fakes.layoutReads.length
    await userEvent.click(page.getByRole('button', { name: 'Move', exact: true }))
    await expect.element(page.getByText('Not moved — that tab is zoomed')).toBeVisible()
    await expect.poll(() => fakes.layoutReads.slice(before)).toContain(live)
    expect(writesOf(fakes).map((w) => w.action)).toEqual(['move'])
    expect(drawn()).toEqual(['plan the slice', 'review notes'])
    expect(getReports()).toEqual([])
  })

  it('reads the list again on a 404', async () => {
    const fakes = withChats()
    await showPanes()
    fakes.list.answerWrites(() =>
      errorAnswer({ kind: 'not-found', path: '/api/chats/x', message: 'Not found', requestId: 'r-404' }, 404),
    )
    await pickTab('review notes', 'tab 2')
    const before = fakes.listReads()
    await userEvent.click(page.getByRole('button', { name: 'Move', exact: true }))
    await expect.poll(() => fakes.listReads()).toBeGreaterThan(before)
    expect(page.getByText(/^Not moved/).elements()).toHaveLength(0)
    expect(getReports()).toEqual([])
  })

  it('says herdr is unavailable in the status bar for a 5xx, and reports the kind only', async () => {
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
    await pickTab('review notes', 'tab 2')
    await userEvent.click(page.getByRole('button', { name: 'Move', exact: true }))
    await expect.element(page.getByText('Not moved — herdr-unavailable')).toBeVisible()
    expect(drawn()).toEqual(['plan the slice', 'review notes'])
    expect(getReports().map((r): unknown[] => [r.error.name, Reflect.get(r.error, 'miss')])).toEqual([
      ['LayoutWriteMissError', 'herdr-unavailable'],
    ])
    await expect.poll(() => posted).toHaveLength(1)
    expect(posted.join()).not.toContain('review notes')
    expect(posted.join()).not.toContain('c2')
    expect(posted.join()).not.toContain(tab1)
  })
})
