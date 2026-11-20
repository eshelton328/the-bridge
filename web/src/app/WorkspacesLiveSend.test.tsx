import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { maxPromptChars, type TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
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
import { markApp } from './appMarker.ts'
import { stubLiveServer } from './liveServerStub.ts'

// W1: a live Claude chat's Send and Stop. Each test takes the owner's path:
// it opens the app with no URL parameters, taps Workspaces and a live chat,
// types and taps Send (or presses Enter), with a stubbed server (`fetch`)
// whose chat routes are the contract-checked fake
// (lib/fakeTranscriptServer.ts). A 204 empties the box; a miss keeps the
// text and shows one quiet line under the composer; one send and one stop
// are in flight at a time; Stop shows only while the chat works; a Codex
// chat still cannot send. No report, posted client error or console line
// holds the message text.
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
  status,
  parent: null,
})
// plan works; review is idle; drift is a Codex chat that works.
const chats = [
  summary(plan, 'claude', 'plan the slice', 'working'),
  summary(review, 'claude', 'review notes', 'idle'),
  summary(drift, 'codex', 'drift check', 'working'),
  summary(logs, 'shell', 'tail logs', 'working'),
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
      root: split(split(pane(plan), pane(review)), split(pane(drift), pane(logs))),
      focusedChat: plan,
      chats,
    },
  ],
})

const user = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })

/** The message every test types: it must never reach a report, a posted client error or the console. */
const secret = 'deploy the private branch now'

/** The stubbed server: the workspaces, their layout, the event stream and the fake's chat routes. */
function fakeServer(fake: FakeTranscriptServer) {
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
}

/** The fake with the chats' transcripts. */
function withChats() {
  const fake = fakeTranscriptServer()
  fake.set(plan, [user('u1', 'Fix the build')])
  fake.set(review, [user('u2', 'Review the notes')])
  fakeServer(fake)
  return fake
}

/** An answer the test ends: `end` gives the page `answer`. */
function held() {
  let end: (answer: Response) => void = () => undefined
  const answer = () =>
    new Promise<Response>((resolve) => {
      end = resolve
    })
  return {
    answer,
    end: (res: Response) => {
      end(res)
    },
  }
}

const noContent = () => new Response(null, { status: 204 })

let view: { unmount: () => Promise<void> } | undefined
let router: ReturnType<typeof createRouter> | undefined
const cleanups: (() => void)[] = []

stubLiveServer()

afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) cleanup()
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

/**
 * Opens the app at `size` and taps Workspaces in the rail or the tab bar; the URL has no parameters. `asApp` lays the
 * page out as the running app does: its root fixed to the window (`#root` under `html[data-app]`, main.ts).
 */
async function tapWorkspaces(size: readonly [number, number], asApp = false) {
  await setViewport(size[0], size[1])
  const before = new Set(document.body.children)
  router = createRouter({
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
  await expect.poll(() => router?.state.location.pathname).toBe('/workspaces')
  expect(router.state.location.searchStr).toBe('')
}

/** Taps the live chat `title` in the list, on the phone or the tablet. */
async function tapChat(title: string) {
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
}

/** The region of the phone's or tablet's open chat, named by its title. */
const chatRegion = (title: string) => page.getByRole('region', { name: title })
/** The workbench pane of `title`: the pane around its Maximise button. */
const workbenchPane = (title: string) =>
  page
    .getByRole('button', { name: `Maximise ${title}`, exact: true })
    .element()
    .closest('[data-figma]')
const box = (title: string) => chatRegion(title).getByRole('textbox')
const sendButton = (title: string) => chatRegion(title).getByRole('button', { name: 'Send', exact: true })
const stopButton = (title: string) => chatRegion(title).getByRole('button', { name: 'Stop' })

/** Taps Workspaces and `title`, and types the message in its box. */
async function openAndType(size: readonly [number, number], title: string, text = secret, asApp = false) {
  await tapWorkspaces(size, asApp)
  await tapChat(title)
  await userEvent.fill(box(title), text)
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
    /** Fails when any of them holds the message text. */
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

const phone = [390, 844] as const
const tablet = [756, 1129] as const

describe("a live Claude chat's Send (W1)", () => {
  for (const device of [
    { name: 'the phone', size: phone },
    { name: 'the tablet', size: tablet },
  ])
    it(`sends the typed text to the open chat and empties the box on a 204, on ${device.name}`, async () => {
      const fake = withChats()
      await openAndType(device.size, 'plan the slice')
      await expect.element(sendButton('plan the slice')).toBeEnabled()
      await userEvent.click(sendButton('plan the slice'))
      await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: secret }])
      // The chat ID is in the path URL-encoded once: its "/" is %2F, not %252F.
      expect(fake.paths).toEqual(['/api/chats/mac-mini%2Fc1/prompt'])
      await expect.element(box('plan the slice')).toHaveValue('')
      // The prompt shows when the transcript stream brings it, as the server writes it to the session.
      fake.push(plan, [user('u3', secret)])
      await expect.element(chatRegion('plan the slice').getByText(secret)).toBeVisible()
      await expect.element(page.getByText(/^Not sent/)).not.toBeInTheDocument()
      expect(getReports()).toEqual([])
    })

  it('sends with Enter as with Send', async () => {
    const fake = withChats()
    await openAndType(phone, 'review notes')
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => fake.prompts).toEqual([{ chat: review, text: secret }])
    await expect.element(box('review notes')).toHaveValue('')
  })

  it('posts once for a double tap and an Enter while the send is pending, and Send is off meanwhile', async () => {
    const fake = withChats()
    const answer = held()
    fake.answerPrompts(answer.answer)
    await openAndType(phone, 'plan the slice')
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.posts.length).toBe(1)
    await expect.element(sendButton('plan the slice')).toBeDisabled()
    await userEvent.dblClick(sendButton('plan the slice'), { force: true })
    box('plan the slice').element().focus()
    await userEvent.keyboard('{Enter}')
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(fake.posts).toEqual([{ chat: plan, route: 'prompt' }])
    answer.end(noContent())
    await expect.element(box('plan the slice')).toHaveValue('')
    await expect.element(sendButton('plan the slice')).toBeEnabled()
  })

  it("leaves the other chat's composer alone when the owner switches chats while a send is pending", async () => {
    const fake = withChats()
    const answer = held()
    fake.answerPrompts(answer.answer)
    await openAndType(phone, 'plan the slice')
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.posts.length).toBe(1)
    // Back to the list and into the other chat, which gets its own text.
    await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
    await tapChat('review notes')
    await userEvent.fill(box('review notes'), 'a note for review')
    answer.end(noContent())
    await new Promise((resolve) => setTimeout(resolve, 200))
    await expect.element(box('review notes')).toHaveValue('a note for review')
    await expect.element(page.getByText(/^Not sent/)).not.toBeInTheDocument()
    expect(fake.posts).toEqual([{ chat: plan, route: 'prompt' }])
    // The sent chat's draft went with its send.
    await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
    await tapChat('plan the slice')
    await expect.element(box('plan the slice')).toHaveValue('')
    await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
    await tapChat('review notes')
    await expect.element(box('review notes')).toHaveValue('a note for review')
  })

  it("keeps the other chat's composer when the send fails after a switch", async () => {
    const fake = withChats()
    const answer = held()
    fake.answerPrompts(answer.answer)
    await openAndType(phone, 'plan the slice')
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.posts.length).toBe(1)
    await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
    await tapChat('review notes')
    await userEvent.fill(box('review notes'), 'a note for review')
    answer.end(errorAnswer({ kind: 'herdr-unavailable', message: 'down', requestId: 'r-1' }, 503))
    await new Promise((resolve) => setTimeout(resolve, 200))
    await expect.element(box('review notes')).toHaveValue('a note for review')
    await expect.element(page.getByText(/^Not sent/)).not.toBeInTheDocument()
    // The failed chat keeps its text.
    await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
    await tapChat('plan the slice')
    await expect.element(box('plan the slice')).toHaveValue(secret)
  })

  const misses = [
    {
      name: '409 needsYou',
      answer: () => errorAnswer({ kind: 'chat-not-ready', state: 'needsYou', message: 'waits', requestId: 'r-1' }, 409),
      line: 'Not sent — chat waits for an answer in the terminal',
      retry: false,
      reported: [],
    },
    {
      name: '503 herdr-unavailable',
      answer: () => errorAnswer({ kind: 'herdr-unavailable', message: 'down', requestId: 'r-2' }, 503),
      line: 'Not sent — herdr-unavailable',
      retry: true,
      reported: ['A chat send missed: herdr-unavailable 503'],
    },
    {
      name: '502 herdr-bad-reply',
      answer: () => errorAnswer({ kind: 'herdr-bad-reply', message: 'odd', requestId: 'r-3' }, 502),
      line: 'Not sent — herdr-bad-reply',
      retry: true,
      reported: ['A chat send missed: herdr-bad-reply 502'],
    },
    {
      name: 'no answer (network)',
      answer: () => Promise.reject(new TypeError('Failed to fetch')),
      line: 'Not sent — unreachable',
      retry: true,
      reported: [],
    },
    {
      name: '404 not-found',
      answer: () =>
        errorAnswer({ kind: 'not-found', path: '/api/chats/x/prompt', message: 'gone', requestId: 'r-4' }, 404),
      line: 'Not sent — chat gone',
      retry: false,
      reported: [],
    },
  ]
  for (const miss of misses)
    it(`keeps the text and shows its line on a ${miss.name}`, async () => {
      const fake = withChats()
      const reports = watchReports()
      fake.answerPrompts(miss.answer)
      await openAndType(tablet, 'plan the slice')
      await userEvent.click(sendButton('plan the slice'))
      const chat = chatRegion('plan the slice')
      await expect.element(chat.getByText(miss.line)).toBeVisible()
      await expect.element(box('plan the slice')).toHaveValue(secret)
      await expect.element(sendButton('plan the slice')).toBeEnabled()
      expect(page.getByText(/^Not sent/).elements()).toHaveLength(1)
      expect(getReports().map((r) => r.error.message)).toEqual(miss.reported)
      if (miss.retry) {
        // Retry sends the kept text again; once it goes through, the box empties and the line goes.
        fake.answerPrompts(undefined)
        await userEvent.click(chat.getByRole('button', { name: 'Retry' }))
        await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: secret }])
        await expect.element(box('plan the slice')).toHaveValue('')
        await expect.element(chat.getByText(miss.line)).not.toBeInTheDocument()
      } else await expect.element(chat.getByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
      await expect.poll(() => reports.posted.length).toBe(miss.reported.length)
      reports.expectNoText()
    })

  it('sends no text that is empty, only spaces or over the limit, and says by how much it is over', async () => {
    const fake = withChats()
    await openAndType(phone, 'plan the slice', '   ')
    await userEvent.click(sendButton('plan the slice'))
    await userEvent.fill(box('plan the slice'), 'x'.repeat(maxPromptChars + 1))
    const chat = chatRegion('plan the slice')
    await expect.element(chat.getByText('Message too long — 1 character over')).toBeVisible()
    await userEvent.click(sendButton('plan the slice'))
    await userEvent.fill(box('plan the slice'), 'x'.repeat(maxPromptChars + 5))
    await expect.element(chat.getByText('Message too long — 5 characters over')).toBeVisible()
    await userEvent.keyboard('{Enter}')
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(fake.posts).toEqual([])
    // At the limit the line goes and the text sends.
    await userEvent.fill(box('plan the slice'), 'x'.repeat(maxPromptChars))
    await expect.element(chat.getByText(/^Message too long/)).not.toBeInTheDocument()
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.prompts.length).toBe(1)
  })

  it('keeps "Sending not live yet" on a Codex chat, which sends nothing, on the phone', async () => {
    const fake = withChats()
    await tapWorkspaces(phone)
    await tapChat('drift check')
    const chat = chatRegion('drift check')
    await expect.element(chat.getByRole('textbox', { name: 'Sending not live yet' })).toBeDisabled()
    await expect.element(chat.getByRole('button', { name: 'Send', exact: true })).toBeDisabled()
    // A working Codex chat shows no live Stop either (W8).
    expect(
      chat
        .getByRole('button', { name: 'Stop' })
        .elements()
        .every((b) => b.hasAttribute('disabled')),
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(fake.posts).toEqual([])
  })
})

/** `a` and `b` share some area. */
const overlaps = (a: DOMRect, b: DOMRect) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

/** The dev ErrorTray's box. */
const trayBox = () => {
  const tray = document.querySelector('aside[aria-label="Error reports"]')
  if (tray === null) throw new Error('no ErrorTray')
  return tray.getBoundingClientRect()
}

/** `button` gets a real tap: the element at its centre is the button or inside it. */
const tappable = (button: Element) => {
  const box = button.getBoundingClientRect()
  const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
  return hit !== null && button.contains(hit)
}

describe('the dev ErrorTray beside a send error line (W1)', () => {
  for (const device of [
    { name: 'the phone', size: phone },
    { name: 'the tablet', size: tablet },
  ])
    it(`covers neither the composer nor the error line, and Retry takes a tap, on ${device.name}`, async () => {
      const fake = withChats()
      fake.answerPrompts(() => errorAnswer({ kind: 'herdr-unavailable', message: 'down', requestId: 'r-2' }, 503))
      await openAndType(device.size, 'plan the slice', secret, true)
      await userEvent.click(sendButton('plan the slice'))
      const chat = chatRegion('plan the slice')
      const line = chat.getByRole('alert').filter({ hasText: 'Not sent — herdr-unavailable' })
      await expect.element(line).toBeVisible()
      await expect.element(page.getByRole('button', { name: '1 error' })).toBeVisible()
      const composer = () => {
        const area = box('plan the slice').element().closest('[data-keyboard-keep]')
        if (area === null) throw new Error('no composer')
        return area.getBoundingClientRect()
      }
      const retry = () => chat.getByRole('button', { name: 'Retry' }).element()
      await expect.poll(() => overlaps(trayBox(), composer())).toBe(false)
      await expect.poll(() => overlaps(trayBox(), line.element().getBoundingClientRect())).toBe(false)
      expect(tappable(retry())).toBe(true)
      expect(tappable(sendButton('plan the slice').element())).toBe(true)
      // The tap goes through: Retry sends again.
      fake.answerPrompts(undefined)
      await userEvent.click(chat.getByRole('button', { name: 'Retry' }))
      await expect.poll(() => fake.prompts.length).toBe(1)
    })
})

describe("a live Claude chat's Stop (W1)", () => {
  it('shows Stop only while the chat works, and one tap posts one stop', async () => {
    const fake = withChats()
    const answer = held()
    fake.answerStops(answer.answer)
    await tapWorkspaces(phone)
    await tapChat('review notes')
    await expect.element(chatRegion('review notes').getByRole('textbox')).toBeVisible()
    expect(stopButton('review notes').elements()).toHaveLength(0)
    await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
    await tapChat('plan the slice')
    await userEvent.click(stopButton('plan the slice'))
    await userEvent.click(stopButton('plan the slice'))
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(fake.posts).toEqual([{ chat: plan, route: 'stop' }])
    answer.end(noContent())
    await new Promise((resolve) => setTimeout(resolve, 100))
    // Once the answer came, a tap posts again.
    fake.answerStops(undefined)
    await userEvent.click(stopButton('plan the slice'))
    await expect.poll(() => fake.stops).toEqual([plan])
    expect(fake.paths.at(-1)).toBe('/api/chats/mac-mini%2Fc1/stop')
    expect(getReports()).toEqual([])
  })

  it('is quiet on a 409 notWorking: no line and no report', async () => {
    const fake = withChats()
    fake.answerStops(() =>
      errorAnswer({ kind: 'chat-not-ready', state: 'notWorking', message: 'idle', requestId: 'r-1' }, 409),
    )
    await tapWorkspaces(tablet)
    await tapChat('plan the slice')
    await userEvent.click(stopButton('plan the slice'))
    await expect.poll(() => fake.posts.length).toBe(1)
    await new Promise((resolve) => setTimeout(resolve, 200))
    await expect.element(page.getByText(/^Not stopped/)).not.toBeInTheDocument()
    expect(getReports()).toEqual([])
  })

  it('shows a short line with Retry when the stop fails, and keeps the typed text', async () => {
    const fake = withChats()
    const reports = watchReports()
    fake.answerStops(() => errorAnswer({ kind: 'herdr-unavailable', message: 'down', requestId: 'r-2' }, 503))
    await openAndType(phone, 'plan the slice')
    await userEvent.click(stopButton('plan the slice'))
    const chat = chatRegion('plan the slice')
    await expect.element(chat.getByText('Not stopped — herdr-unavailable')).toBeVisible()
    await expect.element(box('plan the slice')).toHaveValue(secret)
    expect(getReports().map((r) => r.error.message)).toEqual(['A chat stop missed: herdr-unavailable 503'])
    fake.answerStops(undefined)
    await userEvent.click(chat.getByRole('button', { name: 'Retry' }))
    await expect.poll(() => fake.stops).toEqual([plan])
    await expect.element(chat.getByText('Not stopped — herdr-unavailable')).not.toBeInTheDocument()
    reports.expectNoText()
  })
})

describe('Send and Stop on the desktop workbench (W1)', () => {
  it("sends from a Claude chat's pane and stops it; the Codex pane cannot send and a shell has no composer", async () => {
    const fake = withChats()
    await tapWorkspaces([1512, 982])
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    const paneOf = (title: string) => page.getByRole('region', { name: title })
    await expect.element(page.getByText('Fix the build')).toBeVisible()
    await userEvent.fill(paneOf('plan the slice').getByRole('textbox'), secret)
    await userEvent.click(paneOf('plan the slice').getByRole('button', { name: 'Send', exact: true }))
    await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: secret }])
    await expect.element(paneOf('plan the slice').getByRole('textbox')).toHaveValue('')
    await userEvent.click(paneOf('plan the slice').getByRole('button', { name: 'Stop' }))
    await expect.poll(() => fake.stops).toEqual([plan])
    // The idle chat has no Stop; the Codex chat's composer stays off.
    expect(paneOf('review notes').getByRole('button', { name: 'Stop' }).elements()).toHaveLength(0)
    await expect.element(paneOf('drift check').getByRole('textbox')).toBeDisabled()
    // A shell's pane has no composer: its terminal is not live yet.
    expect(workbenchPane('tail logs')?.textContent).toContain('Terminal not live yet')
    expect(workbenchPane('tail logs')?.querySelector('textarea')).toBeNull()
    expect(getReports()).toEqual([])
  })
})
