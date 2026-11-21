import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { createClientErrorSender, type PostReport } from '../errors/clientErrorSender.ts'
import { addSink, clearReports, type ErrorReport, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { errorAnswer, type FakeTranscriptServer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { uploadError } from '../lib/fakeUploadServer.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'

// W1b: files attached to a live Claude chat's prompt, on the phone, the
// tablet and the desktop. Each test takes the owner's path: it opens the
// app with no URL parameters, taps Workspaces and a live chat (or finds its
// pane on the desktop), and adds files with the file input, a drop or a
// paste. The server is the contract-checked fake (lib/fakeTranscriptServer.ts
// with lib/fakeUploadServer.ts): fetch and XMLHttpRequest are stubbed, so
// nothing reaches a real server. Its chunk size is 4 bytes, so a 10-byte
// file goes up in three chunks. No report, posted client error or console
// line holds a file name or the message text.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'
const drift = 'mac-mini/c3'
const logs = 'mac-mini/c4'

type Status = 'working' | 'idle'
const summary = (id: string, kind: 'claude' | 'codex' | 'shell', title: string, status: Status) => ({
  id,
  kind,
  title,
  model: kind === 'codex' ? 'gpt-5.5' : kind === 'shell' ? 'zsh' : 'claude-opus-5-5',
  contextUsed: null,
  modelId: null,
  effort: null,
  pane: `${id}-pane`,
  status,
  parent: null,
})
const chats = [
  summary(plan, 'claude', 'plan the slice', 'idle'),
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

/** The message and the file names: none may reach a report, a posted client error or the console. */
const secret = 'deploy the private branch now'
const fileName = 'private-plan.pdf'
const file = (name = fileName, text = 'abcdefghij', type = 'application/pdf') => new File([text], name, { type })

// liveUploads.ts waits 250 ms, then 500 ms, before a chunk's two retries of its own: a wait across them has more than
// expect's default second, or a slow runner misses it.
const pastRetries = { timeout: 5_000 }

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

const phone = [390, 844] as const
const tablet = [756, 1129] as const
const desktop = [1512, 982] as const

/** The stubbed server: the workspaces, their layout, the event stream, and the fake's chat and upload routes. */
function fakeServer(fake: FakeTranscriptServer) {
  vi.stubGlobal('XMLHttpRequest', fake.uploads.XMLHttpRequest)
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

/** The fake with 4-byte chunks and the chats' transcripts. */
function withChats() {
  const fake = fakeTranscriptServer({ uploads: { chunkSize: 4 } })
  fake.set(plan, [{ type: 'user', id: 'u1', text: 'Fix the build', cut: false }])
  fake.set(review, [{ type: 'user', id: 'u2', text: 'Review the notes', cut: false }])
  fakeServer(fake)
  return fake
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
  resetAllStores()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  resetRetries()
  queryClient.clear()
  clearReports()
  await setViewport(desktop[0], desktop[1])
})

/** Opens the app at `size` with no URL parameters, or at `entry`, and taps Workspaces. */
async function tapWorkspaces(size: readonly [number, number], entry = '/') {
  await setViewport(size[0], size[1])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [entry] }),
    defaultErrorComponent: RouteError,
  })
  view = await testRender(<RouterProvider router={router} />, rootErrorOptions)
  if (entry !== '/') return
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  expect(router.state.location.searchStr).toBe('')
}

/** The open chat of `title`: its region on the phone or the tablet, its pane on the desktop. */
const chatOf = (title: string) => page.getByRole('region', { name: title })

/** Opens the live chat `title`: taps it in the list on the phone and the tablet; on the desktop its pane shows. */
async function openChat(size: readonly [number, number], title: string) {
  await tapWorkspaces(size)
  if (size === desktop) {
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(chatOf(title).getByRole('textbox')).toBeVisible()
    return
  }
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
}

/** Back to the list on the phone, and into `title`. */
async function switchTo(title: string) {
  await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
}

const box = (title: string) => chatOf(title).getByRole('textbox')
const sendButton = (title: string) => chatOf(title).getByRole('button', { name: 'Send', exact: true })
const attachButton = (title: string) => chatOf(title).getByRole('button', { name: 'Attach a file' })
const chips = (title: string) => chatOf(title).getByRole('group', { name: 'Attached files' })
const chipCount = (title: string) =>
  chatOf(title)
    .getByRole('button', { name: /^Remove / })
    .elements().length

/** The hidden file input of the chat `title`, which the paperclip opens. */
function fileInput(title: string): HTMLInputElement {
  const input = chatOf(title).element().querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) throw new Error('no file input')
  return input
}

/** Adds `files` through the chat's file input, as the device's picker does. */
async function pick(title: string, files: File[]) {
  await userEvent.upload(fileInput(title), files)
}

/** A transfer of `files`, as the browser gives a drop or a paste. */
function transfer(files: File[]): DataTransfer {
  const data = new DataTransfer()
  for (const f of files) data.items.add(f)
  return data
}

/** Drops `files` on the composer of `title` (on its box, inside the library's drop target), as from Finder. */
function drop(title: string, files: File[], data: { types: string[]; files: File[] } | DataTransfer = transfer(files)) {
  const target = box(title).element()
  for (const type of ['dragenter', 'dragover', 'drop']) {
    const event = new DragEvent(type, { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'dataTransfer', { value: data })
    target.dispatchEvent(event)
  }
}

/** Pastes `files` into the box of `title`, as a screenshot from the clipboard. */
function paste(title: string, files: File[]) {
  const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: transfer(files) })
  box(title).element().dispatchEvent(event)
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
    /** Fails when any of them holds a file name or the message text. */
    expectNoText: () => {
      const all = JSON.stringify([
        sunk.map((r) => [r.error.message, r.error.stack, r.error.name, r.componentStack]),
        posted,
        logged.map((l) => (l instanceof Error ? [l.message, l.stack] : String(l))),
      ])
      expect(all).not.toContain('private')
      expect(all).not.toContain('.pdf')
    },
  }
}

const devices = [
  { name: 'the phone', size: phone },
  { name: 'the tablet', size: tablet },
  { name: 'the desktop', size: desktop },
]

describe("a live Claude chat's files (W1b)", () => {
  for (const device of devices)
    it(`uploads picked files in chunks with progress and sends them with the text, on ${device.name}`, async () => {
      const fake = withChats()
      const reports = watchReports()
      fake.uploads.holdChunks()
      await openChat(device.size, 'plan the slice')
      // The paperclip opens the device's picker: a hidden input of any type, with no capture.
      const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined)
      await userEvent.click(attachButton('plan the slice'))
      expect(click).toHaveBeenCalledTimes(1)
      expect(click.mock.contexts[0]).toBe(fileInput('plan the slice'))
      click.mockRestore()
      const input = fileInput('plan the slice')
      expect([input.multiple, input.hasAttribute('accept'), input.hasAttribute('capture')]).toEqual([
        true,
        false,
        false,
      ])
      await pick('plan the slice', [file(), file('private-b.pdf'), file('private-c.pdf')])
      // Each file starts at once, but at most two upload together; the first chunk of each is half sent.
      await expect.poll(() => fake.uploads.starts.length).toBe(2)
      const bar = chatOf('plan the slice').getByRole('progressbar', { name: `Uploading ${fileName}` })
      await expect.element(bar).toHaveAttribute('aria-valuenow', '20')
      await expect.element(sendButton('plan the slice')).toBeDisabled()
      fake.uploads.releaseChunks()
      await expect.poll(() => fake.uploads.starts.length).toBe(3)
      await expect.element(chatOf('plan the slice').getByRole('progressbar')).not.toBeInTheDocument()
      // Three chunks for each 10-byte file: 4, 4 and 2 bytes, in order.
      const first = fake.uploads.chunks.filter((c) => c.upload === fake.uploads.chunks[0]?.upload)
      expect(first.map((c) => [c.n, c.bytes])).toEqual([
        [0, 4],
        [1, 4],
        [2, 2],
      ])
      expect(fake.uploads.starts).toEqual([
        { chat: plan, size: 10, type: 'application/pdf' },
        { chat: plan, size: 10, type: 'application/pdf' },
        { chat: plan, size: 10, type: 'application/pdf' },
      ])
      // The chat ID is in the start's path URL-encoded once.
      expect(fake.uploads.calls[0]).toEqual({ method: 'POST', path: '/api/chats/mac-mini%2Fc1/uploads' })
      const held = fake.uploads.held()
      await userEvent.fill(box('plan the slice'), secret)
      await userEvent.click(sendButton('plan the slice'))
      await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: secret, attachments: held }])
      await expect.element(box('plan the slice')).toHaveValue('')
      await expect.element(chips('plan the slice')).not.toBeInTheDocument()
      expect(getReports()).toEqual([])
      reports.expectNoText()
    })

  for (const device of [devices[1], devices[2]])
    if (device !== undefined)
      it(`adds files dropped on the composer and pasted into it, on ${device.name}`, async () => {
        const fake = withChats()
        await openChat(device.size, 'plan the slice')
        drop('plan the slice', [file('private-drop.pdf')])
        await expect.element(chatOf('plan the slice').getByText('private-drop.pdf')).toBeVisible()
        paste('plan the slice', [file('private-shot.png', 'png-bytes', 'image/png')])
        await expect.element(chatOf('plan the slice').getByText('private-shot.png')).toBeVisible()
        await expect.poll(() => fake.uploads.complete().length).toBe(2)
        await expect.element(sendButton('plan the slice')).toBeEnabled()
        await expect.poll(() => fake.uploads.starts.map((s) => s.type)).toEqual(['application/pdf', 'image/png'])
        // A paste of files puts no text in the box.
        await expect.element(box('plan the slice')).toHaveValue('')
      })

  for (const device of [devices[0], devices[2]])
    if (device !== undefined)
      it(`sends files with no text, with Send and with Enter, on ${device.name}`, async () => {
        const fake = withChats()
        await openChat(device.size, 'plan the slice')
        await pick('plan the slice', [file()])
        await expect.poll(() => fake.uploads.complete().length).toBe(1)
        await expect.element(sendButton('plan the slice')).toBeEnabled()
        const first = fake.uploads.held()
        await userEvent.click(sendButton('plan the slice'))
        await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: '', attachments: first }])
        await expect.element(chips('plan the slice')).not.toBeInTheDocument()
        await pick('plan the slice', [file('private-two.pdf')])
        await expect.poll(() => fake.uploads.complete().length).toBe(1)
        const second = fake.uploads.held()
        await expect.element(sendButton('plan the slice')).toBeEnabled()
        box('plan the slice').element().focus()
        await userEvent.keyboard('{Enter}')
        await expect.poll(() => fake.prompts.length).toBe(2)
        expect(fake.prompts[1]).toEqual({ chat: plan, text: '', attachments: second })
        // With no file and no text, nothing sends.
        await userEvent.keyboard('{Enter}')
        await new Promise((resolve) => setTimeout(resolve, 200))
        expect(fake.posts).toHaveLength(2)
      })

  it('aborts the chunk in flight and deletes the upload when the owner removes a file, on the phone', async () => {
    const fake = withChats()
    fake.uploads.holdChunks()
    await openChat(phone, 'plan the slice')
    await pick('plan the slice', [file()])
    await expect.poll(() => fake.uploads.calls.some((c) => c.method === 'PUT')).toBe(true)
    const [upload] = fake.uploads.held()
    await userEvent.click(chatOf('plan the slice').getByRole('button', { name: `Remove ${fileName}` }))
    await expect.poll(() => fake.uploads.aborts).toEqual([{ upload, n: 0 }])
    await expect
      .poll(() => fake.uploads.calls.at(-1))
      .toEqual({ method: 'DELETE', path: `/api/uploads/${upload ?? ''}` })
    expect(fake.uploads.held()).toEqual([])
    await expect.element(chips('plan the slice')).not.toBeInTheDocument()
    await expect.element(sendButton('plan the slice')).toBeEnabled()
    fake.uploads.releaseChunks()
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(fake.uploads.chunks).toEqual([])
    expect(getReports()).toEqual([])
  })

  it('sends a chunk again on its own after a 503 and a dropped connection, and the file attaches, on the tablet', async () => {
    const fake = withChats()
    const reports = watchReports()
    fake.uploads.answerChunks(
      () => errorAnswer({ kind: 'herdr-unavailable', message: 'down', requestId: 'r-1' }, 503),
      () => 'network',
    )
    await openChat(tablet, 'plan the slice')
    await pick('plan the slice', [file()])
    await expect.poll(() => fake.uploads.complete().length, pastRetries).toBe(1)
    await expect.element(chatOf('plan the slice').getByRole('progressbar')).not.toBeInTheDocument()
    await expect.element(chatOf('plan the slice').getByText(/^Not attached/)).not.toBeInTheDocument()
    expect(fake.uploads.chunks.map((c) => c.n)).toEqual([0, 1, 2])
    expect(fake.uploads.calls.filter((c) => c.method === 'PUT')).toHaveLength(5)
    expect(getReports()).toEqual([])
    expect(reports.posted).toEqual([])
  })

  it('fails the chip with Retry after three misses, and Retry goes on from the failed chunk, on the desktop', async () => {
    const fake = withChats()
    const reports = watchReports()
    await openChat(desktop, 'plan the slice')
    fake.uploads.answerChunks(
      () => 'network',
      () => 'network',
      () => 'network',
    )
    await pick('plan the slice', [file()])
    const chat = chatOf('plan the slice')
    await expect.element(chat.getByText('Not attached — unreachable', { exact: true }), pastRetries).toBeVisible()
    await expect.element(chat.getByRole('img', { name: 'Upload failed' })).toBeVisible()
    await expect.element(sendButton('plan the slice')).toBeDisabled()
    expect(fake.uploads.starts).toHaveLength(1)
    await userEvent.click(chat.getByRole('button', { name: `Retry ${fileName}` }))
    await expect.element(chat.getByText(/^Not attached/)).not.toBeInTheDocument()
    await expect.poll(() => fake.uploads.complete().length).toBe(1)
    // The same upload went on: no second start, and chunk 0 went once it was taken.
    expect(fake.uploads.starts).toHaveLength(1)
    expect(fake.uploads.chunks.map((c) => c.n)).toEqual([0, 1, 2])
    await expect.element(sendButton('plan the slice')).toBeEnabled()
    // A network miss is not reported.
    expect(getReports()).toEqual([])
    expect(reports.posted).toEqual([])
    reports.expectNoText()
  })

  it('starts the file again on Retry when the server no longer has its upload, on the desktop', async () => {
    const fake = withChats()
    await openChat(desktop, 'plan the slice')
    fake.uploads.answerChunks(
      () => uploadError({ kind: 'internal', message: 'bug', requestId: 'r-5' }, 500),
      () => uploadError({ kind: 'internal', message: 'bug', requestId: 'r-5' }, 500),
      () => uploadError({ kind: 'internal', message: 'bug', requestId: 'r-5' }, 500),
    )
    const reports = watchReports()
    await pick('plan the slice', [file()])
    const chat = chatOf('plan the slice')
    await expect.element(chat.getByText('Not attached — internal', { exact: true })).toBeVisible()
    // A 5xx that stays is reported once, with its step, kind and status only.
    expect(getReports().map((r) => r.error.message)).toEqual(['A chat upload missed: chunk internal 500'])
    await expect.poll(() => reports.posted.length).toBe(1)
    fake.uploads.forgetAll()
    await userEvent.click(chat.getByRole('button', { name: `Retry ${fileName}` }))
    await expect.poll(() => fake.uploads.complete().length).toBe(1)
    expect(fake.uploads.starts).toHaveLength(2)
    await expect.element(sendButton('plan the slice')).toBeEnabled()
    reports.expectNoText()
  })

  it('fails a file over 1 GiB on the page, with no request, on the desktop', async () => {
    const fake = withChats()
    await openChat(desktop, 'plan the slice')
    const big = file('private-huge.mov', 'x', 'video/quicktime')
    Object.defineProperty(big, 'size', { value: 1024 ** 3 + 1 })
    drop('plan the slice', [], { types: ['Files'], files: [big] })
    const chat = chatOf('plan the slice')
    await expect.element(chat.getByText('Not attached — too large', { exact: true })).toBeVisible()
    await expect.element(chat.getByRole('img', { name: 'Upload failed' })).toBeVisible()
    // The server will never take it: the chip has no Retry (library beta.95 `retry: false`).
    await expect.element(chat.getByRole('button', { name: 'Retry private-huge.mov' })).not.toBeInTheDocument()
    await expect.element(sendButton('plan the slice')).toBeDisabled()
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(fake.uploads.calls).toEqual([])
    // Remove takes it away and Send works again; there was no upload to delete.
    await userEvent.click(chat.getByRole('button', { name: 'Remove private-huge.mov' }))
    await expect.element(sendButton('plan the slice')).toBeEnabled()
    expect(fake.uploads.calls).toEqual([])
    expect(getReports()).toEqual([])
  })

  it('adds at most 10 files and says so for the rest, on the phone', async () => {
    const fake = withChats()
    await openChat(phone, 'plan the slice')
    await pick(
      'plan the slice',
      Array.from({ length: 11 }, (_, i) => file(`private-${String(i)}.pdf`)),
    )
    const chat = chatOf('plan the slice')
    await expect.element(chat.getByText('Not attached — 10 files at most', { exact: true })).toBeVisible()
    expect(chipCount('plan the slice')).toBe(10)
    await expect.element(chat.getByText('private-10.pdf')).not.toBeInTheDocument()
    await expect.poll(() => fake.uploads.complete().length).toBe(10)
    expect(fake.uploads.starts).toHaveLength(10)
  })

  it('keeps the text and fails the chips with Retry on a 409 upload-conflict at send, on the phone', async () => {
    const fake = withChats()
    const reports = watchReports()
    await openChat(phone, 'plan the slice')
    await pick('plan the slice', [file()])
    await expect.poll(() => fake.uploads.complete().length).toBe(1)
    await userEvent.fill(box('plan the slice'), secret)
    // The server lost the upload: the send names a file it does not have.
    fake.uploads.forgetAll()
    await userEvent.click(sendButton('plan the slice'))
    const chat = chatOf('plan the slice')
    await expect.element(chat.getByText('Not sent — retry the files that failed', { exact: true })).toBeVisible()
    expect(fake.prompts).toEqual([])
    await expect.element(box('plan the slice')).toHaveValue(secret)
    await expect.element(chat.getByRole('img', { name: 'Upload failed' })).toBeVisible()
    await expect.element(sendButton('plan the slice')).toBeDisabled()
    // Retry starts the file again; then the send goes.
    await userEvent.click(chat.getByRole('button', { name: `Retry ${fileName}` }))
    await expect.poll(() => fake.uploads.complete().length).toBe(1)
    expect(fake.uploads.starts).toHaveLength(2)
    const again = fake.uploads.complete()
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: secret, attachments: again }])
    await expect.element(box('plan the slice')).toHaveValue('')
    expect(getReports()).toEqual([])
    expect(reports.posted).toEqual([])
    reports.expectNoText()
  })

  it("sends nothing on a failed send's Retry while a file uploads, and names the file once it is ready, on the phone", async () => {
    const fake = withChats()
    await openChat(phone, 'plan the slice')
    await userEvent.fill(box('plan the slice'), secret)
    fake.answerPrompts(() => errorAnswer({ kind: 'herdr-unavailable', message: 'down', requestId: 'r-1' }, 503))
    await userEvent.click(sendButton('plan the slice'))
    const chat = chatOf('plan the slice')
    const retry = chat.getByRole('button', { name: 'Retry', exact: true })
    await expect.element(retry).toBeVisible()
    fake.answerPrompts(undefined)
    // A file added after the miss is still uploading: Retry must not send the text without it.
    fake.uploads.holdChunks()
    await pick('plan the slice', [file()])
    await expect.poll(() => fake.uploads.held().length).toBe(1)
    await userEvent.click(retry)
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(fake.prompts).toEqual([])
    await expect.element(box('plan the slice')).toHaveValue(secret)
    fake.uploads.releaseChunks()
    await expect.poll(() => fake.uploads.complete().length).toBe(1)
    const ids = fake.uploads.complete()
    await userEvent.click(retry)
    await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: secret, attachments: ids }])
    await expect.element(box('plan the slice')).toHaveValue('')
  })

  const pendingSends = [
    { name: 'goes through', end: () => new Response(null, { status: 204 }), deletes: 0 },
    {
      name: 'misses',
      end: () => errorAnswer({ kind: 'herdr-unavailable', message: 'down', requestId: 'r-1' }, 503),
      deletes: 1,
    },
  ]
  for (const send of pendingSends)
    it(`removes a chip while its send is pending, and the send ${send.name}: ${send.deletes === 0 ? 'keeps' : 'deletes'} the file, on the phone`, async () => {
      const fake = withChats()
      await openChat(phone, 'plan the slice')
      await pick('plan the slice', [file()])
      await expect.poll(() => fake.uploads.complete().length).toBe(1)
      await userEvent.fill(box('plan the slice'), secret)
      const answer = held()
      fake.answerPrompts(answer.answer)
      await userEvent.click(sendButton('plan the slice'))
      await expect.poll(() => fake.posts.length).toBe(1)
      // The prompt names the file: the server may have given Claude its path already.
      await userEvent.click(chatOf('plan the slice').getByRole('button', { name: `Remove ${fileName}` }))
      const deletes = () => fake.uploads.calls.filter((c) => c.method === 'DELETE').length
      await new Promise((resolve) => setTimeout(resolve, 200))
      expect(deletes()).toBe(0)
      answer.end(send.end())
      await expect.poll(deletes).toBe(send.deletes)
      await new Promise((resolve) => setTimeout(resolve, 200))
      expect(deletes()).toBe(send.deletes)
    })

  it('keeps the files through a clear of the terminal input, and the send after the clear names them, on the phone', async () => {
    const fake = withChats()
    const reports = watchReports()
    fake.typeInTerminal(plan)
    await openChat(phone, 'plan the slice')
    await pick('plan the slice', [file()])
    await expect.poll(() => fake.uploads.complete().length).toBe(1)
    const ids = fake.uploads.complete()
    await userEvent.fill(box('plan the slice'), secret)
    await userEvent.click(sendButton('plan the slice'))
    const chat = chatOf('plan the slice')
    await userEvent.click(chat.getByRole('button', { name: 'Clear the terminal input' }))
    await userEvent.click(page.getByRole('alertdialog').getByRole('button', { name: 'Clear', exact: true }))
    // The clear goes first, then the kept draft with the chip's file, as one send.
    await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: secret, attachments: ids }])
    expect(fake.clears).toEqual([plan])
    await expect.element(box('plan the slice')).toHaveValue('')
    await expect.element(chat.getByRole('button', { name: `Remove ${fileName}` })).not.toBeInTheDocument()
    expect(getReports()).toEqual([])
    expect(reports.posted).toEqual([])
    reports.expectNoText()
  })

  const completes = [
    {
      name: '415 unsupported-media',
      answer: () => uploadError({ kind: 'unsupported-media', message: 'heic', requestId: 'r-1' }, 415),
      line: 'Not attached — this file type cannot be read',
      reported: [],
      retry: false,
    },
    {
      name: '507 storage-full',
      answer: () => uploadError({ kind: 'storage-full', message: 'full', requestId: 'r-2' }, 507),
      line: "Not attached — the Mac's disk is full",
      reported: ['A chat upload missed: complete storage-full 507'],
      retry: true,
    },
  ]
  for (const miss of completes)
    it(`fails the chip on a ${miss.name} at complete, on the tablet`, async () => {
      const fake = withChats()
      const reports = watchReports()
      fake.uploads.answerCompletes(miss.answer)
      await openChat(tablet, 'plan the slice')
      await pick('plan the slice', [file('private-photo.heic', 'heic-bytes', 'image/heic')])
      const chat = chatOf('plan the slice')
      await expect.element(chat.getByText(miss.line, { exact: true })).toBeVisible()
      await expect.element(sendButton('plan the slice')).toBeDisabled()
      // A file type the server cannot read never uploads: no Retry. A full disk may have room later.
      expect(chat.getByRole('button', { name: 'Retry private-photo.heic' }).elements()).toHaveLength(miss.retry ? 1 : 0)
      expect(getReports().map((r) => r.error.message)).toEqual(miss.reported)
      await expect.poll(() => reports.posted.length).toBe(miss.reported.length)
      // The posted report holds the kind only.
      const bodies = reports.posted.map((p): unknown => JSON.parse(p))
      expect(bodies).toMatchObject(miss.reported.map(() => ({ name: 'ChatUploadMissError', message: 'storage-full' })))
      // Remove deletes the upload, which the server still holds.
      const [upload] = fake.uploads.held()
      await userEvent.click(chat.getByRole('button', { name: 'Remove private-photo.heic' }))
      await expect
        .poll(() => fake.uploads.calls.at(-1))
        .toEqual({ method: 'DELETE', path: `/api/uploads/${upload ?? ''}` })
      reports.expectNoText()
    })

  it('keeps each chat its own files when the owner switches chats during an upload, on the phone', async () => {
    const fake = withChats()
    fake.uploads.holdChunks()
    await openChat(phone, 'plan the slice')
    await pick('plan the slice', [file()])
    await expect.poll(() => fake.uploads.starts.length).toBe(1)
    await switchTo('review notes')
    await expect.element(box('review notes')).toBeVisible()
    await expect.element(chips('review notes')).not.toBeInTheDocument()
    await expect.element(sendButton('review notes')).toBeEnabled()
    fake.uploads.releaseChunks()
    await expect.poll(() => fake.uploads.complete().length).toBe(1)
    // A send from the other chat names none of the first chat's files.
    await userEvent.fill(box('review notes'), 'a note for review')
    await userEvent.click(sendButton('review notes'))
    await expect.poll(() => fake.prompts).toEqual([{ chat: review, text: 'a note for review' }])
    await switchTo('plan the slice')
    await expect.element(chatOf('plan the slice').getByText(fileName)).toBeVisible()
    await expect.element(sendButton('plan the slice')).toBeEnabled()
    const mine = fake.uploads.complete()
    await userEvent.click(sendButton('plan the slice'))
    await expect.poll(() => fake.prompts.at(-1)).toEqual({ chat: plan, text: '', attachments: mine })
  })

  it('gives a Codex chat no paperclip on the phone, and neither the Codex pane nor the shell on the desktop', async () => {
    withChats()
    await openChat(phone, 'drift check')
    await expect.element(box('drift check')).toBeDisabled()
    expect(attachButton('drift check').elements()).toHaveLength(0)
    expect(chatOf('drift check').element().querySelector('input[type="file"]')).toBeNull()
    await view?.unmount()
    view = undefined
    await openChat(desktop, 'plan the slice')
    await expect.element(attachButton('plan the slice')).toBeVisible()
    expect(attachButton('drift check').elements()).toHaveLength(0)
    const shell = page
      .getByRole('button', { name: 'Maximise tail logs', exact: true })
      .element()
      .closest('[data-figma]')
    expect(shell?.querySelector('button[aria-label="Attach a file"]')).toBeNull()
  })

  it('reaches the paperclip, Remove and Retry with Tab on the desktop', async () => {
    const fake = withChats()
    await openChat(desktop, 'plan the slice')
    fake.uploads.answerChunks(
      () => 'network',
      () => 'network',
      () => 'network',
    )
    await pick('plan the slice', [file()])
    const chat = chatOf('plan the slice')
    await expect.element(chat.getByRole('button', { name: `Retry ${fileName}` })).toBeVisible()
    const reached = new Set<string>()
    box('plan the slice').element().focus()
    for (let i = 0; i < 6; i++) {
      await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
      reached.add(document.activeElement?.getAttribute('aria-label') ?? '')
    }
    box('plan the slice').element().focus()
    for (let i = 0; i < 2; i++) {
      await userEvent.keyboard('{Tab}')
      reached.add(document.activeElement?.getAttribute('aria-label') ?? '')
    }
    expect([...reached]).toEqual(expect.arrayContaining(['Attach a file', `Remove ${fileName}`, `Retry ${fileName}`]))
  })
})

describe('the side chat in a pane (D5, W1b)', () => {
  it('draws the paperclip in its one-row composer, as every composer of the page does', async () => {
    await tapWorkspaces(desktop, '/workspaces?state=sideChatInPane')
    // The side chat sits in its pane (SideChatPanel placement="pane", D5 158:518), over the chat's right side.
    await expect.poll(() => document.querySelector('[data-figma="158:518"]')).not.toBeNull()
    const panel = document.querySelector('[data-figma="158:518"]')
    expect(panel?.querySelector('button[aria-label="Attach a file"]')).not.toBeNull()
  })
})
