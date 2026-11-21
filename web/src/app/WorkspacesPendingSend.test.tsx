import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import Markdown from 'react-markdown'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { createClientErrorSender, type PostReport } from '../errors/clientErrorSender.ts'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { addSink, clearReports, type ErrorReport, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { errorAnswer, type FakeTranscriptServer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// The pending send (the owner, on his phone: "why does it take so long to send a
// message"): the server answers a prompt in about 1 s, and the prompt showed
// only when the transcript stream brought it. Now a live Claude chat's Send
// empties the box and shows the text at once as a pending bubble with its
// file chips and "Sending…", and the stream's entry takes its place in the
// same render, so the text never shows twice. A miss removes the bubble and
// puts the text back in the box with the miss's line. Each test takes the
// owner's path (open /, tap Workspaces, tap the chat; on the desktop its pane
// shows) with the contract-checked fake (lib/fakeTranscriptServer.ts); the
// prompt's answer is held where the test needs the time before it. No
// report, posted client error or console line holds the text or a file name.
vi.mock('react-markdown', { spy: true })

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'

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
const chats = [summary(plan, 'plan the slice'), summary(review, 'review notes')]
const pane = (chat: string) => ({ kind: 'pane', chat })
const layout = JSON.stringify({
  workspace,
  tabs: [
    {
      id: 'mac-mini/w-live:t1',
      label: 'main',
      active: true,
      root: { kind: 'split', direction: 'row', ratio: 0.5, first: pane(plan), second: pane(review) },
      focusedChat: plan,
      zoomed: false,
      chats,
    },
  ],
})

/** The message and the file name: neither may reach a report, a posted client error or the console. */
const secret = 'deploy the private branch now'
const fileName = 'private notes.txt'

const user = (id: string, text: string, files?: string[]): TranscriptEntry => ({
  type: 'user',
  id,
  text,
  cut: false,
  ...(files === undefined ? {} : { files }),
})
const reply = (id: string, text: string): TranscriptEntry => ({ type: 'assistant', id, text, cut: false })

/** An answer the test ends: `end` gives the page `answer`. */
function held() {
  let end: (answer: Response | Promise<Response>) => void = () => undefined
  const answer = () =>
    new Promise<Response>((resolve) => {
      end = resolve
    })
  return {
    answer,
    end: (res: Response | Promise<Response>) => {
      end(res)
    },
  }
}

const noContent = () => new Response(null, { status: 204 })

/** While set, each transcript read waits for it before the fake answers: a slow first read. */
let readsWait: Promise<void> | undefined

function fakeServer(fake: FakeTranscriptServer) {
  vi.stubGlobal('XMLHttpRequest', fake.uploads.XMLHttpRequest)
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      if (readsWait !== undefined && path.endsWith('/transcript')) {
        const wait = readsWait
        return wait.then(() => fake.handle(path, init) ?? Promise.reject(new TypeError('no read')))
      }
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

/** The fake with 4-byte chunks and the chats' transcripts: `count` entries in plan, each Markdown. */
function withChats(count = 2) {
  const fake = fakeTranscriptServer({ uploads: { chunkSize: 4 } })
  fake.set(
    plan,
    Array.from({ length: count }, (_, i) =>
      i % 2 === 0
        ? user(`u${String(i)}`, `question ${String(i)} with *emphasis*`)
        : reply(`a${String(i)}`, `- the **item** ${String(i)}`),
    ),
  )
  fake.set(review, [user('r1', 'Review the notes')])
  fakeServer(fake)
  return fake
}

let view: { unmount: () => Promise<void> } | undefined
const cleanups: (() => void)[] = []

stubLiveServer()
answerLateServerReads()

afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) cleanup()
  await view?.unmount()
  view = undefined
  readsWait = undefined
  resetAllStores()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.mocked(Markdown).mockClear()
  resetRetries()
  queryClient.clear()
  clearReports()
  await setViewport(1512, 982)
})

const phone = [390, 844] as const
const desktop = [1512, 982] as const
const devices = [
  { name: 'the phone', size: phone },
  { name: 'the desktop', size: desktop },
]

/** Opens / at `size`, taps Workspaces, then the chat `title` on the phone; on the desktop its pane shows. */
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
  if (size === desktop) {
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(chatOf(title).getByRole('textbox')).toBeVisible()
  } else {
    await userEvent.click(page.getByText(title, { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
  }
  // The transcript is read: its messages show.
  if (readsWait !== undefined) return
  await expect.poll(() => chatOf(title).element().querySelectorAll('article').length).toBeGreaterThan(0)
}

const chatOf = (title: string) => page.getByRole('region', { name: title })
const box = (title: string) => chatOf(title).getByRole('textbox')
const sendButton = (title: string) => chatOf(title).getByRole('button', { name: 'Send', exact: true })
/** The pending bubbles of the chat: at most one. */
const pendingOf = (title: string) => chatOf(title).element().querySelectorAll('[data-pending-send]')
/** How many times the chat shows `text` in a message. */
const shownCount = (title: string, text: string) =>
  [...chatOf(title).element().querySelectorAll('p')].filter((p) => p.textContent === text).length

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
    expectNoText: () => {
      const all = JSON.stringify([
        sunk.map((r) => [r.error.message, r.error.stack, r.error.name, r.componentStack]),
        posted,
        logged.map((l) => (l instanceof Error ? [l.message, l.stack] : String(l))),
      ])
      expect(all).not.toContain('private branch')
      expect(all).not.toContain('private notes')
    },
  }
}

/** Counts each render in which the chat shows `text` more often than the `sent` times it was sent: a bubble and its entry. */
function watchDoubles(title: string, text: string, sent = 1) {
  let doubles = 0
  const observer = new MutationObserver(() => {
    if (shownCount(title, text) > sent) doubles += 1
  })
  observer.observe(chatOf(title).element(), { childList: true, subtree: true, characterData: true })
  cleanups.push(() => {
    observer.disconnect()
  })
  return () => doubles
}

describe('a live Claude chat shows a sent message at once (pending send)', () => {
  for (const device of devices)
    it(`shows the bubble before the 204 and swaps it for the stream's entry with no double, on ${device.name}`, async () => {
      const fake = withChats()
      const reports = watchReports()
      const answer = held()
      fake.answerPrompts(answer.answer)
      await openChat(device.size, 'plan the slice')
      await userEvent.fill(box('plan the slice'), secret)
      const doubles = watchDoubles('plan the slice', secret)
      await userEvent.click(sendButton('plan the slice'))
      // The server has not answered: the box is empty and the text shows, pending.
      await expect.poll(() => fake.posts.length).toBe(1)
      await expect.element(box('plan the slice')).toHaveValue('')
      expect(pendingOf('plan the slice')).toHaveLength(1)
      await expect.element(chatOf('plan the slice').getByRole('status')).toHaveTextContent('Sending…')
      expect(shownCount('plan the slice', secret)).toBe(1)
      answer.end(noContent())
      // It was sent: "Sending…" goes, and the bubble waits for its entry.
      await expect.element(chatOf('plan the slice').getByRole('status')).toHaveTextContent('')
      expect(pendingOf('plan the slice')).toHaveLength(1)
      // The stream brings the prompt as the server wrote it: the entry takes the bubble's place.
      fake.push(plan, [user('u9', secret)])
      await expect.poll(() => pendingOf('plan the slice').length).toBe(0)
      expect(shownCount('plan the slice', secret)).toBe(1)
      expect(doubles()).toBe(0)
      expect(getReports()).toEqual([])
      reports.expectNoText()
    })

  it('shows the sent files as chips in the bubble and in the entry that replaces it, never in both', async () => {
    const fake = withChats()
    const reports = watchReports()
    await openChat(phone, 'plan the slice')
    const input = chatOf('plan the slice').element().querySelector('input[type="file"]')
    if (!(input instanceof HTMLInputElement)) throw new Error('no file input')
    await userEvent.upload(input, [new File(['abcdefghij'], fileName, { type: 'text/plain' })])
    await expect.element(chatOf('plan the slice').getByRole('button', { name: `Remove ${fileName}` })).toBeVisible()
    await expect.element(sendButton('plan the slice')).toBeEnabled()
    const answer = held()
    fake.answerPrompts(answer.answer)
    await userEvent.fill(box('plan the slice'), 'Read this')
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => pendingOf('plan the slice').length).toBe(1)
    // The chip moved from the composer to the bubble.
    const sent = chatOf('plan the slice').getByRole('group', { name: 'Files sent' })
    await expect.element(sent).toHaveTextContent(fileName)
    await expect
      .element(chatOf('plan the slice').getByRole('button', { name: `Remove ${fileName}` }))
      .not.toBeInTheDocument()
    fake.answerPrompts(undefined)
    answer.end(noContent())
    await expect.poll(() => fake.posts.length).toBe(1)
    // The server stores the file under its safe name, and the transcript names it so.
    fake.push(plan, [user('u9', 'Read this', ['private_notes.txt'])])
    await expect.poll(() => pendingOf('plan the slice').length).toBe(0)
    expect(chatOf('plan the slice').getByRole('group', { name: 'Files sent' }).elements()).toHaveLength(1)
    await expect.element(sent).toHaveTextContent('private_notes.txt')
    expect(getReports()).toEqual([])
    reports.expectNoText()
  })

  const misses = [
    {
      name: '409 inputNotEmpty',
      answer: () =>
        errorAnswer({ kind: 'chat-not-ready', state: 'inputNotEmpty', message: 'busy', requestId: 'r-1' }, 409),
      line: "Not sent — clear the text in the chat's terminal input, then send",
    },
    {
      name: 'network error',
      answer: () => Promise.reject(new TypeError('Failed to fetch')),
      line: 'Not sent — unreachable',
    },
  ]
  for (const miss of misses)
    for (const device of devices)
      it(`removes the bubble and puts the text back with its line on a ${miss.name}, on ${device.name}`, async () => {
        const fake = withChats()
        const reports = watchReports()
        const answer = held()
        fake.answerPrompts(answer.answer)
        await openChat(device.size, 'plan the slice')
        await userEvent.fill(box('plan the slice'), secret)
        await userEvent.click(sendButton('plan the slice'))
        await expect.poll(() => pendingOf('plan the slice').length).toBe(1)
        await expect.element(box('plan the slice')).toHaveValue('')
        await expect.poll(() => fake.posts.length).toBe(1)
        answer.end(miss.answer())
        await expect.element(chatOf('plan the slice').getByText(miss.line)).toBeVisible()
        expect(pendingOf('plan the slice')).toHaveLength(0)
        await expect.element(box('plan the slice')).toHaveValue(secret)
        expect(shownCount('plan the slice', secret)).toBe(0)
        expect(getReports()).toEqual([])
        reports.expectNoText()
      })

  it('keeps what the owner typed meanwhile after the text put back on a miss', async () => {
    const fake = withChats()
    const answer = held()
    fake.answerPrompts(answer.answer)
    await openChat(phone, 'plan the slice')
    await userEvent.fill(box('plan the slice'), secret)
    await userEvent.click(sendButton('plan the slice'))
    await expect.element(box('plan the slice')).toHaveValue('')
    await userEvent.fill(box('plan the slice'), 'and one more thing')
    await expect.poll(() => fake.posts.length).toBe(1)
    answer.end(errorAnswer({ kind: 'herdr-unavailable', message: 'down', requestId: 'r-2' }, 503))
    await expect.element(chatOf('plan the slice').getByText('Not sent — herdr-unavailable')).toBeVisible()
    await expect.element(box('plan the slice')).toHaveValue(`${secret}\n\nand one more thing`)
  })

  it('keeps the bubble of a prompt sent while the chat works until its entry comes after the replies, with no double', async () => {
    const fake = withChats()
    await openChat(phone, 'plan the slice')
    await userEvent.fill(box('plan the slice'), secret)
    const doubles = watchDoubles('plan the slice', secret)
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.prompts.length).toBe(1)
    await expect.element(chatOf('plan the slice').getByRole('status')).toHaveTextContent('')
    // Claude goes on with its work: replies come, and the bubble stays after them.
    fake.push(plan, [reply('a7', 'still on the build'), reply('a8', 'the tests pass')])
    await expect.element(chatOf('plan the slice').getByText('the tests pass')).toBeVisible()
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(pendingOf('plan the slice')).toHaveLength(1)
    // Claude takes the queued prompt: its entry lands between replies, not at the end.
    fake.push(plan, [reply('a9', 'done with the build'), user('u9', secret), reply('a10', 'on it')])
    await expect.poll(() => pendingOf('plan the slice').length).toBe(0)
    expect(shownCount('plan the slice', secret)).toBe(1)
    expect(doubles()).toBe(0)
  })

  it('keeps a bubble for each of two sends until its own entry comes, even with the same text', async () => {
    const fake = withChats()
    await openChat(phone, 'plan the slice')
    const doubles = watchDoubles('plan the slice', secret, 2)
    // Two sends that went through, one after the other, before either entry came (a chat that works queues both).
    await userEvent.fill(box('plan the slice'), secret)
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.prompts.length).toBe(1)
    await expect.element(chatOf('plan the slice').getByRole('status')).toHaveTextContent('')
    await userEvent.fill(box('plan the slice'), secret)
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.prompts.length).toBe(2)
    await expect.poll(() => pendingOf('plan the slice').length).toBe(2)
    expect(shownCount('plan the slice', secret)).toBe(2)
    // The first entry takes the first bubble only.
    fake.push(plan, [user('u9', secret)])
    await expect.poll(() => pendingOf('plan the slice').length).toBe(1)
    expect(shownCount('plan the slice', secret)).toBe(2)
    fake.push(plan, [reply('a9', 'on it'), user('u10', secret)])
    await expect.poll(() => pendingOf('plan the slice').length).toBe(0)
    expect(shownCount('plan the slice', secret)).toBe(2)
    expect(doubles()).toBe(0)
  })

  it('waits for its own entry when it was sent before the transcript was read, though an older one has its text', async () => {
    const fake = withChats()
    // The chat already holds a message with the same text.
    fake.set(plan, [user('u0', secret), reply('a0', 'done')])
    let release: () => void = () => undefined
    readsWait = new Promise<void>((resolve) => {
      release = resolve
    })
    await openChat(phone, 'plan the slice')
    await userEvent.fill(box('plan the slice'), secret)
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.prompts.length).toBe(1)
    await expect.poll(() => pendingOf('plan the slice').length).toBe(1)
    // The first read comes: the older message is not the new one's entry.
    readsWait = undefined
    release()
    await expect.element(chatOf('plan the slice').getByText('done')).toBeVisible()
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(pendingOf('plan the slice')).toHaveLength(1)
    expect(shownCount('plan the slice', secret)).toBe(2)
    fake.push(plan, [user('u9', secret)])
    await expect.poll(() => pendingOf('plan the slice').length).toBe(0)
    expect(shownCount('plan the slice', secret)).toBe(2)
  })

  it('removes a bubble with no entry on the first read of the transcript from 10 s after the 204, and keeps it on an earlier read', async () => {
    const fake = withChats()
    await openChat(phone, 'plan the slice')
    await userEvent.fill(box('plan the slice'), secret)
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.prompts.length).toBe(1)
    await expect.element(chatOf('plan the slice').getByRole('status')).toHaveTextContent('')
    // A read before 10 s after the 204 keeps the bubble: Claude may not have taken the prompt yet.
    fake.drop(plan)
    await expect.poll(() => fake.reads.length, { timeout: 5_000 }).toBeGreaterThan(1)
    expect(pendingOf('plan the slice')).toHaveLength(1)
    await new Promise((resolve) => setTimeout(resolve, 10_500))
    expect(pendingOf('plan the slice')).toHaveLength(1)
    // The stream drops again, and the read from 10 s after the 204 has no entry for the prompt: the bubble goes.
    const reads = fake.reads.length
    fake.drop(plan)
    await expect.poll(() => fake.reads.length, { timeout: 5_000 }).toBeGreaterThan(reads)
    await expect.poll(() => pendingOf('plan the slice').length).toBe(0)
    expect(shownCount('plan the slice', secret)).toBe(0)
  }, 30_000)

  it('drops the bubble of a chat the owner leaves, and the chat opened again shows the entry once', async () => {
    const fake = withChats()
    const answer = held()
    fake.answerPrompts(answer.answer)
    await openChat(phone, 'plan the slice')
    await userEvent.fill(box('plan the slice'), secret)
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => pendingOf('plan the slice').length).toBe(1)
    await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
    await userEvent.click(page.getByText('review notes', { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: 'review notes' })).toBeVisible()
    expect(pendingOf('review notes')).toHaveLength(0)
    await expect.poll(() => fake.posts.length).toBe(1)
    answer.end(noContent())
    fake.push(plan, [user('u9', secret)])
    await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
    await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
    await expect.element(chatOf('plan the slice').getByText(secret)).toBeVisible()
    expect(pendingOf('plan the slice')).toHaveLength(0)
    expect(shownCount('plan the slice', secret)).toBe(1)
  })

  it('renders no other transcript entry when the bubble shows or goes', async () => {
    const fake = withChats(40)
    const answer = held()
    fake.answerPrompts(answer.answer)
    await openChat(desktop, 'plan the slice')
    await expect.poll(() => vi.mocked(Markdown).mock.calls.length).toBeGreaterThanOrEqual(40)
    await userEvent.fill(box('plan the slice'), secret)
    await new Promise((resolve) => setTimeout(resolve, 200))
    vi.mocked(Markdown).mockClear()
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => pendingOf('plan the slice').length).toBe(1)
    await new Promise((resolve) => setTimeout(resolve, 200))
    // Only the bubble's own text is parsed.
    expect(vi.mocked(Markdown).mock.calls.map((call) => call[0].children)).toEqual([secret])
    answer.end(noContent())
    await new Promise((resolve) => setTimeout(resolve, 200))
    vi.mocked(Markdown).mockClear()
    fake.push(plan, [user('u99', secret)])
    await expect.poll(() => pendingOf('plan the slice').length).toBe(0)
    await new Promise((resolve) => setTimeout(resolve, 200))
    // Only the new entry is parsed: none of the 40 before it.
    expect(vi.mocked(Markdown).mock.calls.map((call) => call[0].children)).toEqual([secret])
  })
})
