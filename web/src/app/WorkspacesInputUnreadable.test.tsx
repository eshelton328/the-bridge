import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { createClientErrorSender, type PostReport } from '../errors/clientErrorSender.ts'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { addSink, clearReports, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { type FakeTranscriptServer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// Backend #339: the server answers a send, a command and a clear of the
// terminal input with 409 chat-not-ready `inputUnreadable` when it cannot find
// the chat's input box on the screen (a dialog, or a box it does not know),
// and sends nothing. The page says "cannot read this chat's input box. Look
// at the chat on the Mac." after the action's lead, with no Retry, no "Clear
// the terminal input" and no report: it is a state of the chat, not a fault.
// The draft and its chips stay. Each test takes the owner's path: the app at
// /, Workspaces, the live chat (its pane on the desktop), with a stubbed
// server whose routes are the contract-checked fakes
// (lib/fakeTranscriptServer.ts with its uploads, lib/fakeWorkspacesServer.ts).
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
  modelId: 'opus',
  effort: null,
  pane: `${id}-pane`,
  status: 'idle',
  parent: null,
})
const list = {
  machine: 'mac-mini',
  workspaces: [
    {
      id: workspace,
      label: 'live work',
      chats: [summary(plan, 'plan the slice'), summary(review, 'review notes')],
    },
  ],
}

const user = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })

/** The draft the tests type. */
const secret = 'deploy the private branch now'
const fileName = 'private-plan.pdf'
const file = () => new File(['abcdefghij'], fileName, { type: 'application/pdf' })

/** The words after the lead, the same for a send, a command and a clear. */
const unreadable = "cannot read this chat's input box. Look at the chat on the Mac."

/** The stubbed server: the fakes' chat, upload and workspace routes, and a rejection for anything else. */
function withChats(): FakeTranscriptServer {
  const chats = fakeTranscriptServer({ uploads: { chunkSize: 4 } })
  chats.set(plan, [user('u1', 'Fix the build')])
  chats.set(review, [user('u2', 'Review the notes')])
  const workspaces = fakeWorkspacesServer(chats, list)
  vi.stubGlobal('XMLHttpRequest', chats.uploads.XMLHttpRequest)
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
  return chats
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
const desktop = [1512, 982] as const
const devices = [
  { name: 'the phone', size: phone },
  { name: 'the desktop', size: desktop },
]

/** The posted client errors: none may come for this state. */
function watchPosts() {
  const posted: string[] = []
  const post = vi.fn<PostReport>((body) => {
    posted.push(body)
    return Promise.resolve(204)
  })
  cleanups.push(addSink(createClientErrorSender({ post })))
  return posted
}

/** The chat `title`: the phone's open chat, or the desktop workbench's pane; both are regions named by the title. */
const chatOf = (title: string) => page.getByRole('region', { name: title })
const box = () => chatOf('plan the slice').getByRole('textbox')
const sendButton = () => chatOf('plan the slice').getByRole('button', { name: 'Send', exact: true })

/** Opens the app at / at `size`, taps Workspaces and "plan the slice" (on the desktop its pane shows already). */
async function openChat(size: readonly [number, number]) {
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
    await expect.element(box()).toBeVisible()
  } else {
    await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
  }
}

/** Adds one file through the chat's hidden file input and waits until it is a complete upload. */
async function attach(chats: FakeTranscriptServer) {
  const input = chatOf('plan the slice').element().querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) throw new Error('no file input')
  await userEvent.upload(input, [file()])
  await expect.poll(() => chats.uploads.complete().length).toBe(1)
}

/** Opens the chat's actions and picks `label`: a row of the phone's sheet, or a menu item on the desktop. */
async function pick(size: readonly [number, number], label: string) {
  await userEvent.click(page.getByRole('button', { name: 'plan the slice actions' }))
  // A sheet's row is a radio whose input the library hides: the owner taps its label.
  await userEvent.click(
    size === phone ? page.getByText(label, { exact: true }) : page.getByRole('menuitem', { name: label }),
  )
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 200))

describe('a chat whose input box the server cannot read (409 inputUnreadable, backend #339)', () => {
  for (const device of devices)
    it(`keeps the draft and its chip after a send, with no Clear, no Retry and no report, on ${device.name}`, async () => {
      const chats = withChats()
      const posted = watchPosts()
      await openChat(device.size)
      await attach(chats)
      const ids = chats.uploads.complete()
      await userEvent.fill(box(), secret)
      chats.hideInput(plan, true)
      await userEvent.click(sendButton())
      const chat = chatOf('plan the slice')
      await expect.element(chat.getByText(`Not sent — ${unreadable}`, { exact: true })).toBeVisible()
      expect(chats.posts).toEqual([{ chat: plan, route: 'prompt' }])
      expect(chats.prompts).toEqual([])
      await expect.element(box()).toHaveValue(secret)
      await expect.element(chat.getByRole('button', { name: `Remove ${fileName}` })).toBeVisible()
      expect(chat.getByRole('img', { name: 'Upload failed' }).elements()).toHaveLength(0)
      expect(chat.getByRole('button', { name: 'Clear the terminal input' }).elements()).toHaveLength(0)
      expect(chat.getByRole('button', { name: 'Retry', exact: true }).elements()).toHaveLength(0)
      await settle()
      expect(getReports()).toEqual([])
      expect(posted).toEqual([])
      // Once the owner closed the dialog on the Mac, the same draft and chip go with the next Send.
      chats.hideInput(plan, false)
      await userEvent.click(sendButton())
      await expect.poll(() => chats.prompts).toEqual([{ chat: plan, text: secret, attachments: ids }])
      await expect.element(box()).toHaveValue('')
      await expect.element(chat.getByText(`Not sent — ${unreadable}`)).not.toBeInTheDocument()
    })

  for (const device of devices)
    it(`says the same after a clear of the terminal input, with no Retry and no report, on ${device.name}`, async () => {
      const chats = withChats()
      const posted = watchPosts()
      chats.typeInTerminal(plan)
      await openChat(device.size)
      await userEvent.fill(box(), secret)
      await userEvent.click(sendButton())
      const chat = chatOf('plan the slice')
      await userEvent.click(chat.getByRole('button', { name: 'Clear the terminal input' }))
      // A dialog opens in the chat on the Mac before the owner confirms.
      chats.hideInput(plan, true)
      await userEvent.click(page.getByRole('alertdialog').getByRole('button', { name: 'Clear', exact: true }))
      await expect.element(chat.getByText(`Not cleared — ${unreadable}`, { exact: true })).toBeVisible()
      expect(chats.posts).toEqual([
        { chat: plan, route: 'prompt' },
        { chat: plan, route: 'clear' },
      ])
      expect(chats.clears).toEqual([])
      expect(chats.prompts).toEqual([])
      await expect.element(box()).toHaveValue(secret)
      expect(chat.getByRole('button', { name: 'Clear the terminal input' }).elements()).toHaveLength(0)
      expect(chat.getByRole('button', { name: 'Retry', exact: true }).elements()).toHaveLength(0)
      await settle()
      expect(getReports()).toEqual([])
      expect(posted).toEqual([])
    })

  const commands = [
    { label: 'Compact context…', dialog: 'Compact the context', role: 'dialog', act: 'Compact', lead: 'Not compacted' },
    { label: 'Clear context…', dialog: 'Clear the context?', role: 'alertdialog', act: 'Clear', lead: 'Not cleared' },
  ] as const
  for (const device of devices)
    for (const command of commands)
      it(`says the same in the ${command.act} dialog, with no Clear, no Retry and no report, on ${device.name}`, async () => {
        const chats = withChats()
        const posted = watchPosts()
        chats.hideInput(plan, true)
        await openChat(device.size)
        await pick(device.size, command.label)
        const dialog = page.getByRole(command.role, { name: command.dialog })
        await userEvent.click(dialog.getByRole('button', { name: command.act, exact: true }))
        await expect.element(dialog.getByText(`${command.lead} — ${unreadable}`, { exact: true })).toBeVisible()
        expect(chats.posts).toEqual([{ chat: plan, route: 'command' }])
        expect(chats.commands).toEqual([])
        expect(dialog.getByRole('button', { name: 'Clear the terminal input' }).elements()).toHaveLength(0)
        expect(dialog.getByRole('button', { name: 'Retry', exact: true }).elements()).toHaveLength(0)
        await settle()
        expect(getReports()).toEqual([])
        expect(posted).toEqual([])
        await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }))
        await expect.element(dialog).not.toBeInTheDocument()
      })
})
