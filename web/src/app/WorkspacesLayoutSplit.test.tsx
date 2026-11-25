import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { ChatId, type LayoutNode } from '@bridge/contract'
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
import { type FakeWorkspacesServer, fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { placed } from '../lib/popoverPlaced.ts'
import { queryClient } from '../lib/queryClient.ts'
import { clickNow, holdTimers } from '../lib/holdTimers.ts'
import { afterRendering, renderedUntil, setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { markApp } from './appMarker.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// Slice W2c: Split right and Split down in a live pane's menu, and the ratio
// of a dragged handle (backend #334). Each test takes the owner's path: the
// app with no URL parameters, Workspaces, then the sidebar hidden for the
// desktop workbench, or a chat tapped on the phone and the tablet, with the
// contract-checked fakes as the server. A new pane shows only when the
// server's events bring it; a handle moves on the page while it is dragged
// and sends one ratio when the drag ends.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const live = 'mac-mini/w-live'
const solo = 'mac-mini/w-solo'
const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'
const lone = 'mac-mini/c5'
const six = 'mac-mini/c6'
const seven = 'mac-mini/c7'
const tab = `${live}:t1`

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
// live work: plan and review side by side in one tab, split at half. solo work: three chats in a row, unless a test
// gives its tree.
const list = {
  machine: 'mac-mini',
  workspaces: [
    { id: live, label: 'live work', chats: [summary(plan, 'plan the slice'), summary(review, 'review notes')] },
    {
      id: solo,
      label: 'solo work',
      chats: [summary(lone, 'lone chat'), summary(six, 'six notes'), summary(seven, 'seven notes')],
    },
  ],
}

type Fakes = { list: FakeWorkspacesServer; layoutReads: string[] }

function withChats(roots: Readonly<Record<string, readonly LayoutNode[]>> = {}): Fakes {
  const chats = fakeTranscriptServer()
  for (const c of [plan, review, lone, six, seven]) chats.set(c, [])
  const workspaces = fakeWorkspacesServer(chats, list, { roots })
  const layoutReads: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const layout = /^\/api\/workspaces\/([^/]+)\/layout$/.exec(path)
      if (layout !== null) layoutReads.push(decodeURIComponent(layout[1] ?? ''))
      const answer = chats.handle(path, init) ?? workspaces.handle(path, init)
      if (answer !== undefined) return Promise.resolve(answer)
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
  return { list: workspaces, layoutReads }
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

/** The desktop workbench: Workspaces, then the sidebar hidden, with live work's two panes drawn. */
async function showPanes() {
  await tapWorkspaces(desktop)
  await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
  await expect.poll(drawn).toEqual(['plan the slice', 'review notes'])
  await new Promise((resolve) => setTimeout(resolve, 300))
}

const actionsButton = (title: string) => page.getByRole('button', { name: `${title} actions` })
const quiet = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))
const writesOf = (fakes: Fakes) => fakes.list.writes.map((w) => ({ chat: w.chat, action: w.action, body: w.body }))
const valueOf = (handle: Element) => Number(handle.getAttribute('aria-valuenow'))
/** Presses `key` on `target` with DOM key events, which move no held clock, as a Vitest key press does (`holdTimers`). */
function keyNow(target: Element, key: string): void {
  for (const type of ['keydown', 'keyup'])
    target.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true }))
}

async function pickInMenu(title: string, label: string) {
  await userEvent.click(actionsButton(title))
  await userEvent.click(page.getByRole('menuitem', { name: label }))
}

/** The handle named `name` (the `at`th of them). */
function handle(name: 'Resize columns' | 'Resize rows', at = 0): Element {
  const found = page.getByRole('separator', { name }).nth(at).element()
  return found
}

const pointer = (type: string, x: number, y: number) =>
  new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
  })

/** Presses `target` and moves the pointer by `dx`, `dy` in steps; `release` lets go. */
async function drag(target: Element, dx: number, dy: number) {
  const box = target.getBoundingClientRect()
  const [x, y] = [box.left + box.width / 2, box.top + box.height / 2]
  target.dispatchEvent(pointer('pointerdown', x, y))
  for (const step of [0.25, 0.5, 0.75, 1]) {
    document.dispatchEvent(pointer('pointermove', x + dx * step, y + dy * step))
    await afterRendering()
  }
  return {
    release: async () => {
      document.dispatchEvent(pointer('pointerup', x + dx, y + dy))
      await afterRendering()
    },
  }
}

describe('split (W2c)', () => {
  it('sends Split right as a row and shows the new shell pane only on the events, with no focus', async () => {
    const fakes = withChats()
    await showPanes()
    fakes.list.quietWrites(true)
    await pickInMenu('review notes', 'Split right')
    await expect.poll(() => writesOf(fakes)).toEqual([{ chat: review, action: 'split', body: { direction: 'row' } }])
    // No optimistic pane: nothing moves before the server's events.
    await quiet(1000)
    expect(drawn()).toEqual(['plan the slice', 'review notes'])
    fakes.list.listChanged()
    fakes.list.layoutChanged(live)
    await expect.poll(drawn).toEqual(['plan the slice', 'review notes', 'zsh'])
    // The new pane is a shell: no composer, and herdr's focus did not move.
    expect(writesOf(fakes).map((w) => w.action)).toEqual(['split'])
    expect(fakes.list.tabs(live)[0]?.focused).toBeUndefined()
    expect(getReports()).toEqual([])
  })

  it('shows the new pane when no event comes, from the layout and the list read again after 2.5 s', async () => {
    const fakes = withChats()
    await showPanes()
    fakes.list.quietWrites(true)
    await pickInMenu('review notes', 'Split right')
    await quiet(1500)
    expect(drawn()).toEqual(['plan the slice', 'review notes'])
    await expect.poll(drawn, { timeout: 4000 }).toEqual(['plan the slice', 'review notes', 'zsh'])
  })

  it('sends Split down as a column, and the new pane shows under the chat', async () => {
    const fakes = withChats()
    await showPanes()
    await pickInMenu('review notes', 'Split down')
    await expect.poll(drawn).toEqual(['plan the slice', 'review notes', 'zsh'])
    expect(writesOf(fakes)).toEqual([{ chat: review, action: 'split', body: { direction: 'column' } }])
    const pane = (title: string) =>
      page
        .getByRole('button', { name: `Maximise ${title}` })
        .element()
        .closest('[data-figma]')
        ?.getBoundingClientRect()
    expect(pane('zsh')?.top).toBeGreaterThan(pane('review notes')?.bottom ?? Infinity)
  })

  it('turns Split right and Split down off while herdr zooms the tab', async () => {
    const fakes = withChats()
    await showPanes()
    await pickInMenu('review notes', 'Zoom pane')
    await expect.poll(drawn).toEqual(['review notes'])
    await userEvent.click(actionsButton('review notes'))
    for (const name of ['Split right', 'Split down'])
      await expect.element(page.getByRole('menuitem', { name })).toHaveAttribute('aria-disabled', 'true')
    // A forced click skips Playwright's check that the row is in the window, so it waits for zag to place the menu.
    const splitRight = page.getByRole('menuitem', { name: 'Split right' })
    await expect.poll(() => placed(splitRight.element())).toBe(true)
    await userEvent.click(splitRight, { force: true })
    await quiet()
    expect(writesOf(fakes).map((w) => w.action)).toEqual(['zoom'])
  })

  it('offers no split on the phone or the tablet', async () => {
    withChats()
    for (const size of [phone, tablet]) {
      await tapWorkspaces(size)
      await userEvent.click(page.getByText('review notes', { exact: true }).first())
      await expect.element(page.getByRole('heading', { name: 'review notes' })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /review notes actions|Chat actions/ }).first())
      await expect.element(page.getByText('Close pane…')).toBeVisible()
      expect(page.getByText('Split right').elements()).toHaveLength(0)
      expect(page.getByText('Split down').elements()).toHaveLength(0)
      await view?.unmount()
      view = undefined
      resetAllStores()
      queryClient.clear()
    }
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
    await pickInMenu('review notes', 'Split right')
    await expect.element(page.getByText('Not split — herdr-unavailable')).toBeVisible()
    expect(getReports().map((r): unknown[] => [r.error.name, Reflect.get(r.error, 'miss')])).toEqual([
      ['LayoutWriteMissError', 'herdr-unavailable'],
    ])
    await expect.poll(() => posted).toHaveLength(1)
    expect(posted.join()).not.toContain('review notes')
    expect(posted.join()).not.toContain('c2')
  })
})

describe('ratio (W2c)', () => {
  it('moves the panes during a drag and sends one ratio when the pointer goes up', async () => {
    const fakes = withChats()
    await showPanes()
    const columns = handle('Resize columns')
    const width = columns.parentElement?.getBoundingClientRect().width ?? 0
    const held = await drag(columns, width * 0.2, 0)
    // The gesture moves the handle on the page and sends nothing yet.
    await expect.poll(() => valueOf(columns)).toBeGreaterThan(60)
    await quiet()
    expect(writesOf(fakes)).toEqual([])
    const shown = valueOf(columns)
    await held.release()
    await expect.poll(() => writesOf(fakes)).toHaveLength(1)
    const [write] = writesOf(fakes)
    expect(write).toMatchObject({ chat: live, action: 'ratio', body: { tab, path: [] } })
    const body: unknown = write?.body
    const ratio: unknown = typeof body === 'object' && body !== null ? Reflect.get(body, 'ratio') : undefined
    expect(typeof ratio === 'number' ? ratio : Number.NaN).toBeCloseTo(shown / 100, 2)
    await quiet(600)
    expect(writesOf(fakes)).toHaveLength(1)
    expect(getReports()).toEqual([])
  })

  it('clamps a drag to the edge at 0.1, and shows the server’s ratio from the event', async () => {
    const fakes = withChats()
    await showPanes()
    const columns = handle('Resize columns')
    const held = await drag(columns, -2000, 0)
    await held.release()
    await expect.poll(() => writesOf(fakes).map((w) => w.body)).toEqual([{ tab, path: [], ratio: 0.1 }])
    await expect.poll(() => valueOf(columns)).toBe(10)
  })

  it("sends the nested split's path: the rows of the right column after Split down", async () => {
    const fakes = withChats()
    await showPanes()
    await pickInMenu('review notes', 'Split down')
    await expect.poll(drawn).toEqual(['plan the slice', 'review notes', 'zsh'])
    const rows = handle('Resize rows')
    const height = rows.parentElement?.getBoundingClientRect().height ?? 0
    const held = await drag(rows, 0, -height * 0.2)
    await held.release()
    await expect.poll(() => writesOf(fakes).filter((w) => w.action === 'ratio')).toHaveLength(1)
    expect(writesOf(fakes)[1]).toMatchObject({ action: 'ratio', body: { tab, path: ['second'] } })
  })

  it('sends no ratio for a handle the layout draws at equal shares, and puts it back', async () => {
    const fakes = withChats()
    await showPanes()
    // row(plan, row(review, zsh)) has no pair layout: the page draws plan beside review over zsh, at equal shares.
    await pickInMenu('review notes', 'Split right')
    await expect.poll(drawn).toEqual(['plan the slice', 'review notes', 'zsh'])
    const columns = handle('Resize columns')
    const held = await drag(columns, 200, 0)
    await held.release()
    await quiet(600)
    expect(writesOf(fakes).map((w) => w.action)).toEqual(['split'])
    await expect.poll(() => valueOf(columns)).toBe(50)
  })

  it('holds the sent sizes until the server answers, and reads the layout itself after 2.5 s with no event', async () => {
    const fakes = withChats()
    await showPanes()
    fakes.list.quietWrites(true)
    const columns = handle('Resize columns')
    const held = await drag(columns, -200, 0)
    await held.release()
    await expect.poll(() => writesOf(fakes)).toHaveLength(1)
    const before = fakes.layoutReads.length
    const sent = valueOf(columns)
    expect(sent).toBeLessThan(45)
    await quiet(1500)
    // The handle stays where the owner let it go while the write waits.
    expect(valueOf(columns)).toBe(sent)
    expect(fakes.layoutReads.slice(before)).toEqual([])
    await expect.poll(() => fakes.layoutReads.slice(before), { timeout: 4000 }).toContain(live)
    await expect.poll(() => Math.abs(valueOf(columns) - sent)).toBeLessThan(1)
  })

  it('sends one ratio after the arrow keys pause, moving the handle with each key', async () => {
    const fakes = withChats()
    await showPanes()
    const columns = handle('Resize columns')
    if (columns instanceof HTMLElement) columns.focus()
    // The pause is the app's 400 ms timer on a held clock: a Vitest key press is a round trip that a busy runner
    // can stretch past 400 ms (CI run 45554796848: 517 ms), which is a pause, and the app sent after the first key.
    const release = holdTimers()
    // Each key moves the handle from the size the last one drew, so the test waits for that render.
    for (let i = 1; i <= 3; i += 1) {
      keyNow(columns, 'ArrowLeft')
      await renderedUntil(() => valueOf(columns) === 50 - i)
    }
    vi.advanceTimersByTime(399)
    await afterRendering()
    expect(writesOf(fakes)).toEqual([])
    vi.advanceTimersByTime(1)
    release()
    await expect.poll(() => writesOf(fakes)).toHaveLength(1)
    expect(writesOf(fakes)[0]).toMatchObject({ action: 'ratio', body: { tab, path: [], ratio: 0.47 } })
    await quiet(800)
    expect(writesOf(fakes)).toHaveLength(1)
  })

  it('sends a keyboard resize to its own workspace when the owner switches tabs before the pause ends', async () => {
    const fakes = withChats()
    await showPanes()
    const columns = handle('Resize columns')
    if (columns instanceof HTMLElement) columns.focus()
    const release = holdTimers()
    for (let i = 1; i <= 2; i += 1) {
      keyNow(columns, 'ArrowRight')
      await renderedUntil(() => valueOf(columns) === 50 + i)
    }
    clickNow(page.getByRole('tab', { name: /solo work/ }).element())
    await afterRendering()
    expect(writesOf(fakes)).toEqual([])
    vi.advanceTimersByTime(400)
    release()
    await expect.poll(() => writesOf(fakes)).toHaveLength(1)
    expect(writesOf(fakes)[0]).toMatchObject({ chat: live, action: 'ratio', body: { tab, path: [], ratio: 0.52 } })
  })

  it('finds the dragged divider of a stack from the sizes it draws, with a pane at its floor', async () => {
    const leaf = (chat: string): LayoutNode => ({ kind: 'pane', chat: ChatId.parse(chat) })
    const column = (ratio: number, first: LayoutNode, second: LayoutNode): LayoutNode => ({
      kind: 'split',
      direction: 'column',
      ratio,
      first,
      second,
    })
    // lone chat has 10 % of the tab, less than its header and composer: the stack draws it higher.
    const fakes = withChats({ [solo]: [column(0.1, leaf(lone), column(0.5, leaf(six), leaf(seven)))] })
    await showPanes()
    await userEvent.click(page.getByRole('tab', { name: /solo work/ }))
    await expect.poll(drawn).toEqual(['lone chat', 'six notes', 'seven notes'])
    const held = await drag(handle('Resize rows', 1), 0, -60)
    await held.release()
    await expect.poll(() => writesOf(fakes)).toHaveLength(1)
    expect(writesOf(fakes)[0]).toMatchObject({
      chat: solo,
      action: 'ratio',
      body: { tab: `${solo}:t1`, path: ['second'] },
    })
  })

  it('reads the layout again, quietly, on a 404', async () => {
    const fakes = withChats()
    await showPanes()
    const before = fakes.layoutReads.length
    fakes.list.answerWrites(() =>
      errorAnswer({ kind: 'not-found', path: '/api/workspaces/x', message: 'Not found', requestId: 'r-404' }, 404),
    )
    const columns = handle('Resize columns')
    const held = await drag(columns, 200, 0)
    await held.release()
    await expect.poll(() => fakes.layoutReads.slice(before)).toContain(live)
    // The handle goes back to the server's sizes, with no line and no report.
    await expect.poll(() => valueOf(columns)).toBe(50)
    expect(page.getByText(/^Not resized/).elements()).toHaveLength(0)
    expect(getReports()).toEqual([])
  })

  it('says herdr is unavailable for a 5xx, and the handle goes back to the server’s sizes', async () => {
    const fakes = withChats()
    await showPanes()
    fakes.list.answerWrites(() =>
      errorAnswer({ kind: 'herdr-unavailable', message: 'herdr down', requestId: 'r-503' }, 503),
    )
    const columns = handle('Resize columns')
    const held = await drag(columns, 200, 0)
    await held.release()
    await expect.element(page.getByText('Not resized — herdr-unavailable')).toBeVisible()
    await expect.poll(() => valueOf(columns)).toBe(50)
    expect(getReports().map((r): unknown[] => [r.error.name, Reflect.get(r.error, 'miss')])).toEqual([
      ['LayoutWriteMissError', 'herdr-unavailable'],
    ])
  })
})
