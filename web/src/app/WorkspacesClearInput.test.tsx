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
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { stubLiveServer } from './liveServerStub.ts'

// R28 part B: a send that found text in the chat's terminal input (409
// inputNotEmpty) offers "Clear the terminal input". It asks first in a
// dialog; Clear posts `POST /api/chats/:chat/input/clear` to the chat the
// line was made for and, on a 204, sends the kept draft again. A send that
// Claude Code did not take (409 notSubmitted) says so, with Retry. Each test
// takes the owner's path: the app at /, Workspaces, a live Claude chat, the
// typed message and Send, with a stubbed server whose chat routes are the
// contract-checked fake (lib/fakeTranscriptServer.ts). No report, posted
// client error or console line holds the draft.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'
const drift = 'mac-mini/c3'

const summary = (id: string, kind: 'claude' | 'codex', title: string) => ({
  id,
  kind,
  title,
  model: kind === 'codex' ? 'gpt-5.5' : 'claude-opus-5-5',
  contextUsed: null,
  status: 'idle',
  parent: null,
})
const chats = [
  summary(plan, 'claude', 'plan the slice'),
  summary(review, 'claude', 'review notes'),
  summary(drift, 'codex', 'drift check'),
]
const pane = (chat: string) => ({ kind: 'pane', chat })
const split = (first: unknown, second: unknown) => ({ kind: 'split', direction: 'row', ratio: 0.5, first, second })
const layout = JSON.stringify({
  workspace,
  tabs: [
    {
      id: 'mac-mini/w-live:t1',
      label: 'main',
      active: true,
      root: split(split(pane(plan), pane(review)), pane(drift)),
      focusedChat: plan,
      chats,
    },
  ],
})

const user = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })

/** The message every test types: it must never reach a report, a posted client error or the console. */
const secret = 'deploy the private branch now'

/** The stubbed server: the workspaces, their layout, the event stream and the fake's chat routes. */
function withChats() {
  const fake = fakeTranscriptServer()
  fake.set(plan, [user('u1', 'Fix the build')])
  fake.set(review, [user('u2', 'Review the notes')])
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const answer = fake.handle(path, init)
      if (answer !== undefined) return Promise.resolve(answer)
      if (path === '/api/workspaces')
        return Promise.resolve(
          new Response(
            JSON.stringify({ machine: 'mac-mini', workspaces: [{ id: workspace, label: 'live work', chats }] }),
            { status: 200 },
          ),
        )
      if (path === `/api/workspaces/${encodeURIComponent(workspace)}/layout`)
        return Promise.resolve(new Response(layout, { status: 200 }))
      if (path === '/api/events') {
        const body = new ReadableStream<Uint8Array>({
          start: (control) => {
            control.enqueue(new TextEncoder().encode('event: open\nretry: 200\ndata: {}\n\n'))
          },
        })
        return Promise.resolve(new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } }))
      }
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
  // The terminal input of "plan the slice" holds text: its first send answers 409 inputNotEmpty.
  fake.typeInTerminal(plan)
  return fake
}

/** An answer the test ends: `end` gives the page `answer`. */
function held() {
  let end: (answer: Response) => void = () => undefined
  return {
    answer: () =>
      new Promise<Response>((resolve) => {
        end = resolve
      }),
    end: (res: Response) => {
      end(res)
    },
  }
}

let view: { unmount: () => Promise<void> } | undefined
const cleanups: (() => void)[] = []

stubLiveServer()

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
const desktop = [1512, 982] as const

const clearLine = "Not sent — clear the text in the chat's terminal input, then send"

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
    /** Fails when any of them holds the draft. */
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

/** The chat `title`: the phone's open chat, or the desktop workbench's pane; both are regions named by the title. */
const chatOf = (title: string) => page.getByRole('region', { name: title })
const box = (title: string) => chatOf(title).getByRole('textbox')
const sendButton = (title: string) => chatOf(title).getByRole('button', { name: 'Send', exact: true })
const clearAction = (title: string) => chatOf(title).getByRole('button', { name: 'Clear the terminal input' })
const dialog = () => page.getByRole('alertdialog')

/** Opens the app at / at `size`, taps Workspaces and the chat `title` (on the desktop its pane shows already). */
async function openChat(size: readonly [number, number], title: string) {
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
  if (size === desktop) {
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(chatOf(title).getByRole('textbox')).toBeVisible()
  } else {
    await userEvent.click(page.getByText(title, { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
  }
}

/** Opens "plan the slice", types the draft and taps Send, which answers 409 inputNotEmpty. */
async function sendIntoTypedInput(fake: FakeTranscriptServer, size: readonly [number, number]) {
  await openChat(size, 'plan the slice')
  await userEvent.fill(box('plan the slice'), secret)
  await userEvent.click(sendButton('plan the slice'))
  await expect.element(chatOf('plan the slice').getByText(clearLine, { exact: true })).toBeVisible()
  expect(fake.posts).toEqual([{ chat: plan, route: 'prompt' }])
}

/** Taps "Clear the terminal input" and waits for the dialog. */
async function askToClear() {
  await userEvent.click(clearAction('plan the slice'))
  await expect.element(dialog()).toBeVisible()
  await expect
    .element(dialog().getByText("The text in the chat's terminal input will be lost.", { exact: false }))
    .toBeVisible()
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 200))

for (const device of [
  { name: 'the phone', size: phone },
  { name: 'the desktop', size: desktop },
])
  describe(`"Clear the terminal input" on ${device.name} (R28 part B)`, () => {
    it('does nothing on Cancel: no clear, and the draft and the line stay', async () => {
      const fake = withChats()
      await sendIntoTypedInput(fake, device.size)
      await askToClear()
      await userEvent.click(dialog().getByRole('button', { name: 'Cancel' }))
      await expect.element(dialog()).not.toBeInTheDocument()
      await settle()
      expect(fake.posts).toEqual([{ chat: plan, route: 'prompt' }])
      expect(fake.clears).toEqual([])
      await expect.element(box('plan the slice')).toHaveValue(secret)
      await expect.element(chatOf('plan the slice').getByText(clearLine, { exact: true })).toBeVisible()
      expect(getReports()).toEqual([])
    })

    it('clears the input of the same chat on Clear, then sends the kept draft and empties the box', async () => {
      const fake = withChats()
      const reports = watchReports()
      await sendIntoTypedInput(fake, device.size)
      await askToClear()
      await userEvent.click(dialog().getByRole('button', { name: 'Clear', exact: true }))
      await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: secret }])
      expect(fake.clears).toEqual([plan])
      expect(fake.posts).toEqual([
        { chat: plan, route: 'prompt' },
        { chat: plan, route: 'clear' },
        { chat: plan, route: 'prompt' },
      ])
      // The chat ID is in the path URL-encoded once.
      expect(fake.paths[1]).toBe('/api/chats/mac-mini%2Fc1/input/clear')
      await expect.element(box('plan the slice')).toHaveValue('')
      await expect.element(dialog()).not.toBeInTheDocument()
      await expect.element(page.getByText(/^Not (sent|cleared)/)).not.toBeInTheDocument()
      expect(getReports()).toEqual([])
      expect(reports.posted).toEqual([])
      reports.expectNoText()
    })
  })

describe('a clear of the terminal input that misses, on the phone (R28 part B)', () => {
  const misses = [
    {
      name: '409 needsYou',
      answer: () => errorAnswer({ kind: 'chat-not-ready', state: 'needsYou', message: 'waits', requestId: 'r-1' }, 409),
      line: 'Not cleared — chat waits for an answer in the terminal',
      retry: false,
      reported: [],
    },
    {
      name: '409 inputNotEmpty',
      answer: () =>
        errorAnswer({ kind: 'chat-not-ready', state: 'inputNotEmpty', message: 'still', requestId: 'r-2' }, 409),
      line: 'Not cleared — the text is still there',
      retry: false,
      reported: [],
    },
    {
      name: '404 not-found',
      answer: () =>
        errorAnswer({ kind: 'not-found', path: '/api/chats/x/input/clear', message: 'gone', requestId: 'r-3' }, 404),
      line: 'Not cleared — chat gone',
      retry: false,
      reported: [],
    },
    {
      name: '503 herdr-unavailable',
      answer: () => errorAnswer({ kind: 'herdr-unavailable', message: 'down', requestId: 'r-4' }, 503),
      line: 'Not cleared — herdr-unavailable',
      retry: true,
      reported: ['A chat clear missed: herdr-unavailable 503'],
    },
    {
      name: 'no answer (network)',
      answer: () => Promise.reject(new TypeError('Failed to fetch')),
      line: 'Not cleared — unreachable',
      retry: true,
      reported: [],
    },
  ]
  for (const miss of misses)
    it(`keeps the draft and shows "${miss.line}" on a ${miss.name}`, async () => {
      const fake = withChats()
      const reports = watchReports()
      fake.answerClears(miss.answer)
      await sendIntoTypedInput(fake, phone)
      await askToClear()
      await userEvent.click(dialog().getByRole('button', { name: 'Clear', exact: true }))
      const chat = chatOf('plan the slice')
      await expect.element(chat.getByText(miss.line, { exact: true })).toBeVisible()
      await expect.element(box('plan the slice')).toHaveValue(secret)
      expect(fake.prompts).toEqual([])
      expect(fake.posts).toEqual([
        { chat: plan, route: 'prompt' },
        { chat: plan, route: 'clear' },
      ])
      expect(page.getByText(/^Not (sent|cleared)/).elements()).toHaveLength(1)
      expect(getReports().map((r) => r.error.message)).toEqual(miss.reported)
      await expect.poll(() => reports.posted.length).toBe(miss.reported.length)
      if (miss.retry) {
        // Retry clears again, with no second question, and the clear that goes through sends the draft.
        fake.answerClears(undefined)
        await userEvent.click(chat.getByRole('button', { name: 'Retry' }))
        await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: secret }])
        expect(fake.clears).toEqual([plan])
        await expect.element(box('plan the slice')).toHaveValue('')
        await expect.element(chat.getByText(miss.line)).not.toBeInTheDocument()
      } else await expect.element(chat.getByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
      reports.expectNoText()
    })

  it('keeps the draft in the chat when the owner leaves and reopens it after a failed clear, and sends it after the next clear', async () => {
    const fake = withChats()
    fake.answerClears(() => errorAnswer({ kind: 'herdr-unavailable', message: 'down', requestId: 'r-5' }, 503))
    await sendIntoTypedInput(fake, phone)
    await askToClear()
    await userEvent.click(dialog().getByRole('button', { name: 'Clear', exact: true }))
    await expect.element(chatOf('plan the slice').getByText('Not cleared — herdr-unavailable')).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
    await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
    await expect.element(box('plan the slice')).toHaveValue(secret)
    // The reopened chat sends its kept draft; the terminal input still holds text, so the line offers the clear again.
    await userEvent.click(sendButton('plan the slice'))
    await expect.element(chatOf('plan the slice').getByText(clearLine, { exact: true })).toBeVisible()
    fake.answerClears(undefined)
    await askToClear()
    await userEvent.click(dialog().getByRole('button', { name: 'Clear', exact: true }))
    await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: secret }])
    await expect.element(box('plan the slice')).toHaveValue('')
  })

  it('posts one clear for a double tap on Clear, and sends once when it answers', async () => {
    const fake = withChats()
    const answer = held()
    fake.answerClears(answer.answer)
    await sendIntoTypedInput(fake, phone)
    await askToClear()
    await userEvent.dblClick(dialog().getByRole('button', { name: 'Clear', exact: true }))
    await expect.poll(() => fake.posts.length).toBe(2)
    await settle()
    expect(fake.posts).toEqual([
      { chat: plan, route: 'prompt' },
      { chat: plan, route: 'clear' },
    ])
    // The test's answer stands in for the server's clear, so the test empties the input itself.
    fake.clearTerminal(plan)
    answer.end(new Response(null, { status: 204 }))
    await expect.element(box('plan the slice')).toHaveValue('')
    await settle()
    expect(fake.posts).toEqual([
      { chat: plan, route: 'prompt' },
      { chat: plan, route: 'clear' },
      { chat: plan, route: 'prompt' },
    ])
  })
})

describe('a chat switch around "Clear the terminal input", on the phone (R28 part B)', () => {
  it('keeps the page out of reach while the dialog shows, and clears nothing when the owner then opens another chat', async () => {
    const fake = withChats()
    await sendIntoTypedInput(fake, phone)
    await askToClear()
    // The dialog is modal: while it shows, the chat's back and the rest of the page are out of reach, so no switch
    // starts from the page. Escape (or Cancel) closes it; the back then opens the list.
    expect(page.getByRole('button', { name: 'Workspaces' }).elements()).toHaveLength(0)
    await userEvent.keyboard('{Escape}')
    await expect.element(dialog()).not.toBeInTheDocument()
    await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
    await userEvent.click(page.getByText('review notes', { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: 'review notes' })).toBeVisible()
    await settle()
    expect(dialog().elements()).toHaveLength(0)
    expect(fake.clears).toEqual([])
    expect(fake.posts).toEqual([{ chat: plan, route: 'prompt' }])
    await expect.element(box('review notes')).toHaveValue('')
  })

  it('clears and sends only the chat the line was made for when the owner switches while the clear is pending', async () => {
    const fake = withChats()
    const answer = held()
    fake.answerClears(answer.answer)
    await sendIntoTypedInput(fake, phone)
    await askToClear()
    await userEvent.click(dialog().getByRole('button', { name: 'Clear', exact: true }))
    await expect.poll(() => fake.posts.length).toBe(2)
    await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
    await userEvent.click(page.getByText('review notes', { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: 'review notes' })).toBeVisible()
    await userEvent.fill(box('review notes'), 'a note for review')
    // The test's answer stands in for the server's clear, so the test empties the input itself.
    fake.clearTerminal(plan)
    answer.end(new Response(null, { status: 204 }))
    await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: secret }])
    await settle()
    expect(fake.posts).toEqual([
      { chat: plan, route: 'prompt' },
      { chat: plan, route: 'clear' },
      { chat: plan, route: 'prompt' },
    ])
    await expect.element(box('review notes')).toHaveValue('a note for review')
    await expect.element(page.getByText(/^Not (sent|cleared)/)).not.toBeInTheDocument()
    // The sent chat's draft went with its send.
    await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
    await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
    await expect.element(box('plan the slice')).toHaveValue('')
  })
})

describe('a send that the chat did not take (409 notSubmitted, R28 part B)', () => {
  for (const device of [
    { name: 'the phone', size: phone },
    { name: 'the desktop', size: desktop },
  ])
    it(`keeps the draft and says so with Retry and no report, on ${device.name}`, async () => {
      const fake = withChats()
      const reports = watchReports()
      fake.clearTerminal(plan)
      fake.dropSubmits(plan, true)
      await openChat(device.size, 'plan the slice')
      await userEvent.fill(box('plan the slice'), secret)
      await userEvent.click(sendButton('plan the slice'))
      const chat = chatOf('plan the slice')
      const line = 'Not sent — the chat did not take the message'
      await expect.element(chat.getByText(line, { exact: true })).toBeVisible()
      await expect.element(box('plan the slice')).toHaveValue(secret)
      expect(clearAction('plan the slice').elements()).toHaveLength(0)
      await settle()
      expect(getReports()).toEqual([])
      expect(reports.posted).toEqual([])
      fake.dropSubmits(plan, false)
      await userEvent.click(chat.getByRole('button', { name: 'Retry' }))
      await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: secret }])
      await expect.element(box('plan the slice')).toHaveValue('')
      await expect.element(chat.getByText(line)).not.toBeInTheDocument()
      reports.expectNoText()
    })
})
