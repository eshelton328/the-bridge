import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterAll, afterEach, beforeAll, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { clearReports, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { markApp } from './appMarker.ts'
import { routeTree } from './routeTree.gen.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'

// Slice 3a: the Workspaces page draws each live workspace's herdr layout,
// its active tab (`GET /api/workspaces/:workspace/layout`). Each test takes
// the owner's path: it opens the app with no URL parameters and taps
// Workspaces, with a stubbed server (`fetch`). A layout read that misses
// keeps the workspace's first chats as its panes, says so in the status bar
// and reports once for the outage (d-115); `layout.changed` reads that
// workspace's layout again.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

type Chat = { local: string; kind: 'claude' | 'codex' | 'shell'; title: string; model: string | null }

const chatOf = (local: string, title: string, kind: Chat['kind'] = 'claude'): Chat => ({
  local,
  kind,
  title,
  model: kind === 'shell' ? 'pnpm dev' : kind === 'codex' ? 'gpt-5.5' : 'claude-opus-5-5',
})

const plan = chatOf('c1', 'plan the slice')
const review = chatOf('c2', 'review notes', 'codex')
const logs = chatOf('c3', 'tail logs', 'shell')
const tokens = chatOf('c4', 'theme tokens')
const drift = chatOf('c5', 'drift check', 'codex')
const evals = chatOf('c6', 'eval round')
const chats = [plan, review, logs, tokens, drift, evals]
/** The one entry of plan's transcript. */
const planEntry = 'Plan the slice from the contract'

const summary = (c: Chat) => ({
  id: `mac-mini/${c.local}`,
  kind: c.kind,
  title: c.title,
  model: c.model,
  contextUsed: null,
  status: 'idle',
  parent: null,
})

type Node =
  | { kind: 'pane'; chat: string }
  | { kind: 'split'; direction: 'row' | 'column'; ratio: number; first: Node; second: Node }

const pane = (c: Chat): Node => ({ kind: 'pane', chat: `mac-mini/${c.local}` })
const row = (ratio: number, first: Node, second: Node): Node => ({
  kind: 'split',
  direction: 'row',
  ratio,
  first,
  second,
})
const column = (ratio: number, first: Node, second: Node): Node => ({
  kind: 'split',
  direction: 'column',
  ratio,
  first,
  second,
})

const inTree = (node: Node): string[] =>
  node.kind === 'pane' ? [node.chat] : [...inTree(node.first), ...inTree(node.second)]

type Tab = { label: string; active: boolean; root: Node; focused: Chat }

/** The server's layout of `workspace`: its tabs, each with the summaries of its panes' chats in tree order. */
const layoutBody = (workspace: string, tabs: readonly Tab[]) =>
  JSON.stringify({
    workspace,
    tabs: tabs.map((t, at) => ({
      id: `mac-mini/${workspace.slice('mac-mini/'.length)}:t${String(at + 1)}`,
      label: t.label,
      active: t.active,
      root: t.root,
      focusedChat: `mac-mini/${t.focused.local}`,
      chats: inTree(t.root).map((id) => summary(chats.find((c) => `mac-mini/${c.local}` === id) ?? plan)),
    })),
  })

const live = 'mac-mini/w-live'
const other = 'mac-mini/w-other'

/** One active tab with `root`, `focused` focused. */
const oneTab = (root: Node, focused: Chat) => () =>
  new Response(layoutBody(live, [{ label: 'main', active: true, root, focused }]), { status: 200 })

/**
 * The stubbed server: `GET /api/workspaces` gives the workspace "live work" with `listed`, and "other work" with
 * `review` when `two` is set; each workspace's layout read gets its answer from `layouts` by workspace ID, 404
 * not-found when it has none. The event stream opens with `open`, and `send` writes an event to every open stream.
 */
function fakeServer(listed: readonly Chat[], first: Partial<Record<string, () => Response>>, two = false) {
  let layouts = first
  const encoder = new TextEncoder()
  const streams: ReadableStreamDefaultController<Uint8Array>[] = []
  const layoutReads: string[] = []
  const listReads: string[] = []
  // Each Claude chat's transcript (slice 3b): the contract-checked fake, with one entry for plan.
  const transcripts = fakeTranscriptServer()
  transcripts.set(`mac-mini/${plan.local}`, [{ type: 'user', id: 'u1', text: planEntry, cut: false }])
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const transcript = transcripts.handle(path, init)
      if (transcript !== undefined) return Promise.resolve(transcript)
      const layout = /^\/api\/workspaces\/([^/]+)\/layout$/.exec(path)
      if (layout) {
        const id = decodeURIComponent(layout[1] ?? '')
        layoutReads.push(id)
        const answer = layouts[id]
        return Promise.resolve(
          answer
            ? answer()
            : new Response(JSON.stringify({ error: { kind: 'not-found', message: 'none', requestId: 'r-1' } }), {
                status: 404,
              }),
        )
      }
      if (path === '/api/workspaces') {
        listReads.push(url)
        return Promise.resolve(
          new Response(
            JSON.stringify({
              machine: 'mac-mini',
              workspaces: [
                { id: live, label: 'live work', chats: listed.map(summary) },
                ...(two ? [{ id: other, label: 'other work', chats: [summary(review)] }] : []),
              ],
            }),
            { status: 200 },
          ),
        )
      }
      if (path === '/api/events') {
        const body = new ReadableStream<Uint8Array>({
          start: (control) => {
            streams.push(control)
            control.enqueue(encoder.encode('event: open\nretry: 200\ndata: {}\n\n'))
          },
        })
        init?.signal?.addEventListener('abort', () => {
          try {
            body.cancel().catch(() => undefined)
          } catch {
            // The stream is locked by its reader, which the abort ends.
          }
        })
        return Promise.resolve(new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } }))
      }
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
  return {
    layoutReads,
    listReads,
    answer: (next: Partial<Record<string, () => Response>>) => {
      layouts = next
    },
    send: (event: string, data: unknown) => {
      for (const control of streams) {
        try {
          control.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify({ source: 'mac-mini/agents', seq: 1, type: event, data })}\n\n`,
            ),
          )
        } catch {
          // A stream the page closed.
        }
      }
    },
  }
}

let view: { unmount: () => Promise<void> } | undefined
let router: ReturnType<typeof createRouter> | undefined
/** The element testRender put the app in: the child of <body> that openApp added. */
let viewContainer: Element | undefined

// Each test stubs fetch itself; between tests, a read that a page started after its test ended gets the stubbed
// server, never the one on this machine (liveServerStub.ts).
stubLiveServer()

// A layout read that a 5xx fails is retried twice by the app client. The retries stay; only their waits (1 s and 2 s)
// go, so settled() never takes a pause between tries for the end of the reads.
const queryDefaults = queryClient.getDefaultOptions()
beforeAll(() => {
  queryClient.setDefaultOptions({ ...queryDefaults, queries: { ...queryDefaults.queries, retryDelay: 0 } })
})
afterAll(() => {
  queryClient.setDefaultOptions(queryDefaults)
})

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

async function openApp(path = '/') {
  const before = new Set(document.body.children)
  router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultErrorComponent: RouteError,
  })
  view = await testRender(
    <>
      <RouterProvider router={router} />
      <ErrorTray />
    </>,
    rootErrorOptions,
  )
  viewContainer = [...document.body.children].find((child) => !before.has(child))
}

/** Opens the app at `size`, taps Workspaces in the rail or the tab bar; the URL has no parameters. */
async function tapWorkspaces(size: readonly [number, number] = [1512, 982], fill = false) {
  await setViewport(size[0], size[1])
  await openApp()
  if (fill) fillWindow()
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router?.state.location.pathname).toBe('/workspaces')
  expect(router?.state.location.searchStr).toBe('')
}

/** Taps Workspaces on the desktop and hides the sidebar, so the workbench shows its panes; `fill`: see fillWindow. */
async function showPanes(fill = false) {
  await tapWorkspaces(undefined, fill)
  await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
}

const maximise = (c: Chat) => page.getByRole('button', { name: `Maximise ${c.title}`, exact: true })

/** The box of the pane of `c`: the pane around its Maximise button. */
function paneBox(c: Chat): DOMRect {
  const pane = maximise(c).element().closest('[data-figma]')
  if (pane === null) throw new Error(`no pane for ${c.title}`)
  return pane.getBoundingClientRect()
}

/** The titles of the panes drawn, by their Maximise buttons. */
const drawn = () =>
  [...document.querySelectorAll('button[aria-label^="Maximise "]')].map((b) =>
    (b.getAttribute('aria-label') ?? '').slice('Maximise '.length),
  )

/** The focused pane's title: the pane with `aria-current`. */
function focusedTitle(): string | undefined {
  const current = [...document.querySelectorAll('[aria-current="true"]')].find((e) =>
    e.querySelector('button[aria-label^="Maximise "]'),
  )
  return current
    ?.querySelector('button[aria-label^="Maximise "]')
    ?.getAttribute('aria-label')
    ?.slice('Maximise '.length)
}

/**
 * The value of `count` once it stays the same for 300 ms: the page loads once more when the event stream opens, so a
 * test waits for that load before it sends an event.
 */
async function settled(count: () => number): Promise<number> {
  await expect.poll(count).toBeGreaterThan(0)
  for (;;) {
    const before = count()
    await new Promise((resolve) => setTimeout(resolve, 300))
    if (count() === before) return before
  }
}

/**
 * Gives the app the window's height, as main.ts does: the marker on <html> and `#root` on the view's container, which
 * index.css fixes to the window. testRender's container has no id, so the app is only as high as its content.
 */
function fillWindow() {
  const container = viewContainer
  if (container === undefined) throw new Error('no view container')
  container.id = 'root'
  onTestFinished(markApp())
  onTestFinished(() => {
    container.removeAttribute('id')
  })
}

/** The back button of an open chat's header, named after the list it goes back to. */
const back = 'button[aria-label$="Workspaces"]'

/** The text of the open chat's header: the smallest box around its heading `title` that holds the back button. */
function headerText(title: string): string {
  let box = page.getByRole('heading', { name: title }).element().parentElement
  while (box !== null && box.querySelector(back) === null) box = box.parentElement
  return box?.textContent ?? ''
}

const trayBadge = () => page.getByRole('complementary', { name: 'Error reports' })

describe("a live workspace's herdr layout on the desktop (slice 3a)", () => {
  it('draws a row of two panes side by side at 30 : 70, the focused chat current', async () => {
    fakeServer(chats, { [live]: oneTab(row(0.3, pane(plan), pane(review)), review) })
    await showPanes()
    await expect.element(maximise(plan)).toBeVisible()
    await expect.element(maximise(review)).toBeVisible()
    expect(drawn()).toEqual(['plan the slice', 'review notes'])
    const [a, b] = [paneBox(plan), paneBox(review)]
    expect(a.right).toBeLessThanOrEqual(b.left)
    expect(Math.abs(a.top - b.top)).toBeLessThan(1)
    await expect.element(page.getByRole('separator', { name: 'Resize columns' })).toHaveAttribute('aria-valuenow', '30')
    expect(a.width / (a.width + b.width)).toBeCloseTo(0.3, 1)
    expect(focusedTitle()).toBe('review notes')
  })

  it('draws a column of two panes one above the other', async () => {
    fakeServer(chats, { [live]: oneTab(column(0.4, pane(plan), pane(logs)), plan) })
    // The window's height, as the app has it: in the view's own height 40 % of the stack is under a chat's floor.
    await showPanes(true)
    await expect.element(maximise(logs)).toBeVisible()
    expect(drawn()).toEqual(['plan the slice', 'tail logs'])
    const [a, b] = [paneBox(plan), paneBox(logs)]
    expect(a.bottom).toBeLessThanOrEqual(b.top)
    expect(Math.abs(a.left - b.left)).toBeLessThan(1)
    await expect.element(page.getByRole('separator', { name: 'Resize rows' })).toHaveAttribute('aria-valuenow', '40')
    await expect.element(page.getByText('Terminal not live yet')).toBeVisible()
    expect(focusedTitle()).toBe('plan the slice')
  })

  it('draws the rows-first 2×2 with each handle at its split ratio', async () => {
    fakeServer(chats, {
      [live]: oneTab(column(0.5, row(0.6, pane(plan), pane(review)), row(0.25, pane(logs), pane(tokens))), tokens),
    })
    await showPanes()
    await expect.element(maximise(tokens)).toBeVisible()
    const [a, b, c, d] = [paneBox(plan), paneBox(review), paneBox(logs), paneBox(tokens)]
    // a b over c d.
    expect(a.right).toBeLessThanOrEqual(b.left)
    expect(c.right).toBeLessThanOrEqual(d.left)
    expect(a.bottom).toBeLessThanOrEqual(c.top)
    expect(b.bottom).toBeLessThanOrEqual(d.top)
    const columns = page.getByRole('separator', { name: 'Resize columns' })
    await expect.element(columns.nth(0)).toHaveAttribute('aria-valuenow', '60')
    await expect.element(columns.nth(1)).toHaveAttribute('aria-valuenow', '25')
    await expect.element(page.getByRole('separator', { name: 'Resize rows' })).toHaveAttribute('aria-valuenow', '50')
    expect(focusedTitle()).toBe('theme tokens')
  })

  it('draws the first four panes in tree order of a tree of six', async () => {
    const root = row(
      0.5,
      column(0.5, pane(drift), pane(plan)),
      row(0.5, pane(evals), row(0.5, pane(review), row(0.5, pane(logs), pane(tokens)))),
    )
    fakeServer(chats, { [live]: oneTab(root, plan) })
    await showPanes()
    await expect.element(maximise(review)).toBeVisible()
    expect([...drawn()].sort()).toEqual(['drift check', 'eval round', 'plan the slice', 'review notes'])
    await expect.element(maximise(logs)).not.toBeInTheDocument()
    await expect.element(maximise(tokens)).not.toBeInTheDocument()
    // The chats past four stay rows of the sidebar.
    await userEvent.click(page.getByRole('button', { name: 'Show the workspace sidebar' }))
    await expect.element(page.getByRole('button', { name: 'theme tokens', exact: true })).toBeVisible()
  })

  it("draws the active tab's panes, not an inactive tab's", async () => {
    fakeServer(chats, {
      [live]: () =>
        new Response(
          layoutBody(live, [
            { label: 'old', active: false, root: row(0.5, pane(plan), pane(review)), focused: plan },
            { label: 'now', active: true, root: column(0.5, pane(drift), pane(evals)), focused: evals },
          ]),
          { status: 200 },
        ),
    })
    await showPanes()
    await expect.element(maximise(evals)).toBeVisible()
    expect(drawn()).toEqual(['drift check', 'eval round'])
    expect(focusedTitle()).toBe('eval round')
  })

  it('keeps the first four chats as the panes on a 503 layout read, says so once, and clears it after a good read', async () => {
    const unavailable = () =>
      new Response(JSON.stringify({ error: { kind: 'herdr-unavailable', message: 'no herdr', requestId: 'r-3' } }), {
        status: 503,
      })
    const server = fakeServer(chats, { [live]: unavailable })
    await showPanes()
    await expect.element(maximise(tokens)).toBeVisible()
    expect([...drawn()].sort()).toEqual(['plan the slice', 'review notes', 'tail logs', 'theme tokens'])
    expect(server.layoutReads).toContain(live)
    await expect.element(page.getByText('Live data unavailable — no workspaces shown')).not.toBeInTheDocument()
    await expect.element(page.getByText('Layout not live — first 4 chats')).toBeVisible()
    // The page reads the layout again (the stream's open, layout.changed) while herdr is down: still one report.
    const reads = await settled(() => server.layoutReads.filter((id) => id === live).length)
    server.send('layout.changed', { workspace: live })
    await expect.poll(() => server.layoutReads.filter((id) => id === live).length).toBeGreaterThan(reads)
    await new Promise((resolve) => setTimeout(resolve, 300))
    const missed = getReports().filter((r) => r.error.name === 'LayoutReadMissError')
    expect(missed).toHaveLength(1)
    expect(missed[0]?.source).toBe('live')
    // A stable name and the miss's kind and status, with no text from the server.
    expect(missed[0]?.error.message).toBe('A workspace layout read missed: herdr-unavailable')
    expect(missed[0]?.error.message).not.toContain('no herdr')
    expect(missed[0]?.error.message).not.toContain('r-3')
    await expect.element(trayBadge().getByRole('button', { name: '1 error' })).toBeVisible()
    // herdr answers again: the layout draws and the line goes.
    server.answer({ [live]: oneTab(row(0.5, pane(plan), pane(drift)), drift) })
    server.send('layout.changed', { workspace: live })
    await expect.element(maximise(drift)).toBeVisible()
    await expect.element(page.getByText('Layout not live — first 4 chats')).not.toBeInTheDocument()
    expect(getReports().filter((r) => r.error.name === 'LayoutReadMissError')).toHaveLength(1)
  })

  it('lets the owner drag the handle of two stacked chats, whose floors leave out the transcript', async () => {
    fakeServer(chats, { [live]: oneTab(column(0.5, pane(plan), pane(tokens)), plan) })
    await showPanes(true)
    await expect.element(maximise(tokens)).toBeVisible()
    const handle = page.getByRole('separator', { name: 'Resize rows' })
    await expect.element(handle).toHaveAttribute('aria-valuenow', '50')
    // Each pane is far higher than its header and composer, so the handle moves both ways.
    await userEvent.click(handle)
    for (let i = 0; i < 5; i += 1) await userEvent.keyboard('{ArrowUp}')
    await expect.poll(() => Number(handle.element().getAttribute('aria-valuenow'))).toBeLessThan(50)
    for (let i = 0; i < 10; i += 1) await userEvent.keyboard('{ArrowDown}')
    await expect.poll(() => Number(handle.element().getAttribute('aria-valuenow'))).toBeGreaterThan(50)
  })

  it('draws the focused pane of a tree of six, not only the first four', async () => {
    const six = [review, logs, tokens, drift, evals].reduce<Node>((above, c) => column(0.5, above, pane(c)), pane(plan))
    fakeServer(chats, { [live]: oneTab(six, drift) })
    await showPanes()
    await expect.element(maximise(drift)).toBeVisible()
    expect(drawn()).toEqual(['tail logs', 'theme tokens', 'drift check', 'eval round'])
    expect(focusedTitle()).toBe('drift check')
  })

  it("keeps each stacked pane's header and composer in view, from a long column's small shares", async () => {
    // A chain of column splits at 0.5: the first four panes are 3.125, 3.125, 6.25 and 12.5 % of herdr's tab, 1 : 1 :
    // 2 : 4 as herdr's 5, 5, 10 and 20 % of a ten-pane column, so the page scales them to 12.5, 12.5, 25 and 50 %.
    const tree = chats.slice(1).reduce<Node>((above, c) => column(0.5, above, pane(c)), pane(plan))
    fakeServer(chats, { [live]: oneTab(tree, plan) })
    await showPanes(true)
    await expect.element(maximise(tokens)).toBeVisible()
    expect(drawn()).toEqual(['plan the slice', 'review notes', 'tail logs', 'theme tokens'])
    const separator = page.getByRole('separator', { name: 'Resize rows' })
    // The first handle leaves its scaled share, 12.5 %, for plan the slice's floor.
    await expect.poll(() => Number(separator.nth(0).element().getAttribute('aria-valuenow'))).toBeGreaterThan(12.5)
    // Each pane's composer (a chat's) or header (the shell's) ends inside its pane.
    for (const c of [plan, review, tokens]) {
      const box = paneBox(c)
      const pane = maximise(c).element().closest('[data-figma]')
      const composer = pane?.querySelector('[data-pane-floor]')
      if (composer == null) throw new Error(`no composer in ${c.title}`)
      expect(composer.getBoundingClientRect().bottom).toBeLessThanOrEqual(box.bottom + 0.5)
    }
    // The panes fill the stack: the four boxes reach from the first's top to the last's bottom.
    const boxes = [plan, review, logs, tokens].map(paneBox)
    const heights = boxes.reduce((sum, b) => sum + b.height, 0)
    const span = (boxes[3]?.bottom ?? 0) - (boxes[0]?.top ?? 0)
    expect(span - heights).toBeLessThan(40)
    // theme tokens, the largest, gave the room: it stays the largest pane.
    expect(Math.max(...boxes.map((b) => b.height))).toBe(boxes[3]?.height)
  })

  it('shows RouteError, and counts it in the tray, for a layout the contract refuses', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    fakeServer(chats, { [live]: () => new Response(JSON.stringify({ workspace: live, tabs: [] }), { status: 200 }) })
    await tapWorkspaces()
    await expect.element(page.getByText('This page failed to load')).toBeVisible()
    await expect.element(trayBadge().getByRole('button', { name: '1 error' })).toBeVisible()
  })

  it('reads the layout again on layout.changed for the shown workspace and redraws, with no reload', async () => {
    const server = fakeServer(chats, { [live]: oneTab(pane(plan), plan) }, true)
    await showPanes()
    await expect.element(maximise(plan)).toBeVisible()
    expect(drawn()).toEqual(['plan the slice'])
    const reads = await settled(() => server.layoutReads.filter((id) => id === live).length)
    const lists = server.listReads.length
    server.answer({ [live]: oneTab(row(0.5, pane(plan), pane(drift)), drift) })
    server.send('layout.changed', { workspace: live })
    await expect.element(maximise(drift)).toBeVisible()
    expect(drawn()).toEqual(['plan the slice', 'drift check'])
    expect(focusedTitle()).toBe('drift check')
    expect(server.layoutReads.filter((id) => id === live)).toHaveLength(reads + 1)
    // The event reads only the layout, not the list.
    expect(server.listReads).toHaveLength(lists)
    expect(router?.state.location.pathname).toBe('/workspaces')
  })

  it('redraws a newer herdr layout after the owner switched tabs and focused a pane', async () => {
    const server = fakeServer(chats, { [live]: oneTab(row(0.5, pane(plan), pane(review)), plan) }, true)
    await showPanes(true)
    await expect.element(maximise(review)).toBeVisible()
    await settled(() => server.layoutReads.filter((id) => id === live).length)
    // The owner's changes: a tab switch there and back, which keeps each workspace's layout, and a pane focused.
    await userEvent.click(page.getByRole('tab', { name: /other work/ }))
    await userEvent.click(page.getByRole('tab', { name: /live work/ }))
    await userEvent.click(page.getByText('review notes', { exact: true }).first())
    await expect.poll(focusedTitle).toBe('review notes')
    server.answer({ [live]: oneTab(column(0.25, pane(plan), pane(drift)), drift) })
    server.send('layout.changed', { workspace: live })
    await expect.element(maximise(drift)).toBeVisible()
    await expect.element(maximise(review)).not.toBeInTheDocument()
    expect(paneBox(plan).bottom).toBeLessThanOrEqual(paneBox(drift).top)
    await expect.element(page.getByRole('separator', { name: 'Resize rows' })).toHaveAttribute('aria-valuenow', '25')
    expect(focusedTitle()).toBe('drift check')
  })

  it("does not read the shown workspace's layout on layout.changed for another workspace", async () => {
    const server = fakeServer(chats, { [live]: oneTab(pane(plan), plan) }, true)
    await showPanes()
    await expect.element(maximise(plan)).toBeVisible()
    const reads = await settled(() => server.layoutReads.filter((id) => id === live).length)
    server.answer({ [live]: oneTab(row(0.5, pane(plan), pane(drift)), drift) })
    const others = server.layoutReads.filter((id) => id === other).length
    server.send('layout.changed', { workspace: other })
    await expect.poll(() => server.layoutReads.filter((id) => id === other).length).toBe(others + 1)
    // A workspace the server does not list is not read at all.
    server.send('layout.changed', { workspace: 'mac-mini/w-gone' })
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(server.layoutReads.filter((id) => id === live)).toHaveLength(reads)
    expect(server.layoutReads).not.toContain('mac-mini/w-gone')
    expect(drawn()).toEqual(['plan the slice'])
  })
})

describe('the herdr layout on the phone and the tablet, and with the fixtures (slice 3a)', () => {
  const sizes = [
    { name: 'the phone', size: [390, 844] },
    { name: 'the tablet', size: [756, 1129] },
  ] as const
  for (const device of sizes)
    it(`draws no panes on ${device.name}: the list keeps every chat, and a tap opens the chat`, async () => {
      fakeServer(chats, { [live]: oneTab(row(0.3, pane(logs), pane(review)), logs) })
      await tapWorkspaces(device.size)
      for (const c of chats) await expect.element(page.getByText(c.title, { exact: true }).first()).toBeVisible()
      expect(drawn()).toEqual([])
      await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
      await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
      await expect.element(page.getByText(planEntry)).toBeVisible()
      expect(drawn()).toEqual([])
    })

  for (const device of sizes)
    it(`keeps the chat the owner opened on ${device.name} when the first workspace's layout changes`, async () => {
      const server = fakeServer([plan, drift], { [live]: oneTab(row(0.5, pane(plan), pane(drift)), plan) }, true)
      await tapWorkspaces(device.size)
      await settled(() => server.layoutReads.filter((id) => id === live).length)
      await userEvent.click(page.getByText('review notes', { exact: true }).first())
      await expect.element(page.getByRole('heading', { name: 'review notes' })).toBeVisible()
      server.answer({ [live]: oneTab(column(0.5, pane(plan), pane(drift)), drift) })
      server.send('layout.changed', { workspace: live })
      await expect.poll(() => server.layoutReads.filter((id) => id === live).length).toBeGreaterThan(1)
      await new Promise((resolve) => setTimeout(resolve, 300))
      await expect.element(page.getByRole('heading', { name: 'review notes' })).toBeVisible()
      await expect.element(page.getByRole('heading', { name: 'drift check' })).not.toBeInTheDocument()
    })

  // A live state's panes hold every chat of every workspace (d-117), so the chat's header names the workspace that
  // lists the chat, not the first workspace (`data.current`).
  for (const device of sizes)
    it(`names the workspace that holds the opened chat in its header on ${device.name}`, async () => {
      const otherTab = () =>
        new Response(layoutBody(other, [{ label: 'main', active: true, root: pane(review), focused: review }]), {
          status: 200,
        })
      fakeServer([plan, drift], { [live]: oneTab(row(0.5, pane(plan), pane(drift)), plan), [other]: otherTab }, true)
      await tapWorkspaces(device.size)
      // A chat of the second workspace.
      await userEvent.click(page.getByText('review notes', { exact: true }).first())
      await expect.element(page.getByRole('heading', { name: 'review notes' })).toBeVisible()
      await expect.poll(() => headerText('review notes')).toContain('other work')
      expect(headerText('review notes')).not.toContain('live work')
      // Back to the list, then a chat of the first workspace.
      const backButton = document.querySelector<HTMLElement>(back)
      if (backButton === null) throw new Error('no back button')
      await userEvent.click(backButton)
      await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
      await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
      await expect.poll(() => headerText('plan the slice')).toContain('live work')
      expect(headerText('plan the slice')).not.toContain('other work')
    })

  it('makes no layout request for ?source=fixtures or ?state=', async () => {
    const server = fakeServer(chats, { [live]: oneTab(pane(plan), plan) })
    await setViewport(1512, 982)
    for (const path of ['/workspaces?source=fixtures', '/workspaces?state=workbench']) {
      await openApp(path)
      await expect.element(page.getByText('drift check').first()).toBeVisible()
      await view?.unmount()
      view = undefined
    }
    expect(server.layoutReads).toEqual([])
    expect(server.listReads).toEqual([])
  })
})
