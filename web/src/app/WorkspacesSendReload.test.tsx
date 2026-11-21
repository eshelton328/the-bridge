import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { SendId, type TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { createClientErrorSender, type PostReport } from '../errors/clientErrorSender.ts'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { addSink, clearReports, type ErrorReport, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { type FakeTranscriptServer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'
import { z } from 'zod'

// A reload while a send has no answer (backend #369, the P2 of #348): the box
// empties as a send starts, so the reload would lose the text. Each send now
// carries a new send ID and stays in sessionStorage beside the drafts until
// its answer or its transcript entry comes; the page loaded again reads the
// send's result and puts the text back when it did not reach the chat, with
// the miss's line, or with "This message may have been sent" when the server
// cannot say. It never sends it again itself. Each test takes the owner's
// path (open /, tap Workspaces, tap the chat; on the desktop its pane shows)
// with the contract-checked fake (lib/fakeTranscriptServer.ts). A reload
// unmounts the app, empties every store and keeps sessionStorage; the first
// page's prompt stays unanswered, as a reload ends its request. No report,
// posted client error or console line holds the text or a file name.

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

/** The message: it may not reach a report, a posted client error or the console. */
const secret = 'deploy the private branch now'

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

const storageKey = 'bridge/workspaces/drafts'

const Kept = z.object({ sends: z.array(z.looseObject({ sendId: z.string(), at: z.number() })).optional() })

/** What the tab keeps beside the drafts now. */
const kept = () => Kept.parse(JSON.parse(window.sessionStorage.getItem(storageKey) ?? '{}'))

/** The send IDs kept in sessionStorage now. */
const keptIds = () => (kept().sends ?? []).map((send) => send.sendId)

/** Moves the kept sends' start back by `ms`, as if they were sent that long ago. */
function ageKept(ms: number) {
  const saved: unknown = JSON.parse(window.sessionStorage.getItem(storageKey) ?? '{}')
  const sends = (kept().sends ?? []).map((send) => ({ ...send, at: send.at - ms }))
  window.sessionStorage.setItem(storageKey, JSON.stringify({ ...z.looseObject({}).parse(saved), sends }))
}

/** A reload: the app goes, every store starts empty, and sessionStorage keeps what the tab saved. */
async function reload() {
  await view?.unmount()
  view = undefined
  const tab = Array.from({ length: window.sessionStorage.length }, (_, i) => {
    const key = window.sessionStorage.key(i) ?? ''
    return [key, window.sessionStorage.getItem(key) ?? ''] as const
  })
  resetAllStores()
  queryClient.clear()
  resetRetries()
  for (const [key, value] of tab) window.sessionStorage.setItem(key, value)
}

/** Opens the chat on `size`, sends `secret` with its answer held, and reloads before the answer: the send's ID. */
async function sendThenReload(fake: FakeTranscriptServer, size: readonly [number, number] = phone) {
  fake.answerPrompts(held().answer)
  await openChat(size, 'plan the slice')
  await userEvent.fill(box('plan the slice'), secret)
  await userEvent.click(sendButton('plan the slice'))
  await expect.poll(() => fake.posts.length).toBe(1)
  await expect.element(box('plan the slice')).toHaveValue('')
  const sendId = fake.sendIds[0] ?? ''
  expect(keptIds()).toEqual([sendId])
  await reload()
  fake.answerPrompts(undefined)
  return sendId
}

const maybeSent = 'This message may have been sent'

describe('a send that a reload cut off (send ID, backend #369)', () => {
  it('posts a new send ID with each send, and keeps none once the send is answered', async () => {
    const fake = withChats()
    await openChat(phone, 'plan the slice')
    await userEvent.fill(box('plan the slice'), 'first')
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.prompts.length).toBe(1)
    await userEvent.fill(box('plan the slice'), 'second')
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.prompts.length).toBe(2)
    expect(fake.sendIds).toHaveLength(2)
    for (const id of fake.sendIds) expect(SendId.safeParse(id).success).toBe(true)
    expect(fake.sendIds[0]).not.toBe(fake.sendIds[1])
    await expect.poll(keptIds).toEqual([])
  })

  it('forgets a send the server sent and puts nothing back', async () => {
    const fake = withChats()
    const reports = watchReports()
    const sendId = await sendThenReload(fake)
    fake.setSendResult(plan, sendId, 'sent')
    fake.push(plan, [user('u9', secret)])
    await openChat(phone, 'plan the slice')
    await expect.poll(() => fake.resultReads).toEqual([sendId])
    await expect.poll(keptIds).toEqual([])
    await expect.element(box('plan the slice')).toHaveValue('')
    expect(shownCount('plan the slice', secret)).toBe(1)
    expect(chatOf('plan the slice').getByText(maybeSent).elements()).toHaveLength(0)
    expect(fake.prompts).toHaveLength(0)
    expect(getReports()).toEqual([])
    reports.expectNoText()
  })

  const missed = [
    { result: 'notSubmitted', line: 'Not sent — the chat did not take the message', retry: true },
    { result: 'notSent', line: 'Not sent — chat not ready', retry: false },
    { result: 'unknown', line: maybeSent, retry: false },
  ] as const
  for (const miss of missed)
    it(`puts the text back with "${miss.line}" when the result is ${miss.result}`, async () => {
      const fake = withChats()
      const reports = watchReports()
      const sendId = await sendThenReload(fake)
      fake.setSendResult(plan, sendId, miss.result)
      await openChat(phone, 'plan the slice')
      await expect.element(chatOf('plan the slice').getByText(miss.line)).toBeVisible()
      await expect.element(box('plan the slice')).toHaveValue(secret)
      expect(pendingOf('plan the slice')).toHaveLength(0)
      expect(shownCount('plan the slice', secret)).toBe(0)
      expect(chatOf('plan the slice').getByRole('button', { name: 'Retry' }).elements()).toHaveLength(
        miss.retry ? 1 : 0,
      )
      expect(keptIds()).toEqual([])
      // It is never sent again by itself.
      expect(fake.posts).toHaveLength(1)
      expect(getReports()).toEqual([])
      reports.expectNoText()
    })

  for (const device of devices)
    it(`puts the text back with "${maybeSent}" when the server keeps no result (404), on ${device.name}`, async () => {
      const fake = withChats()
      const reports = watchReports()
      const sendId = await sendThenReload(fake, device.size)
      fake.forgetSends()
      await openChat(device.size, 'plan the slice')
      await expect.element(chatOf('plan the slice').getByText(maybeSent)).toBeVisible()
      await expect.element(box('plan the slice')).toHaveValue(secret)
      expect(fake.resultReads).toEqual([sendId])
      expect(keptIds()).toEqual([])
      expect(fake.posts).toHaveLength(1)
      expect(getReports()).toEqual([])
      reports.expectNoText()
    })

  it('puts the text back after any text typed since, and keeps that text', async () => {
    const fake = withChats()
    const sendId = await sendThenReload(fake)
    fake.setSendResult(plan, sendId, 'notSubmitted')
    fake.answerSendResults(() => new Promise<Response>(() => undefined))
    await openChat(phone, 'plan the slice')
    await userEvent.fill(box('plan the slice'), 'and one more thing')
    fake.answerSendResults(undefined)
    // The read held: the next open reads it.
    await reload()
    await openChat(phone, 'plan the slice')
    await expect.element(box('plan the slice')).toHaveValue(`${secret}\n\nand one more thing`)
  })

  it('reads a pending result again until it settles', async () => {
    const fake = withChats()
    const sendId = await sendThenReload(fake)
    fake.setSendResult(plan, sendId, 'pending')
    await openChat(phone, 'plan the slice')
    await expect.poll(() => fake.resultReads.length, { timeout: 5000 }).toBeGreaterThanOrEqual(2)
    await expect.element(box('plan the slice')).toHaveValue('')
    expect(keptIds()).toEqual([sendId])
    fake.setSendResult(plan, sendId, 'notSubmitted')
    await expect
      .element(chatOf('plan the slice').getByText('Not sent — the chat did not take the message'), { timeout: 5000 })
      .toBeVisible()
    await expect.element(box('plan the slice')).toHaveValue(secret)
    expect(fake.posts).toHaveLength(1)
  })

  it('keeps no send whose entry came before the reload, and reads nothing after it', async () => {
    const fake = withChats()
    fake.answerPrompts(held().answer)
    await openChat(phone, 'plan the slice')
    await userEvent.fill(box('plan the slice'), secret)
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.posts.length).toBe(1)
    expect(keptIds()).toHaveLength(1)
    // The stream brings the prompt before its 204: the entry takes the bubble's place, and the kept send goes.
    fake.push(plan, [user('u9', secret)])
    await expect.poll(() => pendingOf('plan the slice').length).toBe(0)
    expect(keptIds()).toEqual([])
    await reload()
    fake.answerPrompts(undefined)
    await openChat(phone, 'plan the slice')
    await expect.poll(() => shownCount('plan the slice', secret)).toBe(1)
    await expect.element(box('plan the slice')).toHaveValue('')
    expect(fake.resultReads).toEqual([])
  })

  it('treats a send older than 10 min as unknown without a read', async () => {
    const fake = withChats()
    await sendThenReload(fake)
    ageKept(11 * 60_000)
    await openChat(phone, 'plan the slice')
    await expect.element(chatOf('plan the slice').getByText(maybeSent)).toBeVisible()
    await expect.element(box('plan the slice')).toHaveValue(secret)
    expect(fake.resultReads).toEqual([])
    expect(keptIds()).toEqual([])
  })

  it('keeps the send when the read gets no answer, and reads it at the next load', async () => {
    const fake = withChats()
    const reports = watchReports()
    const sendId = await sendThenReload(fake)
    fake.setSendResult(plan, sendId, 'unknown')
    fake.answerSendResults(() => Promise.reject(new TypeError('Failed to fetch')))
    await openChat(phone, 'plan the slice')
    // The load reads it, and the chat opening after a read with no answer reads it again.
    await expect.poll(() => fake.resultReads.length).toBeGreaterThanOrEqual(1)
    await expect.element(box('plan the slice')).toHaveValue('')
    expect(keptIds()).toEqual([sendId])
    expect(chatOf('plan the slice').getByText(maybeSent).elements()).toHaveLength(0)
    fake.answerSendResults(undefined)
    const before = fake.resultReads.length
    await reload()
    await openChat(phone, 'plan the slice')
    await expect.element(chatOf('plan the slice').getByText(maybeSent)).toBeVisible()
    await expect.element(box('plan the slice')).toHaveValue(secret)
    expect(fake.resultReads.length).toBeGreaterThan(before)
    expect(new Set(fake.resultReads)).toEqual(new Set([sendId]))
    expect(getReports()).toEqual([])
    reports.expectNoText()
  })

  it('reads a send again when its chat opens after a read with no answer', async () => {
    const fake = withChats()
    const sendId = await sendThenReload(fake)
    fake.setSendResult(plan, sendId, 'notSent')
    fake.answerSendResults(() => Promise.reject(new TypeError('Failed to fetch')))
    // The page loads on the list: the read gets no answer, and the chat is not open yet.
    await setViewport(phone[0], phone[1])
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
      defaultErrorComponent: RouteError,
    })
    view = await testRender(<RouterProvider router={router} />, rootErrorOptions)
    await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
    await expect.poll(() => fake.resultReads).toEqual([sendId])
    fake.answerSendResults(undefined)
    await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
    await expect.element(chatOf('plan the slice').getByText('Not sent — chat not ready')).toBeVisible()
    await expect.element(box('plan the slice')).toHaveValue(secret)
    expect(fake.resultReads).toEqual([sendId, sendId])
  })

  /**
   * A reload as a browser makes it: the page's request fails at once (the browser ends it), so the composer puts the text
   * back with "Not sent — unreachable" in the second before the page goes; then the reload.
   */
  async function sendThenAbortedReload(fake: FakeTranscriptServer) {
    const answer = held()
    fake.answerPrompts(answer.answer)
    await openChat(phone, 'plan the slice')
    await userEvent.fill(box('plan the slice'), secret)
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.posts.length).toBe(1)
    const sendId = fake.sendIds[0] ?? ''
    answer.end(Promise.reject(new TypeError('Load failed')))
    await expect.element(box('plan the slice')).toHaveValue(secret)
    expect(keptIds()).toEqual([sendId])
    await reload()
    fake.answerPrompts(undefined)
    return sendId
  }

  it('takes the text back out of the box when a send whose request the reload ended was sent', async () => {
    const fake = withChats()
    const reports = watchReports()
    const sendId = await sendThenAbortedReload(fake)
    fake.setSendResult(plan, sendId, 'sent')
    fake.push(plan, [user('u9', secret)])
    await openChat(phone, 'plan the slice')
    await expect.poll(keptIds).toEqual([])
    await expect.element(box('plan the slice')).toHaveValue('')
    expect(shownCount('plan the slice', secret)).toBe(1)
    expect(fake.resultReads).toEqual([sendId])
    expect(getReports()).toEqual([])
    reports.expectNoText()
  })

  for (const miss of [missed[0], missed[2]])
    it(`keeps the text once, with "${miss.line}", when a send whose request the reload ended is ${miss.result}`, async () => {
      const fake = withChats()
      const sendId = await sendThenAbortedReload(fake)
      fake.setSendResult(plan, sendId, miss.result)
      await openChat(phone, 'plan the slice')
      await expect.element(chatOf('plan the slice').getByText(miss.line)).toBeVisible()
      await expect.element(box('plan the slice')).toHaveValue(secret)
      expect(keptIds()).toEqual([])
      expect(fake.posts).toHaveLength(1)
    })

  it('forgets a send whose request got no answer once the owner clears its text, with no read', async () => {
    const fake = withChats()
    const answer = held()
    fake.answerPrompts(answer.answer)
    await openChat(phone, 'plan the slice')
    await userEvent.fill(box('plan the slice'), secret)
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.posts.length).toBe(1)
    answer.end(Promise.reject(new TypeError('Load failed')))
    await expect.element(box('plan the slice')).toHaveValue(secret)
    await userEvent.clear(box('plan the slice'))
    await reload()
    fake.answerPrompts(undefined)
    await openChat(phone, 'plan the slice')
    await expect.poll(keptIds).toEqual([])
    await expect.element(box('plan the slice')).toHaveValue('')
    expect(fake.resultReads).toEqual([])
    expect(chatOf('plan the slice').getByText(maybeSent).elements()).toHaveLength(0)
  })

  it('forgets a send whose request got no answer when the chat sends again', async () => {
    const fake = withChats()
    const answer = held()
    fake.answerPrompts(answer.answer)
    await openChat(phone, 'plan the slice')
    await userEvent.fill(box('plan the slice'), secret)
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.posts.length).toBe(1)
    answer.end(Promise.reject(new TypeError('Failed to fetch')))
    await expect.element(chatOf('plan the slice').getByText('Not sent — unreachable')).toBeVisible()
    expect(keptIds()).toHaveLength(1)
    fake.answerPrompts(undefined)
    await userEvent.click(chatOf('plan the slice').getByRole('button', { name: 'Retry' }))
    await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: secret }])
    await expect.poll(keptIds).toEqual([])
  })

  it('sends the restored text with a new send ID, so the server takes it (no 409 duplicateSend)', async () => {
    const fake = withChats()
    const sendId = await sendThenReload(fake)
    // The server still knows the first ID: a send with it again would be refused.
    fake.setSendResult(plan, sendId, 'unknown')
    await openChat(phone, 'plan the slice')
    await expect.element(box('plan the slice')).toHaveValue(secret)
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: secret }])
    expect(fake.sendIds).toHaveLength(2)
    expect(fake.sendIds[1]).not.toBe(sendId)
    // The line goes with the next send.
    await expect.element(chatOf('plan the slice').getByText(maybeSent)).not.toBeInTheDocument()
    await expect.element(box('plan the slice')).toHaveValue('')
  })

  it("sends the restored text with a new send ID from the line's Retry", async () => {
    const fake = withChats()
    const sendId = await sendThenReload(fake)
    fake.setSendResult(plan, sendId, 'notSubmitted')
    await openChat(phone, 'plan the slice')
    await expect.element(box('plan the slice')).toHaveValue(secret)
    await userEvent.click(chatOf('plan the slice').getByRole('button', { name: 'Retry' }))
    await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: secret }])
    expect(fake.sendIds[1]).not.toBe(sendId)
  })
})
