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
import { errorAnswer, fakeTranscriptServer, toolCall } from '../lib/fakeTranscriptServer.ts'
import { type FakeWorkspacesServer, fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { markApp } from './appMarker.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// R69: a chat that needs the owner on a dialog its transcript does not hold
// (a skill's numbered step) shows the dialog as a card after the entries,
// read from `GET /api/chats/:chat/dialog` (the contract's paneDialogs.ts).
// A tap on an option posts `{ id, n }` once; while it goes the options are
// off; a 409 says the terminal changed and the next read shows the new
// dialog; another miss shows a line with Retry. A dialog with no sure options
// shows its read text read-only with "Answer in the terminal". A chat whose
// transcript asks its own question, and a chat with no dialog, show no card.
// Each test takes the owner's path: the app at /, Workspaces, the live chat
// (its pane on the desktop), with no URL parameter, and a stubbed server
// whose routes are the contract-checked fakes.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'
const title = 'plan the slice'

const summary = (id: string, name: string) => ({
  id,
  kind: 'claude',
  title: name,
  model: 'claude-opus-5-5',
  contextUsed: null,
  modelId: 'opus',
  effort: null,
  pane: `${id}-pane`,
  status: 'idle',
  parent: null,
})
const list = {
  machine: 'mac-mini',
  workspaces: [{ id: workspace, label: 'live work', chats: [summary(plan, title), summary(review, 'review notes')] }],
}

const user = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })

/** A made-up dialog of a skill's step, with four numbered options. */
const sample = {
  id: 'a1b2c3d4e5f60718',
  title: 'Sample step',
  body: 'Goal: tidy the notes\nSteps: sort, merge',
  options: [
    { n: 1, label: 'Send structured' },
    { n: 2, label: 'Send original' },
    { n: 3, label: 'Type something' },
    { n: 4, label: 'Chat about this' },
  ],
  raw: 'Sample step\nGoal: tidy the notes\nSteps: sort, merge\nSend this?\n1. Send structured\n2. Send original',
}
/** The same step after the terminal changed: another read text, so another ID. */
const changedSample = { ...sample, id: 'b1b2c3d4e5f60718', title: 'Sample step, again' }
/** A dialog the server could not read for sure: its read text only, long enough to scroll. */
const rawOnly = {
  id: 'c1b2c3d4e5f60718',
  raw: Array.from({ length: 60 }, (_, i) => `line ${String(i + 1)} of a sample menu`).join('\n'),
}

type Server = { readonly workspaces: FakeWorkspacesServer; readonly gate: { hold: boolean; release: () => void } }

/** The stubbed server: the fakes' routes, with a gate that holds dialog answers while `hold`. */
function withChats(entries: readonly TranscriptEntry[] = [user('u1', 'Tidy the notes')]): Server {
  const chats = fakeTranscriptServer()
  chats.set(plan, entries)
  chats.set(review, [user('u2', 'Review the notes')])
  const workspaces = fakeWorkspacesServer(chats, list)
  const held: (() => void)[] = []
  const gate = {
    hold: false,
    release: () => {
      for (const go of held.splice(0)) go()
    },
  }
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const answer = () => chats.handle(path, init) ?? workspaces.handle(path, init)
      if (gate.hold && init?.method === 'POST' && path.endsWith('/dialog'))
        return new Promise<Response>((resolve, reject) => {
          held.push(() => {
            const a = answer()
            if (a === undefined) reject(new TypeError(`no stub for ${url}`))
            else resolve(a)
          })
        })
      const a = answer()
      if (a !== undefined) return Promise.resolve(a)
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
  return { workspaces, gate }
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
const devices = [
  { name: 'the phone', size: phone },
  { name: 'the tablet', size: tablet },
  { name: 'the desktop', size: desktop },
]

/** The posted client errors. */
function watchPosts() {
  const posted: string[] = []
  const post = vi.fn<PostReport>((body) => {
    posted.push(body)
    return Promise.resolve(204)
  })
  cleanups.push(addSink(createClientErrorSender({ post })))
  return posted
}

/** The chat: the phone's or tablet's open chat, or the desktop workbench's pane; each is a region named by its title. */
const chat = () => page.getByRole('region', { name: title })
/** The dialog card: the approval group named by its label. */
const card = () => chat().getByRole('group', { name: 'Waiting in the terminal' })
const option = (label: string) => card().getByRole('button', { name: label, exact: true })

/**
 * Opens the app at / at `size`, taps Workspaces and the chat (on the desktop its pane shows already). `asApp` lays the
 * page out as the running app does, its root fixed to the window, so the transcript scrolls in its own box.
 */
async function openChat(size: readonly [number, number], asApp = false) {
  await setViewport(size[0], size[1])
  const before = new Set(document.body.children)
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
  if (asApp) {
    const container = [...document.body.children].find((child) => !before.has(child))
    if (container === undefined) throw new Error('no view container')
    container.id = 'root'
    onTestFinished(markApp())
    onTestFinished(() => {
      container.removeAttribute('id')
    })
  }
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  expect(router.state.location.searchStr).toBe('')
  if (size === desktop) {
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(chat().getByRole('textbox')).toBeVisible()
  } else {
    await userEvent.click(page.getByText(title, { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
  }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 200))

describe("a chat's terminal dialog (R69)", () => {
  for (const device of devices)
    it(`draws the dialog and sends the tapped option once, on ${device.name}`, async () => {
      const { workspaces } = withChats()
      const posted = watchPosts()
      workspaces.showDialog(plan, sample)
      await openChat(device.size)
      await expect.element(card()).toBeVisible()
      await expect.element(card().getByText('Sample step', { exact: true })).toBeVisible()
      // The body keeps its line breaks.
      const body = card()
        .getByText(/Goal: tidy the notes/)
        .element()
      expect(body.textContent).toBe(sample.body)
      expect(getComputedStyle(body).whiteSpace).toBe('pre-wrap')
      for (const o of sample.options) await expect.element(option(`${String(o.n)} ${o.label}`)).toBeEnabled()
      expect(workspaces.dialogAnswers).toEqual([])
      await userEvent.click(option('2 Send original'))
      await expect.poll(() => workspaces.dialogAnswers).toEqual([{ chat: plan, body: { id: sample.id, n: 2 } }])
      // The chat works again: the list read after the event drops the card.
      await expect.element(card()).not.toBeInTheDocument()
      await settle()
      expect(workspaces.dialogAnswers).toHaveLength(1)
      expect(getReports()).toEqual([])
      expect(posted).toEqual([])
    })

  it('turns every option off while the answer goes, and sends a second tap never', async () => {
    const { workspaces, gate } = withChats()
    workspaces.showDialog(plan, sample)
    await openChat(phone)
    await expect.element(option('1 Send structured')).toBeEnabled()
    gate.hold = true
    await userEvent.click(option('1 Send structured'))
    for (const o of sample.options) await expect.element(option(`${String(o.n)} ${o.label}`)).toBeDisabled()
    await expect.element(card().element().parentElement).toHaveAttribute('aria-busy', 'true')
    // A tap on an option that is off sends nothing.
    await userEvent.click(option('3 Type something'), { force: true })
    await settle()
    gate.hold = false
    gate.release()
    await expect.element(card()).not.toBeInTheDocument()
    expect(workspaces.dialogAnswers).toEqual([{ chat: plan, body: { id: sample.id, n: 1 } }])
  })

  it('says the terminal changed on a 409, then shows the new dialog from the next read', async () => {
    const { workspaces } = withChats()
    const posted = watchPosts()
    workspaces.showDialog(plan, sample)
    await openChat(tablet)
    await expect.element(option('1 Send structured')).toBeEnabled()
    // The terminal changes with no event: the card still shows the old dialog.
    workspaces.showDialog(plan, changedSample, true)
    await userEvent.click(option('1 Send structured'))
    await expect
      .element(card().getByText('The terminal changed — showing the new state', { exact: true }))
      .toBeVisible()
    await expect.element(option('2 Send original')).toBeDisabled()
    // The next read (every 3 s) brings the new dialog, with its options on and no line.
    await expect.element(card().getByText('Sample step, again', { exact: true }), { timeout: 6000 }).toBeVisible()
    await expect.element(card().getByText('The terminal changed — showing the new state')).not.toBeInTheDocument()
    await expect.element(option('2 Send original')).toBeEnabled()
    expect(workspaces.dialogAnswers).toEqual([{ chat: plan, body: { id: sample.id, n: 1 } }])
    expect(getReports()).toEqual([])
    expect(posted).toEqual([])
  })

  it('shows a line with Retry on a 503, and Retry sends the same answer again', async () => {
    const { workspaces } = withChats()
    workspaces.showDialog(plan, sample)
    await openChat(desktop)
    workspaces.answerDialogs(() => errorAnswer({ kind: 'herdr-unavailable', message: 'down', requestId: 'r-1' }, 503))
    await userEvent.click(option('4 Chat about this'))
    await expect.element(card().getByText('Not sent — herdr-unavailable', { exact: true })).toBeVisible()
    await expect.element(option('4 Chat about this')).toBeEnabled()
    // The report has the step, the kind and the status only, never a label or the dialog's text.
    const reports = JSON.stringify(getReports().map((r) => [r.error.name, r.error.message]))
    expect(reports).toContain('herdr-unavailable')
    expect(reports).not.toMatch(/Chat about this|Sample step|tidy the notes/)
    workspaces.answerDialogs(undefined)
    await userEvent.click(card().getByRole('button', { name: 'Retry', exact: true }))
    await expect.element(card()).not.toBeInTheDocument()
    expect(workspaces.dialogAnswers.map((a) => a.body)).toEqual([
      { id: sample.id, n: 4 },
      { id: sample.id, n: 4 },
    ])
  })

  for (const device of devices)
    it(`shows a dialog with no sure options read-only, with "Answer in the terminal", on ${device.name}`, async () => {
      const { workspaces } = withChats()
      workspaces.showDialog(plan, rawOnly)
      await openChat(device.size)
      await expect.element(card()).toBeVisible()
      await expect.element(card().getByText('Answer in the terminal', { exact: true })).toBeVisible()
      const text = card().getByRole('region', { name: 'Dialog text' })
      await expect.element(text).toBeVisible()
      expect(text.element().textContent).toBe(rawOnly.raw)
      const box = text.element()
      // Long text scrolls inside its box, in the mono style.
      expect(box.scrollHeight).toBeGreaterThan(box.clientHeight)
      expect(getComputedStyle(box.firstElementChild ?? box).whiteSpace).toBe('pre-wrap')
      expect(card().getByRole('button').elements()).toHaveLength(0)
      await settle()
      expect(workspaces.dialogAnswers).toEqual([])
    })

  it('reads no dialog and draws no card while the transcript asks its own question', async () => {
    const question = toolCall('t1', 'AskUserQuestion', { kind: 'other', title: 'Asked a question', running: true })
    const { workspaces } = withChats([user('u1', 'Tidy the notes'), question])
    workspaces.showDialog(plan, sample)
    await openChat(phone)
    // The question's row draws as before.
    await expect.element(chat().getByText('Asked a question')).toBeVisible()
    await settle()
    expect(card().elements()).toHaveLength(0)
    expect(workspaces.dialogReads).toEqual([])
  })

  it('draws no card for a blocked chat whose screen shows no dialog, and reads none for an idle chat', async () => {
    const { workspaces } = withChats()
    await openChat(phone)
    await expect.element(chat().getByText('Tidy the notes')).toBeVisible()
    await settle()
    // Idle: no read.
    expect(workspaces.dialogReads).toEqual([])
    workspaces.setStatus(plan, 'needsYou')
    await expect.poll(() => workspaces.dialogReads.length).toBeGreaterThan(0)
    await settle()
    expect(card().elements()).toHaveLength(0)
  })

  it('keeps the newest entry and the card in view on the phone', async () => {
    const many = Array.from({ length: 40 }, (_, i) => user(`u${String(i)}`, `Sample message ${String(i)}`))
    const { workspaces } = withChats(many)
    await openChat(phone, true)
    await expect.element(chat().getByText('Sample message 39')).toBeVisible()
    const scroller = chat().element().querySelector('.scroll-frame__body')
    if (!(scroller instanceof HTMLElement)) throw new Error('no transcript scroller')
    await expect.poll(() => scroller.scrollHeight > scroller.clientHeight * 2).toBe(true)
    const fromEnd = () => scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight
    await expect.poll(fromEnd).toBeLessThanOrEqual(2)
    workspaces.showDialog(plan, sample)
    await expect.element(option('4 Chat about this')).toBeInViewport()
    await expect.poll(fromEnd).toBeLessThanOrEqual(2)
  })
})
