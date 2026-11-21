import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { createClientErrorSender, type PostReport } from '../errors/clientErrorSender.ts'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { addSink, clearReports, type ErrorReport, getReports } from '../errors/reporter.ts'
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
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// W5: a live Claude chat's effort, /compact and /clear, and the pane follow.
// Each test takes the owner's path: it opens the app with no URL parameters,
// taps Workspaces and a live chat, with a stubbed server whose routes are the
// contract-checked fakes (lib/fakeTranscriptServer.ts for the chat routes,
// lib/fakeWorkspacesServer.ts for the list, its layouts and its events). The
// effort shows read-only beside the model; /compact and /clear sit in the
// chat's actions, off while it works and absent for a Codex chat and a shell;
// each opens a page dialog; a /clear, from the page or the terminal, gives
// the chat a new ID on its pane, and the page follows it. No report, posted
// client error or console line holds the instructions or the draft.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'
const drift = 'mac-mini/c3'
const logs = 'mac-mini/c4'

type Status = 'working' | 'idle' | 'needsYou'
const summary = (id: string, kind: 'claude' | 'codex' | 'shell', title: string, status: Status) => ({
  id,
  kind,
  title,
  model: kind === 'codex' ? 'gpt-5.5' : kind === 'shell' ? 'zsh' : 'claude-opus-5-5',
  contextUsed: null,
  modelId: kind === 'claude' ? 'opus' : null,
  effort: id === plan ? 'high' : null,
  pane: `${id}-pane`,
  status,
  parent: null,
})
// plan is idle at high effort; review works; drift is an idle Codex chat; logs an idle shell.
const list = {
  machine: 'mac-mini',
  workspaces: [
    {
      id: workspace,
      label: 'live work',
      chats: [
        summary(plan, 'claude', 'plan the slice', 'idle'),
        summary(review, 'claude', 'review notes', 'working'),
        summary(drift, 'codex', 'drift check', 'idle'),
        summary(logs, 'shell', 'tail logs', 'idle'),
      ],
    },
  ],
}

const user = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })

/** The instructions and the draft the tests type: they must never reach a report, a client error or the console. */
const secret = 'keep the private branch notes'

type Fakes = { chats: FakeTranscriptServer; list: FakeWorkspacesServer }

/** The stubbed server: the fakes' routes, and a rejection for anything else. */
function withChats({ eventOnClear = true } = {}): Fakes {
  const chats = fakeTranscriptServer()
  chats.set(plan, [user('u1', 'Fix the build')])
  chats.set(review, [user('u2', 'Review the notes')])
  const workspaces = fakeWorkspacesServer(chats, list, { eventOnClear })
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
const cleanups: (() => void)[] = []

stubLiveServer()

// A read that a page starts after its test ended gets no answer, not the real server (lib/lateServerReads.ts).
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

/** Opens the app at `size` and taps Workspaces in the rail or the tab bar; the URL has no parameters. */
async function tapWorkspaces(size: readonly [number, number]) {
  await setViewport(size[0], size[1])
  const router = createRouter({
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
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  expect(router.state.location.searchStr).toBe('')
}

/** Taps the live chat `title` in the list, on the phone or the tablet, or in the desktop sidebar. */
async function tapChat(title: string) {
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
}

/** The region of the open chat or of a workbench pane, named by its title. */
const chatRegion = (title: string) => page.getByRole('region', { name: title })
/** The chat actions of `title`: the ⋯ of its header or its pane. */
const actionsButton = (title: string) => page.getByRole('button', { name: `${title} actions` })

/** Opens the chat's actions and picks `label`: a row of the phone's sheet (`radio`) or of a menu (`menuitem`). */
async function pick(title: string, label: string, role: 'radio' | 'menuitem' = 'radio') {
  await userEvent.click(actionsButton(title))
  // A sheet's row is a radio whose input the library hides: the owner taps its label.
  await userEvent.click(
    role === 'radio' ? page.getByText(label, { exact: true }) : page.getByRole(role, { name: label }),
  )
}

/** Every place a report can carry text: the reporter's sink, the posted client errors and the console. */
function watchReports() {
  const sunk: ErrorReport[] = []
  cleanups.push(addSink((r) => sunk.push(r)))
  const posted: string[] = []
  const post = vi.fn<PostReport>((body) => {
    posted.push(body)
    return Promise.resolve(204)
  })
  cleanups.push(addSink(createClientErrorSender({ post })))
  const logged: unknown[] = []
  for (const level of ['error', 'warn', 'log', 'info'] as const)
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      logged.push(...args)
    })
  return {
    sunk,
    posted,
    /** Fails when any of them holds the instructions or the draft. */
    expectNoText: () => {
      const all = JSON.stringify([
        sunk.map((r) => [r.error.message, r.error.stack, r.error.name, r.componentStack]),
        posted,
        logged.map((l) => (l instanceof Error ? [l.message, l.stack] : String(l))),
      ])
      expect(all).not.toContain('private branch')
    },
  }
}

describe("a live chat's model and effort (W5)", () => {
  // W10 made the chip of a live Claude chat its effort picker (app/WorkspacesEffort.test.tsx); the model stays text.
  it('shows the effort beside the model, on the phone', async () => {
    withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    await expect.element(chatRegion('plan the slice').getByText('Opus 5.5 · high effort')).toBeVisible()
    // A chat whose effort is not known shows the model alone.
    await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
    await tapChat('review notes')
    await expect.element(chatRegion('review notes').getByText('Opus 5.5', { exact: true })).toBeVisible()
    expect(page.getByText(/effort/).elements()).toHaveLength(0)
  })

  it("shows the effort in the pane's header on the desktop workbench", async () => {
    withChats()
    await tapWorkspaces(desktop)
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(page.getByText('Opus 5.5 · high effort')).toBeVisible()
    expect(page.getByRole('button', { name: /^Model:/ }).elements()).toHaveLength(0)
  })
})

describe("a live chat's commands in its actions (W5)", () => {
  it('offers /compact and /clear for an idle Claude chat, off while it works and none for Codex, on the phone', async () => {
    withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    await userEvent.click(actionsButton('plan the slice'))
    await expect.element(page.getByRole('radio', { name: 'Compact context…' })).toBeEnabled()
    await expect.element(page.getByRole('radio', { name: 'Clear context…' })).toBeEnabled()
    await userEvent.keyboard('{Escape}')
    await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
    await tapChat('review notes')
    await userEvent.click(actionsButton('review notes'))
    await expect.element(page.getByRole('radio', { name: 'Compact context…' })).toBeDisabled()
    await expect.element(page.getByRole('radio', { name: 'Clear context…' })).toBeDisabled()
    await userEvent.keyboard('{Escape}')
    await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
    await tapChat('drift check')
    await userEvent.click(actionsButton('drift check'))
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(page.getByText('Compact context…').elements()).toHaveLength(0)
    expect(page.getByText('Clear context…').elements()).toHaveLength(0)
  })

  it('turns them on only while the chat is idle or done: off when it needs the owner or its status is unknown', async () => {
    const { list: workspaces } = withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    for (const [status, label, on] of [
      ['needsYou', 'Needs you', false],
      ['unknown', 'Unknown', false],
      ['done', 'Done', true],
      ['working', 'Working', false],
      ['idle', 'Idle', true],
    ] as const) {
      workspaces.setStatus(plan, status)
      // The header's status pill shows the new status once the page read the list again.
      await expect.element(chatRegion('plan the slice').getByText(label, { exact: true })).toBeVisible()
      await userEvent.click(actionsButton('plan the slice'))
      const compact = page.getByRole('radio', { name: 'Compact context…' })
      const clear = page.getByRole('radio', { name: 'Clear context…' })
      if (on) {
        await expect.element(compact).toBeEnabled()
        await expect.element(clear).toBeEnabled()
      } else {
        await expect.element(compact).toBeDisabled()
        await expect.element(clear).toBeDisabled()
      }
      await userEvent.keyboard('{Escape}')
      await expect.element(compact).not.toBeInTheDocument()
    }
  })

  it('puts them in the pane menus of the desktop workbench: on for the idle Claude chat only', async () => {
    withChats()
    await tapWorkspaces(desktop)
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await userEvent.click(actionsButton('plan the slice'))
    await expect.element(page.getByRole('menuitem', { name: 'Compact context…' })).not.toHaveAttribute('aria-disabled')
    await expect.element(page.getByRole('menuitem', { name: 'Clear context…' })).not.toHaveAttribute('aria-disabled')
    await userEvent.keyboard('{Escape}')
    await userEvent.click(actionsButton('review notes'))
    await expect
      .element(page.getByRole('menuitem', { name: 'Compact context…' }))
      .toHaveAttribute('aria-disabled', 'true')
    await expect
      .element(page.getByRole('menuitem', { name: 'Clear context…' }))
      .toHaveAttribute('aria-disabled', 'true')
    await userEvent.keyboard('{Escape}')
    for (const title of ['drift check', 'tail logs']) {
      await userEvent.click(actionsButton(title))
      await expect.element(page.getByRole('menuitem', { name: 'Rename chat' })).toBeVisible()
      expect(page.getByRole('menuitem', { name: 'Compact context…' }).elements()).toHaveLength(0)
      expect(page.getByRole('menuitem', { name: 'Clear context…' }).elements()).toHaveLength(0)
      await userEvent.keyboard('{Escape}')
    }
  })
})

describe('/compact (W5)', () => {
  it('posts /compact with no instructions from its dialog on the phone, then closes it', async () => {
    const { chats } = withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    await pick('plan the slice', 'Compact context…')
    const dialog = page.getByRole('dialog', { name: 'Compact the context' })
    await expect.element(dialog).toBeVisible()
    await expect.element(dialog.getByRole('textbox', { name: 'Instructions (optional)' })).toHaveFocus()
    await userEvent.click(dialog.getByRole('button', { name: 'Compact' }))
    await expect.poll(() => chats.commands).toEqual([{ chat: plan, request: { command: 'compact' } }])
    expect(chats.paths).toEqual(['/api/chats/mac-mini%2Fc1/command'])
    await expect.element(dialog).not.toBeInTheDocument()
    expect(getReports()).toEqual([])
  })

  it('posts the one-line instructions with Enter on the desktop workbench, and reports no text', async () => {
    const { chats } = withChats()
    const reports = watchReports()
    await tapWorkspaces(desktop)
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await pick('plan the slice', 'Compact context…', 'menuitem')
    const dialog = page.getByRole('dialog', { name: 'Compact the context' })
    await userEvent.fill(dialog.getByRole('textbox'), secret)
    await userEvent.keyboard('{Enter}')
    await expect
      .poll(() => chats.commands)
      .toEqual([{ chat: plan, request: { command: 'compact', instructions: secret } }])
    await expect.element(dialog).not.toBeInTheDocument()
    expect(reports.sunk).toEqual([])
    reports.expectNoText()
  })

  it('keeps the dialog with "Not compacted — chat is working" on a 409 working, with no report', async () => {
    const { chats } = withChats()
    chats.answerCommands(() =>
      errorAnswer({ kind: 'chat-not-ready', state: 'working', message: 'Working', requestId: 'r-409' }, 409),
    )
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    await pick('plan the slice', 'Compact context…')
    const dialog = page.getByRole('dialog', { name: 'Compact the context' })
    await userEvent.click(dialog.getByRole('button', { name: 'Compact' }))
    await expect.element(dialog.getByText('Not compacted — chat is working')).toBeVisible()
    expect(getReports()).toEqual([])
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }))
    await expect.element(dialog).not.toBeInTheDocument()
  })

  it("offers to clear the chat's terminal input on a 409 inputNotEmpty, then compacts", async () => {
    const { chats } = withChats()
    chats.typeInTerminal(plan)
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    await pick('plan the slice', 'Compact context…')
    const dialog = page.getByRole('dialog', { name: 'Compact the context' })
    await userEvent.click(dialog.getByRole('button', { name: 'Compact' }))
    await expect
      .element(dialog.getByText("Not compacted — clear the text in the chat's terminal input, then try again"))
      .toBeVisible()
    expect(chats.commands).toEqual([])
    await userEvent.click(dialog.getByRole('button', { name: 'Clear the terminal input' }))
    const ask = page.getByRole('alertdialog', { name: 'Clear the terminal input?' })
    await expect.element(ask.getByText(/Then the page compacts the chat\./)).toBeVisible()
    await userEvent.click(ask.getByRole('button', { name: 'Clear' }))
    await expect.poll(() => chats.clears).toEqual([plan])
    await expect.poll(() => chats.commands).toEqual([{ chat: plan, request: { command: 'compact' } }])
    await expect.element(dialog).not.toBeInTheDocument()
    expect(getReports()).toEqual([])
  })

  it('reports a 5xx with its kind and status only, never the instructions', async () => {
    const { chats } = withChats()
    const reports = watchReports()
    chats.answerCommands(() =>
      errorAnswer({ kind: 'herdr-unavailable', message: 'herdr down', requestId: 'r-503' }, 503),
    )
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    await pick('plan the slice', 'Compact context…')
    const dialog = page.getByRole('dialog', { name: 'Compact the context' })
    await userEvent.fill(dialog.getByRole('textbox'), secret)
    await userEvent.click(dialog.getByRole('button', { name: 'Compact' }))
    await expect.element(dialog.getByText('Not compacted — herdr-unavailable')).toBeVisible()
    await expect
      .poll(() => reports.sunk.map((r) => r.error.message))
      .toEqual(['A chat compact missed: herdr-unavailable 503'])
    await expect.poll(() => reports.posted.length).toBe(1)
    reports.expectNoText()
  })
})

describe('/clear and the pane follow (W5)', () => {
  it('does nothing on Cancel', async () => {
    const { chats } = withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    await pick('plan the slice', 'Clear context…')
    const dialog = page.getByRole('alertdialog', { name: 'Clear the context?' })
    await expect.element(dialog.getByText(/context will be cleared/)).toBeVisible()
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }))
    await expect.element(dialog).not.toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(chats.posts).toEqual([])
    await expect.element(chatRegion('plan the slice').getByText('Fix the build')).toBeVisible()
  })

  it('follows the pane to the new chat after Clear on the phone, with an empty composer and no chips', async () => {
    const { chats } = withChats()
    vi.stubGlobal('XMLHttpRequest', chats.uploads.XMLHttpRequest)
    const reports = watchReports()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    await userEvent.fill(chatRegion('plan the slice').getByRole('textbox'), secret)
    // A file of the old chat: the server holds its upload for that chat, so the follow drops it.
    const input = chatRegion('plan the slice').element().querySelector('input[type="file"]')
    if (!(input instanceof HTMLInputElement)) throw new Error('no file input')
    await userEvent.upload(input, [new File(['abc'], 'notes.pdf', { type: 'application/pdf' })])
    await expect.element(chatRegion('plan the slice').getByRole('group', { name: 'Attached files' })).toBeVisible()
    await pick('plan the slice', 'Clear context…')
    await userEvent.click(page.getByRole('alertdialog').getByRole('button', { name: 'Clear' }))
    await expect.poll(() => chats.commands).toEqual([{ chat: plan, request: { command: 'clear' } }])
    // The list now names the chat mac-mini/c1-c1 on the same pane: the page shows it, with no messages yet.
    await expect.poll(() => chats.opens).toContain(`${plan}-c1`)
    await expect.element(chatRegion('plan the slice').getByText('No messages yet')).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
    expect(chatRegion('plan the slice').getByText('Fix the build').elements()).toHaveLength(0)
    // The draft was for the old context: the new chat's composer is empty.
    await expect.element(chatRegion('plan the slice').getByRole('textbox')).toHaveValue('')
    await expect
      .element(chatRegion('plan the slice').getByRole('group', { name: 'Attached files' }))
      .not.toBeInTheDocument()
    await expect.poll(() => chats.uploads.calls.some((c) => c.method === 'DELETE')).toBe(true)
    await expect.element(page.getByText(/^Transcript not live/)).not.toBeInTheDocument()
    // The new chat takes a send.
    await userEvent.fill(chatRegion('plan the slice').getByRole('textbox'), 'next')
    await userEvent.click(chatRegion('plan the slice').getByRole('button', { name: 'Send', exact: true }))
    await expect.poll(() => chats.prompts).toEqual([{ chat: `${plan}-c1`, text: 'next' }])
    expect(reports.sunk).toEqual([])
    reports.expectNoText()
  })

  it('reads the list again after Clear when the server sends no event for the new ID, and follows the pane', async () => {
    // The server on herdr answers the /clear and lists the new ID with no workspaces.changed (W5 real run).
    const { chats } = withChats({ eventOnClear: false })
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    await pick('plan the slice', 'Clear context…')
    await userEvent.click(page.getByRole('alertdialog').getByRole('button', { name: 'Clear' }))
    await expect.poll(() => chats.commands).toEqual([{ chat: plan, request: { command: 'clear' } }])
    await expect.poll(() => chats.opens).toContain(`${plan}-c1`)
    await expect.element(chatRegion('plan the slice').getByText('No messages yet')).toBeVisible()
    expect(chatRegion('plan the slice').getByText('Fix the build').elements()).toHaveLength(0)
  })

  it('reads the list no more after Clear once the page has gone', async () => {
    // The reads after a /clear went on for 5 s after the page unmounted and reached the real server in the next test
    // file (the-bridge #342, CI run 44884326755).
    withChats({ eventOnClear: false })
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    await pick('plan the slice', 'Clear context…')
    await userEvent.click(page.getByRole('alertdialog').getByRole('button', { name: 'Clear' }))
    const paths = () =>
      vi
        .mocked(fetch)
        .mock.calls.map(
          ([input]) =>
            new URL(
              typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
              window.location.origin,
            ).pathname,
        )
    const listReads = () => paths().filter((path) => path === '/api/workspaces').length
    await expect.poll(() => paths().some((path) => path.endsWith('/command'))).toBe(true)
    await view?.unmount()
    view = undefined
    const before = listReads()
    // The reads come 0.3 s and 1 s after the /clear's answer: past both, none came.
    await new Promise((resolve) => setTimeout(resolve, 1100))
    expect(listReads()).toBe(before)
  })

  it('sends Clear to the chat whose actions opened it, though the focus moves to another pane meanwhile', async () => {
    const { chats, list: workspaces } = withChats()
    await tapWorkspaces(desktop)
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(chatRegion('plan the slice').getByText('Fix the build')).toBeVisible()
    await pick('plan the slice', 'Clear context…', 'menuitem')
    const dialog = page.getByRole('alertdialog', { name: 'Clear the context?' })
    await expect.element(dialog.getByText('plan the slice')).toBeVisible()
    // herdr's focus moves to review notes while the dialog is open (a live layout.changed).
    workspaces.focus(review)
    await new Promise((resolve) => setTimeout(resolve, 800))
    await expect.element(dialog.getByText('plan the slice')).toBeVisible()
    await userEvent.click(dialog.getByRole('button', { name: 'Clear' }))
    await expect.poll(() => chats.commands).toEqual([{ chat: plan, request: { command: 'clear' } }])
  })

  it('follows the pane in the desktop workbench after Clear', async () => {
    const { chats } = withChats()
    await tapWorkspaces(desktop)
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(chatRegion('plan the slice').getByText('Fix the build')).toBeVisible()
    await pick('plan the slice', 'Clear context…', 'menuitem')
    await userEvent.click(page.getByRole('alertdialog').getByRole('button', { name: 'Clear' }))
    await expect.element(chatRegion('plan the slice').getByText('No messages yet')).toBeVisible()
    expect(chatRegion('plan the slice').getByText('Fix the build').elements()).toHaveLength(0)
    await expect.poll(() => chats.opens).toContain(`${plan}-c1`)
    // The other panes stay.
    await expect.element(chatRegion('review notes').getByText('Review the notes')).toBeVisible()
    expect(getReports()).toEqual([])
  })

  it('follows the pane after Clear on the tablet', async () => {
    const { chats } = withChats()
    await tapWorkspaces(tablet)
    await tapChat('plan the slice')
    await pick('plan the slice', 'Clear context…', 'menuitem')
    await userEvent.click(page.getByRole('alertdialog').getByRole('button', { name: 'Clear' }))
    await expect.poll(() => chats.commands.length).toBe(1)
    await expect.element(chatRegion('plan the slice').getByText('No messages yet')).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
  })

  it('says "Not cleared — chat waits for an answer in the terminal" on a 409 needsYou, and stays', async () => {
    const { chats } = withChats()
    chats.answerCommands(() =>
      errorAnswer({ kind: 'chat-not-ready', state: 'needsYou', message: 'Needs you', requestId: 'r-409' }, 409),
    )
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    await pick('plan the slice', 'Clear context…')
    const dialog = page.getByRole('alertdialog', { name: 'Clear the context?' })
    await userEvent.click(dialog.getByRole('button', { name: 'Clear' }))
    await expect.element(dialog.getByText('Not cleared — chat waits for an answer in the terminal')).toBeVisible()
    // The chat stays as it was: no follow, and the same transcript once the dialog closes.
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }))
    await expect.element(chatRegion('plan the slice').getByText('Fix the build')).toBeVisible()
    expect(getReports()).toEqual([])
  })

  for (const device of [
    { name: 'the phone', size: phone },
    { name: 'the desktop', size: desktop },
  ])
    it(`follows a /clear from the terminal, a list change alone, on ${device.name}`, async () => {
      const { chats, list: workspaces } = withChats()
      await tapWorkspaces(device.size)
      await tapChat('review notes')
      await expect.element(chatRegion('review notes').getByText('Review the notes')).toBeVisible()
      // review notes is not the chat its layout focuses, so only the follow keeps it open.
      workspaces.replaceChat(review, `${review}-t`)
      await expect.element(chatRegion('review notes').getByText('No messages yet')).toBeVisible()
      await expect.element(page.getByRole('heading', { name: 'review notes' })).toBeVisible()
      expect(chats.opens).toContain(`${review}-t`)
      // On the desktop the chat still shows alone beside the sidebar, not the workbench's panes.
      expect(page.getByRole('button', { name: 'Maximise review notes' }).elements()).toHaveLength(0)
      expect(getReports()).toEqual([])
    })
})
