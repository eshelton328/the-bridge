import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { cdp, page, userEvent } from 'vitest/browser'
// The Playwright provider's types give `cdp()` its `send`.
import type {} from '@vitest/browser-playwright'
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
// A tap chooses an option and Send answer posts `{ id, n }` once (R72: a tap
// alone sends nothing); while it goes the options and the button are off; a 409 says the terminal changed and the next read shows the new
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
/**
 * The same kind of step as the server sends it: its free-text options left out, so only 1 and 2, the second with its
 * description joined to its label, long enough to wrap on the phone.
 */
const twoOptions = {
  id: 'd1b2c3d4e5f60718',
  title: 'Sample step',
  body: 'Goal: tidy the notes',
  options: [
    { n: 1, label: 'Send structured' },
    {
      n: 2,
      label: 'Send original — the notes as typed, with every line and heading kept in the order they were written',
    },
  ],
  raw: 'Sample step\nGoal: tidy the notes\n1. Send structured\n2. Send original\n3. Type something',
}
/** The same step after the terminal changed: another read text, so another ID. */
const changedSample = { ...sample, id: 'b1b2c3d4e5f60718', title: 'Sample step, again' }
/** A dialog the server could not read for sure: its read text only, long enough to scroll. */
const rawOnly = {
  id: 'c1b2c3d4e5f60718',
  raw: Array.from({ length: 60 }, (_, i) => `line ${String(i + 1)} of a sample menu`).join('\n'),
}

type Server = {
  readonly workspaces: FakeWorkspacesServer
  readonly gate: { hold: boolean; release: () => void }
  /** An answer in place of every dialog read's, while set: such as one the contract refuses. */
  readonly reads: { answer: (() => Response) | undefined }
}

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
  const reads: Server['reads'] = { answer: undefined }
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      if (reads.answer !== undefined && init?.method !== 'POST' && path.endsWith('/dialog'))
        return Promise.resolve(reads.answer())
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
  return { workspaces, gate, reads }
}

let view: { unmount: () => Promise<void> } | undefined
const cleanups: (() => void)[] = []

stubLiveServer()

// A read that a page starts after its test ended gets no answer, not the real server (lib/lateServerReads.ts).
answerLateServerReads()

/** Turns Chromium's touch emulation on or off: on, `(pointer: coarse)` matches, as on a phone or a tablet. */
const touchScreen = (enabled: boolean) =>
  cdp().send('Emulation.setTouchEmulationEnabled', enabled ? { enabled, maxTouchPoints: 5 } : { enabled })

afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) cleanup()
  await view?.unmount()
  view = undefined
  await touchScreen(false)
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
/** The dialog card: the group named by its status line. */
const card = () => chat().getByRole('group', { name: 'Waiting for your answer' })
/** An option of the card: a radio named by its label. */
const option = (label: string) => card().getByRole('radio', { name: label, exact: true })
/** An option's text, which a tap chooses: its radio itself is hidden, as the row draws its own. */
const choice = (label: string) => card().getByText(label, { exact: true })
/** An option's row, the label that holds its radio. */
const row = (label: string) => {
  const radio = option(label).element()
  const box = radio.closest('label')
  if (box === null) throw new Error(`no row for ${label}`)
  return box
}
const sendButton = () => card().getByRole('button', { name: 'Send answer', exact: true })
/** Chooses the option labelled `label` and presses Send answer: the owner's answer. */
async function answer(label: string) {
  await userEvent.click(choice(label))
  await userEvent.click(sendButton())
}

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

// A stand-in for window.visualViewport that the test moves as iOS Safari does when its keyboard opens: the layout keeps
// its height, and only the visual viewport shrinks (as in WorkspacesKeyboardGap.test.tsx).
class FakeViewport extends EventTarget {
  height = document.documentElement.clientHeight
  width = document.documentElement.clientWidth
  offsetTop = 0
  offsetLeft = 0
  scale = 1
  move(change: { height: number }) {
    this.height = change.height
    this.dispatchEvent(new Event('resize'))
  }
}

/** Puts `value` in place of window.visualViewport until the test ends. */
function replaceVisualViewport(value: FakeViewport) {
  const own = Object.getOwnPropertyDescriptor(window, 'visualViewport')
  Object.defineProperty(window, 'visualViewport', { configurable: true, value })
  onTestFinished(() => {
    if (own) Object.defineProperty(window, 'visualViewport', own)
    else Reflect.deleteProperty(window, 'visualViewport')
  })
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 200))

describe("a chat's terminal dialog (R69)", () => {
  for (const device of devices)
    it(`draws the dialog and sends the chosen option once on Send answer, on ${device.name}`, async () => {
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
      for (const o of sample.options) await expect.element(option(o.label)).toBeEnabled()
      // The number is not shown: each row names its option by its label alone.
      expect(card().element().textContent).not.toMatch(/\d Send structured/)
      await expect.element(sendButton()).toBeDisabled()
      // A tap chooses the row and sends nothing; Send answer sends it.
      await userEvent.click(choice('Send original'))
      await expect.element(option('Send original')).toBeChecked()
      await settle()
      expect(workspaces.dialogAnswers).toEqual([])
      await userEvent.click(sendButton())
      await expect.poll(() => workspaces.dialogAnswers).toEqual([{ chat: plan, body: { id: sample.id, n: 2 } }])
      // The chat works again: the list read after the event drops the card.
      await expect.element(card()).not.toBeInTheDocument()
      await settle()
      expect(workspaces.dialogAnswers).toHaveLength(1)
      expect(getReports()).toEqual([])
      expect(posted).toEqual([])
    })

  it('draws only the options the server sends, by their own numbers, with a long label wrapped in the card', async () => {
    const { workspaces } = withChats()
    workspaces.showDialog(plan, twoOptions)
    await openChat(phone)
    await expect.element(card()).toBeVisible()
    const long = twoOptions.options[1]?.label ?? ''
    await expect.element(option('Send structured')).toBeEnabled()
    await expect.element(option(long)).toBeEnabled()
    expect(card().getByRole('radio').elements()).toHaveLength(2)
    // The answers that are not a tap are in the terminal: one muted line under the options.
    const other = card().getByText('Other answers: in the terminal', { exact: true })
    await expect.element(other).toBeVisible()
    const longRow = row(long)
    expect(other.element().getBoundingClientRect().top).toBeGreaterThanOrEqual(longRow.getBoundingClientRect().bottom)
    // The long label wraps: the row grows to more lines and stays inside the card, with nothing cut.
    const box = longRow.getBoundingClientRect()
    const cardBox = card().element().getBoundingClientRect()
    expect(box.height).toBeGreaterThan(row('Send structured').getBoundingClientRect().height)
    expect(box.right).toBeLessThanOrEqual(cardBox.right)
    expect(longRow.scrollWidth).toBeLessThanOrEqual(longRow.clientWidth)
    await answer(long)
    await expect.poll(() => workspaces.dialogAnswers).toEqual([{ chat: plan, body: { id: twoOptions.id, n: 2 } }])
  })

  it('turns the options on again when an answered dialog goes and the same one comes back', async () => {
    const { workspaces } = withChats()
    workspaces.showDialog(plan, sample)
    await openChat(phone)
    // The server takes the answer but the chat still needs the owner, with the dialog on the screen.
    workspaces.answerDialogs(() => new Response(null, { status: 204 }))
    await answer('Send original')
    await expect.element(option('Send structured')).toBeDisabled()
    await expect.element(card().getByRole('button', { name: 'Sent', exact: true })).toBeDisabled()
    // The dialog goes from the screen, and then the same step shows again: a new question.
    workspaces.showDialog(plan, null, true)
    await expect.element(card(), { timeout: 8000 }).not.toBeInTheDocument()
    workspaces.showDialog(plan, sample, true)
    await expect.element(option('Send structured'), { timeout: 8000 }).toBeEnabled()
    for (const o of sample.options) await expect.element(option(o.label)).toBeEnabled()
    expect(workspaces.dialogAnswers).toHaveLength(1)
  })

  it('turns every option and the button off while the answer goes, and sends a second tap never', async () => {
    const { workspaces, gate } = withChats()
    workspaces.showDialog(plan, sample)
    await openChat(phone)
    await expect.element(option('Send structured')).toBeEnabled()
    gate.hold = true
    await answer('Send structured')
    for (const o of sample.options) await expect.element(option(o.label)).toBeDisabled()
    await expect.element(card().getByRole('button', { name: 'Sending…', exact: true })).toBeDisabled()
    await expect.element(card()).toHaveAttribute('aria-busy', 'true')
    // A tap on an option that is off, and on the button, sends nothing.
    await userEvent.click(choice('Type something'), { force: true })
    await userEvent.click(card().getByRole('button', { name: 'Sending…', exact: true }), { force: true })
    await settle()
    gate.hold = false
    gate.release()
    await expect.element(card()).not.toBeInTheDocument()
    expect(workspaces.dialogAnswers).toEqual([{ chat: plan, body: { id: sample.id, n: 1 } }])
  })

  it('keeps the options of a dialog read while an answer goes off until that answer ends', async () => {
    const { workspaces, gate } = withChats()
    workspaces.showDialog(plan, sample)
    await openChat(phone)
    gate.hold = true
    await answer('Send structured')
    // The terminal changes while the answer is on its way: the next read brings the new dialog.
    workspaces.showDialog(plan, changedSample, true)
    await expect.element(card().getByText('Sample step, again', { exact: true }), { timeout: 8000 }).toBeVisible()
    for (const o of changedSample.options) await expect.element(option(o.label)).toBeDisabled()
    // The answer ends (the screen changed, a 409): the new dialog's options come on, none chosen.
    gate.hold = false
    gate.release()
    await expect.element(option('Send structured')).toBeEnabled()
    await expect.element(option('Send structured')).not.toBeChecked()
    await expect.element(sendButton()).toBeDisabled()
    expect(workspaces.dialogAnswers).toEqual([{ chat: plan, body: { id: sample.id, n: 1 } }])
  })

  it('says the terminal changed on a 409, then shows the new dialog from the next read', async () => {
    const { workspaces } = withChats()
    const posted = watchPosts()
    workspaces.showDialog(plan, sample)
    await openChat(tablet)
    await expect.element(option('Send structured')).toBeEnabled()
    // The terminal changes with no event: the card still shows the old dialog.
    workspaces.showDialog(plan, changedSample, true)
    await answer('Send structured')
    await expect
      .element(card().getByText('The terminal changed — showing the new state', { exact: true }))
      .toBeVisible()
    await expect.element(option('Send original')).toBeDisabled()
    await expect.element(sendButton()).toBeDisabled()
    // The next read (every 3 s) brings the new dialog, with its options on and no line.
    await expect.element(card().getByText('Sample step, again', { exact: true }), { timeout: 6000 }).toBeVisible()
    await expect.element(card().getByText('The terminal changed — showing the new state')).not.toBeInTheDocument()
    await expect.element(option('Send original')).toBeEnabled()
    expect(workspaces.dialogAnswers).toEqual([{ chat: plan, body: { id: sample.id, n: 1 } }])
    expect(getReports()).toEqual([])
    expect(posted).toEqual([])
  })

  it('shows a line with Retry on a 503, and Retry sends the same answer again', async () => {
    const { workspaces } = withChats()
    workspaces.showDialog(plan, sample)
    await openChat(desktop)
    workspaces.answerDialogs(() => errorAnswer({ kind: 'herdr-unavailable', message: 'down', requestId: 'r-1' }, 503))
    await answer('Chat about this')
    await expect.element(card().getByText('Not sent — herdr-unavailable', { exact: true })).toBeVisible()
    await expect.element(option('Chat about this')).toBeEnabled()
    await expect.element(option('Chat about this')).toBeChecked()
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
      expect(card().getByRole('radio').elements()).toHaveLength(0)
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
    await expect.element(sendButton()).toBeInViewport()
    await expect.poll(fromEnd).toBeLessThanOrEqual(2)
  })

  for (const device of [
    { name: 'the phone', size: phone },
    { name: 'the tablet', size: tablet },
  ])
    it(`draws each option as a full-width row 44 high or more, with a mouse and a touch screen, on ${device.name}`, async () => {
      const { workspaces } = withChats()
      workspaces.showDialog(plan, sample)
      await openChat(device.size)
      await expect.element(card().getByText('Send structured', { exact: true })).toBeVisible()
      const rows = () => sample.options.map((o) => row(o.label).getBoundingClientRect())
      const check = () => {
        const cardBox = card().element().getBoundingClientRect()
        for (const box of rows()) {
          expect(box.height).toBeGreaterThanOrEqual(44)
          // A row spans the card, less the card's padding.
          expect(box.width).toBeGreaterThan(cardBox.width - 40)
        }
      }
      check()
      await touchScreen(true)
      check()
    })

  it('shows no card for a read the contract refuses, and reports only its kind', async () => {
    const { workspaces, reads } = withChats()
    const posted = watchPosts()
    // An option with no label, and a raw text: the contract's PaneDialogResponse refuses it.
    reads.answer = () =>
      new Response(JSON.stringify({ dialog: { ...sample, options: [{ n: 1, label: '' }] } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    workspaces.showDialog(plan, sample)
    await openChat(phone)
    await expect.poll(() => getReports().length).toBe(1)
    await settle()
    expect(card().elements()).toHaveLength(0)
    const reports = JSON.stringify([getReports().map((r) => [r.error.name, r.error.message]), posted])
    expect(getReports().map((r) => r.error.message)).toEqual(['A chat dialog read missed: bad-reply (200)'])
    expect(reports).not.toMatch(/Sample step|tidy the notes|Send structured|mac-mini/)
  })

  it('shows the 409 state of a chat that cannot take the answer, with no Retry, and the next read decides', async () => {
    const { workspaces } = withChats()
    const posted = watchPosts()
    workspaces.showDialog(plan, sample)
    await openChat(phone)
    workspaces.answerDialogs(() =>
      errorAnswer({ kind: 'chat-not-ready', state: 'restarting', message: 'Not ready', requestId: 'r-409' }, 409),
    )
    await answer('Type something')
    await expect.element(card().getByText('Not sent — restarting', { exact: true })).toBeVisible()
    expect(card().getByText('The terminal changed — showing the new state').elements()).toHaveLength(0)
    expect(card().getByRole('button', { name: 'Retry', exact: true }).elements()).toHaveLength(0)
    await expect.element(option('Type something')).toBeEnabled()
    // The next read finds the dialog gone: no card.
    workspaces.answerDialogs(undefined)
    workspaces.showDialog(plan, null)
    await expect.element(card(), { timeout: 6000 }).not.toBeInTheDocument()
    expect(getReports()).toEqual([])
    expect(posted).toEqual([])
  })

  it('shows a 403 from another login as not sent, with no Retry, and reports only its kind and status', async () => {
    const { workspaces } = withChats()
    workspaces.showDialog(plan, sample)
    await openChat(tablet)
    workspaces.answerDialogs(() => errorAnswer({ kind: 'forbidden', message: 'Forbidden', requestId: 'r-403' }, 403))
    await answer('Send original')
    await expect.element(card().getByText('Not sent — forbidden', { exact: true })).toBeVisible()
    expect(card().getByRole('button', { name: 'Retry', exact: true }).elements()).toHaveLength(0)
    expect(getReports().map((r) => r.error.message)).toEqual(['A chat dialog answer missed: forbidden (403)'])
    expect(workspaces.dialogAnswers).toHaveLength(1)
  })

  it('keeps the card at the end over the phone keyboard', async () => {
    const many = Array.from({ length: 40 }, (_, i) => user(`u${String(i)}`, `Sample message ${String(i)}`))
    const { workspaces } = withChats(many)
    const viewport = new FakeViewport()
    replaceVisualViewport(viewport)
    workspaces.showDialog(plan, sample)
    await openChat(phone, true)
    await expect.element(sendButton()).toBeInViewport()
    const scroller = chat().element().querySelector('.scroll-frame__body')
    const composer = chat().element().querySelector('.scroll-frame__footer .composer__root')
    if (!(scroller instanceof HTMLElement) || !(composer instanceof HTMLElement)) throw new Error('no scroller')
    // A tap on the message box, and the iPhone's keyboard opens over the screen's foot (M10: its top at 464).
    await userEvent.click(chat().getByRole('textbox'))
    viewport.move({ height: 464 })
    await expect.poll(() => Math.round(composer.getBoundingClientRect().bottom)).toBeLessThanOrEqual(464)
    const fromEnd = () => scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight
    await expect.poll(fromEnd).toBeLessThanOrEqual(2)
    // The card's Send answer sits above the docked composer, in view.
    const last = sendButton().element()
    await expect.poll(() => last.getBoundingClientRect().bottom <= composer.getBoundingClientRect().top).toBe(true)
    expect(last.getBoundingClientRect().top).toBeGreaterThanOrEqual(scroller.getBoundingClientRect().top)
  })
})
