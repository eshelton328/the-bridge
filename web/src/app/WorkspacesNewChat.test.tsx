import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { clearReports, getReports } from '../errors/reporter.ts'
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
import { markApp } from './appMarker.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// W3: New chat starts a live Claude chat (backend #378 to #381). Each test
// takes the owner's path: the app with no URL parameters, Workspaces, then
// the phone's + or the desktop's tab +, with the contract-checked fakes
// as the server. The chat opens when the workspace list shows its pane, and
// a first message goes to it once it is ready, with a send ID.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const live = 'mac-mini/w-live'
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
const list = {
  machine: 'mac-mini',
  workspaces: [{ id: live, label: 'live work', chats: [summary(plan, 'plan the slice'), summary(review, 'notes')] }],
}

type Fakes = { list: FakeWorkspacesServer; chats: FakeTranscriptServer }

function withChats(): Fakes {
  const chats = fakeTranscriptServer()
  for (const c of [plan, review]) chats.set(c, [])
  const workspaces = fakeWorkspacesServer(chats, list)
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
  return { list: workspaces, chats }
}

let view: { unmount: () => Promise<void> } | undefined

stubLiveServer()
answerLateServerReads()

afterEach(async () => {
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

async function tapWorkspaces(size: readonly [number, number]) {
  await setViewport(size[0], size[1])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    defaultErrorComponent: RouteError,
  })
  const before = new Set(document.body.children)
  view = await testRender(
    <>
      <RouterProvider router={router} />
      <ErrorTray />
    </>,
    rootErrorOptions,
  )
  const container = [...document.body.children].find((child) => !before.has(child))
  if (container === undefined) throw new Error('no view container')
  container.id = 'root'
  onTestFinished(markApp())
  onTestFinished(() => {
    container.removeAttribute('id')
  })
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  await expect.element(page.getByText('plan the slice', { exact: true }).first()).toBeVisible()
}

/** The phone's + and its New chat: the form fills the screen. */
async function openPhoneForm() {
  await userEvent.click(page.getByRole('button', { name: 'New chat or workspace' }))
  await userEvent.click(page.getByRole('menuitem', { name: 'New chat' }))
  await expect.element(page.getByRole('button', { name: 'Start chat' })).toBeVisible()
}

const nameField = () => page.getByRole('textbox', { name: 'NAME · OPTIONAL' })
const messageBox = () => page.getByRole('textbox', { name: 'FIRST MESSAGE' })
const startButton = () => page.getByRole('button', { name: /^(Start chat|Starting…)$/ })

/** The create ID of each start the page posted. */
const createIds = (fakes: Fakes) =>
  fakes.list.starts.map((body) =>
    typeof body === 'object' && body !== null && 'createId' in body ? body.createId : undefined,
  )

/** Types the form's name and first message, then taps Start chat. */
async function fill(name: string, message: string) {
  if (name !== '') await userEvent.fill(nameField(), name)
  if (message !== '') await userEvent.fill(messageBox(), message)
  await userEvent.click(startButton())
}

const quiet = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

describe('New chat on the live page (W3)', () => {
  it('starts a chat in a new tab from the phone, opens it and sends the first message once', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await openPhoneForm()
    await expect.element(page.getByText('new tab')).toBeVisible()
    await fill('fresh-start', 'hello there')
    await expect.element(page.getByRole('heading', { name: 'fresh-start' })).toBeVisible()
    expect(fakes.list.starts).toEqual([
      { kind: 'claude', name: 'fresh-start', place: { in: 'tab', workspace: live }, createId: createIds(fakes)[0] },
    ])
    await expect.poll(() => fakes.chats.prompts).toEqual([{ chat: 'mac-mini/new1', text: 'hello there' }])
    expect(fakes.chats.sendIds).toHaveLength(1)
    await quiet()
    expect(fakes.chats.prompts).toHaveLength(1)
    expect(getReports()).toEqual([])
  })

  it('starts a chat in a new tab from the desktop tab row, and shows that tab', async () => {
    const fakes = withChats()
    await tapWorkspaces(desktop)
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await userEvent.click(page.getByRole('button', { name: 'New chat in live work' }))
    await expect.element(page.getByText('new tab')).toBeVisible()
    await fill('tab-two', '')
    await expect.element(page.getByRole('button', { name: 'Maximise tab-two' })).toBeVisible()
    expect(page.getByRole('button', { name: 'Maximise plan the slice' }).elements()).toHaveLength(0)
    expect(fakes.list.tabs(live).map((t) => t.chats)).toEqual([[plan, review], ['mac-mini/new1']])
    expect(fakes.chats.prompts).toEqual([])
  })

  it('opens a chat that needs the owner with its line, and keeps the first message in its box', async () => {
    const fakes = withChats()
    fakes.list.startAs('needsYou')
    await tapWorkspaces(phone)
    await openPhoneForm()
    await fill('', 'wait for me')
    await expect.element(page.getByText('This chat needs you on the Mac')).toBeVisible()
    await expect.element(page.getByRole('textbox', { name: /Message/ })).toHaveValue('wait for me')
    await quiet()
    expect(fakes.chats.prompts).toEqual([])
  })

  it('shows a name that does not fit or that another chat has under the name, and a new create ID each time', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await openPhoneForm()
    await fill('9 lives', '')
    await expect.element(page.getByText(/Start with a small letter/)).toBeVisible()
    expect(fakes.list.starts).toEqual([])
    await fill('notes', '')
    await expect.element(page.getByText('Another chat has this name')).toBeVisible()
    await fill('other-notes', '')
    await expect.element(page.getByRole('heading', { name: 'other-notes' })).toBeVisible()
    const ids = createIds(fakes)
    expect(ids).toHaveLength(2)
    expect(ids[0]).not.toBe(ids[1])
    expect(getReports()).toEqual([])
  })

  it('retries a 502 with the same create ID', async () => {
    const fakes = withChats()
    fakes.list.answerNextStart(() =>
      errorAnswer({ kind: 'herdr-bad-reply', message: 'Bad reply', requestId: 'r-502' }, 502),
    )
    await tapWorkspaces(phone)
    await openPhoneForm()
    await fill('', 'go')
    await expect.element(page.getByText('Could not start the chat')).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Retry' }))
    await expect.element(page.getByRole('heading', { name: 'chat-1' })).toBeVisible()
    const ids = createIds(fakes)
    expect(ids).toHaveLength(2)
    expect(ids[1]).toBe(ids[0])
    await expect.poll(() => fakes.chats.prompts).toEqual([{ chat: 'mac-mini/new1', text: 'go' }])
    expect(getReports().map((r) => r.error.message)).toEqual(['A chat start missed: herdr-bad-reply 502'])
  })

  it('finds the chat in the list when the retry is a duplicate create', async () => {
    const fakes = withChats()
    fakes.list.answerNextStart(
      () => errorAnswer({ kind: 'herdr-unavailable', message: 'Down', requestId: 'r-503' }, 503),
      true,
    )
    await tapWorkspaces(phone)
    await openPhoneForm()
    await fill('lost-answer', 'once')
    await expect.element(page.getByText('Could not start the chat')).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Retry' }))
    await expect.element(page.getByRole('heading', { name: 'lost-answer' })).toBeVisible()
    expect(createIds(fakes)[1]).toBe(createIds(fakes)[0])
    await expect.poll(() => fakes.chats.prompts).toEqual([{ chat: 'mac-mini/new1', text: 'once' }])
  })

  it('keeps Starting… for a chat that was not ready in time, and opens it when the list shows it ready', async () => {
    const fakes = withChats()
    fakes.list.startAs('starting')
    await tapWorkspaces(phone)
    await openPhoneForm()
    await fill('slow-one', 'when ready')
    await expect.element(page.getByRole('button', { name: 'Starting…' })).toBeDisabled()
    await quiet()
    expect(fakes.chats.prompts).toEqual([])
    fakes.list.setStatus('mac-mini/new1', 'idle')
    await expect.element(page.getByRole('heading', { name: 'slow-one' })).toBeVisible()
    await expect.poll(() => fakes.chats.prompts).toEqual([{ chat: 'mac-mini/new1', text: 'when ready' }])
  })
})
