import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { clearReports, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { errorAnswer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { type FakeWorkspacesServer, fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// W10: a live Claude chat's model chip picks its effort for the session
// (backend #382, #384). Each test takes the owner's path: the app with no
// URL parameters, Workspaces, then a tap on the chat, with the
// contract-checked fakes as the server. The chip shows the list's level; a
// pick posts `{ effort }` to the effort route, never /effort as a prompt,
// and the chip follows the list after `workspaces.changed`.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'
const deep = 'mac-mini/c3'
const drift = 'mac-mini/c4'

const summary = (id: string, kind: 'claude' | 'codex', title: string, effort: string | null) => ({
  id,
  kind,
  title,
  model: kind === 'codex' ? 'gpt-5.5' : 'claude-opus-5-5',
  contextUsed: null,
  modelId: kind === 'claude' ? 'opus' : null,
  effort,
  pane: `${id}-pane`,
  status: 'idle',
  parent: null,
})
// plan is at medium, review's effort is not known, deep is at max, drift is a Codex chat.
const list = {
  machine: 'mac-mini',
  workspaces: [
    {
      id: workspace,
      label: 'live work',
      chats: [
        summary(plan, 'claude', 'plan the slice', 'medium'),
        summary(review, 'claude', 'review notes', null),
        summary(deep, 'claude', 'deep dive', 'max'),
        summary(drift, 'codex', 'drift check', 'xhigh'),
      ],
    },
  ],
}

/** The stubbed server; with `hold`, each effort change waits for it. Every prompt the page posts is kept. */
function withChats(hold?: Promise<void>) {
  const chats = fakeTranscriptServer()
  for (const c of [plan, review, deep]) chats.set(c, [])
  const workspaces = fakeWorkspacesServer(chats, list)
  const prompts: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      if (path.endsWith('/prompt') || path.endsWith('/command'))
        prompts.push(typeof init?.body === 'string' ? init.body : 'a body')
      if (hold !== undefined && path.endsWith('/effort'))
        return hold.then(() => workspaces.handle(path, init) ?? Promise.reject(new TypeError('no effort answer')))
      const answer = chats.handle(path, init) ?? workspaces.handle(path, init)
      if (answer !== undefined) return Promise.resolve(answer)
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
  return { list: workspaces, prompts }
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

async function tapChat(title: string) {
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
}

const chip = (text: string) => page.getByRole('button', { name: `Model: ${text}`, exact: true })
const choice = (level: string) => page.getByRole('menuitemradio', { name: new RegExp(`^${level}`) })
const choices = () => page.getByRole('menuitemradio').elements()
const checked = () =>
  choices()
    .filter((c) => c.getAttribute('aria-checked') === 'true')
    .map((c) => c.textContent)

/** The bodies of the effort changes the page posted. */
const posted = (fake: FakeWorkspacesServer) => fake.efforts.map((e) => [e.chat, e.body])

describe("a live chat's effort picker (W10)", () => {
  for (const [name, size] of [
    ['the phone', phone],
    ['the desktop', desktop],
  ] as const)
    it(`shows the list's effort and sets high on ${name}`, async () => {
      let release: () => void = () => undefined
      const hold = new Promise<void>((resolve) => {
        release = resolve
      })
      const fakes = withChats(hold)
      await tapWorkspaces(size)
      await tapChat('plan the slice')
      await userEvent.click(chip('Opus 5.5 · medium effort'))
      expect(choices().map((c) => c.textContent)).toEqual(['low', 'medium', 'high', 'xhigh'])
      expect(checked()).toEqual(['medium'])
      await userEvent.click(choice('high'))
      // The pick waits for its answer: the menu stays open, the picked choice is busy and every choice is off.
      await expect.element(choice('high').getByText('Setting…')).toBeVisible()
      for (const c of ['low', 'medium', 'high', 'xhigh']) await expect.element(choice(c)).toBeDisabled()
      release()
      await expect.element(chip('Opus 5.5 · high effort')).toBeVisible()
      expect(posted(fakes.list)).toEqual([[plan, { effort: 'high' }]])
      expect(page.getByRole('menuitemradio').elements()).toHaveLength(0)
      // The list gives the set level after workspaces.changed.
      expect(fakes.list.chats().find((c) => c.id === plan)?.effort).toBe('high')
      await userEvent.click(chip('Opus 5.5 · high effort'))
      expect(checked()).toEqual(['high'])
      // Never a prompt or a command: only the effort route.
      expect(fakes.prompts).toEqual([])
      expect(getReports()).toEqual([])
    })

  it('shows max as the current level but never offers it', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapChat('deep dive')
    await userEvent.click(chip('Opus 5.5 · max effort'))
    expect(choices().map((c) => c.textContent)).toEqual(['low', 'medium', 'high', 'xhigh'])
    expect(checked()).toEqual([])
    await userEvent.click(choice('xhigh'))
    await expect.element(chip('Opus 5.5 · xhigh effort')).toBeVisible()
    expect(posted(fakes.list)).toEqual([[deep, { effort: 'xhigh' }]])
  })

  it('shows the model alone when the effort is not known, and sets low', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapChat('review notes')
    await userEvent.click(chip('Opus 5.5'))
    expect(checked()).toEqual([])
    await userEvent.click(choice('low'))
    await expect.element(chip('Opus 5.5 · low effort')).toBeVisible()
    expect(posted(fakes.list)).toEqual([[review, { effort: 'low' }]])
  })

  it('turns every choice off while the chat works, with the reason, and posts nothing', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    fakes.list.setStatus(plan, 'working')
    await expect.element(page.getByText('Working', { exact: true }).first()).toBeVisible()
    await userEvent.click(chip('Opus 5.5 · medium effort'))
    for (const c of ['low', 'medium', 'high', 'xhigh']) await expect.element(choice(c)).toBeDisabled()
    await expect.element(page.getByRole('status').getByText('Wait until the chat is idle')).toBeVisible()
    await userEvent.click(choice('high'), { force: true })
    expect(fakes.list.efforts).toEqual([])
    await userEvent.keyboard('{Escape}')
    // Idle again, the choices are on.
    fakes.list.setStatus(plan, 'idle')
    await expect.element(page.getByText('Idle', { exact: true }).first()).toBeVisible()
    await userEvent.click(chip('Opus 5.5 · medium effort'))
    await expect.element(choice('high')).toBeEnabled()
  })

  it('says why the server refused, by reason, with no report', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    const notReady =
      (state: 'working' | 'needsYou' | 'inputNotEmpty' | 'inputUnreadable' | 'noCommands' | 'effortNotConfirmed') =>
      () =>
        errorAnswer({ kind: 'chat-not-ready', state, message: 'Not ready', requestId: 'r-409' }, 409)
    const gone = () =>
      errorAnswer({ kind: 'not-found', path: `/api/chats/${plan}`, message: 'Not found', requestId: 'r-404' }, 404)
    for (const [answer, line] of [
      [notReady('working'), 'Wait until the chat is idle'],
      [notReady('needsYou'), 'The chat needs you on the Mac'],
      [notReady('inputNotEmpty'), 'Clear the message box on the Mac first'],
      [notReady('inputUnreadable'), 'Could not change the effort'],
      [notReady('noCommands'), 'Could not change the effort'],
      [notReady('effortNotConfirmed'), 'Could not change the effort'],
      [gone, 'That chat is gone'],
    ] as const) {
      fakes.list.answerEffort(answer)
      await userEvent.click(chip('Opus 5.5 · medium effort'))
      // The line of the last miss leaves as the menu opens again.
      expect(page.getByRole('status').getByText(/./).elements()).toHaveLength(0)
      await userEvent.click(choice('high'))
      await expect.element(page.getByRole('status').getByText(line, { exact: true })).toBeVisible()
      expect(page.getByRole('menuitemradio').elements()).toHaveLength(0)
      await expect.element(chip('Opus 5.5 · medium effort')).toBeVisible()
    }
    expect(getReports()).toEqual([])
  })

  it('reports a server fault by kind and status only', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    fakes.list.answerEffort(() =>
      errorAnswer({ kind: 'internal', message: 'boom in deep dive', requestId: 'r-500' }, 500),
    )
    await userEvent.click(chip('Opus 5.5 · medium effort'))
    await userEvent.click(choice('high'))
    await expect.element(page.getByRole('status').getByText('Could not change the effort')).toBeVisible()
    const reports = getReports()
    expect(reports.map((r) => r.error.message)).toEqual(['An effort change missed: internal 500'])
    expect(JSON.stringify(reports.map((r) => [r.error.message, r.error.stack]))).not.toContain(plan)
  })

  it('gives a Codex chat no picker (W8)', async () => {
    withChats()
    await tapWorkspaces(phone)
    await tapChat('drift check')
    await expect.element(page.getByText('drift check', { exact: true }).first()).toBeVisible()
    expect(page.getByRole('button', { name: /^Model:/ }).elements()).toHaveLength(0)
    // A Claude chat of the same workspace has it.
    await userEvent.click(page.getByRole('button', { name: 'Workspaces' }).first())
    await tapChat('plan the slice')
    await expect.element(chip('Opus 5.5 · medium effort')).toBeVisible()
  })
})
