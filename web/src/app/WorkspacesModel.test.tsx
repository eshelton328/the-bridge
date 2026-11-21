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
import { fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// W10: a live Claude chat's model chip restarts the chat with another model
// by resume (backend #386, #390, #391). Each test takes the owner's path: the
// app with no URL parameters, Workspaces, then a tap on the chat, with the
// contract-checked fakes as the server. A model pick asks first; only Restart
// posts `{ model, confirm }` to the model route, never /model as a prompt.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const drift = 'mac-mini/c4'
const session = '6f1f7a52-3c1e-4c4e-9a43-0d8c5e1b2a77'

const summary = (id: string, kind: 'claude' | 'codex', title: string) => ({
  id,
  kind,
  title,
  model: kind === 'codex' ? 'gpt-5.5' : 'claude-opus-5-5',
  contextUsed: null,
  modelId: kind === 'claude' ? 'opus' : null,
  effort: kind === 'claude' ? 'medium' : 'xhigh',
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
      chats: [summary(plan, 'claude', 'plan the slice'), summary(drift, 'codex', 'drift check')],
    },
  ],
}

/** The stubbed server; with `hold`, each model restart waits for it. Every prompt the page posts is kept. */
function withChats(hold?: Promise<void>) {
  const chats = fakeTranscriptServer()
  chats.set(plan, [])
  const workspaces = fakeWorkspacesServer(chats, list)
  const prompts: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      if (path.endsWith('/prompt') || path.endsWith('/command'))
        prompts.push(typeof init?.body === 'string' ? init.body : 'a body')
      if (hold !== undefined && path.endsWith('/model'))
        return hold.then(() => workspaces.handle(path, init) ?? Promise.reject(new TypeError('no model answer')))
      const answer = chats.handle(path, init) ?? workspaces.handle(path, init)
      if (answer !== undefined) return Promise.resolve(answer)
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
  return { list: workspaces, prompts }
}

/** A gate the test opens: the held restarts answer once `release` runs. */
function gate() {
  let release: () => void = () => undefined
  const hold = new Promise<void>((resolve) => {
    release = resolve
  })
  return { hold, release }
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
const family = (name: string) => page.getByRole('menuitemradio', { name, exact: true })
const effortRow = (level: string) => page.getByRole('menuitemradio', { name: new RegExp(`^${level} effort`) })
const rows = () => page.getByRole('menuitemradio').elements()
const families = ['Fable', 'Opus', 'Sonnet', 'Haiku']
const line = (text: string) => page.getByRole('status').getByText(text, { exact: true })
const restart = () => page.getByRole('button', { name: 'Restart', exact: true })
const question = (model: string) =>
  page.getByText(`Restart the chat with ${model}? It resumes the same conversation.`, { exact: true })
const box = () => page.getByRole('textbox').first()
const menuGone = () => expect.poll(() => page.getByRole('menuitemradio').elements()).toHaveLength(0)

/** Picks `model` in the chip's menu: the menu closes and the question shows. */
async function pickModel(from: string, model: string) {
  await userEvent.click(chip(from))
  await userEvent.click(family(model))
  await expect.element(question(model)).toBeVisible()
}

const notReady = (state: string) => () =>
  new Response(JSON.stringify({ error: { kind: 'chat-not-ready', state, message: 'Not ready', requestId: 'r-409' } }), {
    status: 409,
    headers: { 'content-type': 'application/json' },
  })

describe("a live chat's model picker (W10)", () => {
  for (const [name, size] of [
    ['the phone', phone],
    ['the desktop', desktop],
  ] as const)
    it(`restarts the chat with Sonnet on ${name}, keeping the draft`, async () => {
      const { hold, release } = gate()
      const fakes = withChats(hold)
      await tapWorkspaces(size)
      await tapChat('plan the slice')
      await userEvent.fill(box(), 'a draft to keep')
      await userEvent.click(chip('Opus 5.5 · medium effort'))
      // The model section first: the four families, the list's one checked; then the effort rows.
      expect(
        rows()
          .map((r) => r.textContent)
          .slice(0, 4),
      ).toEqual(families)
      expect(
        rows()
          .filter((r) => r.getAttribute('aria-checked') === 'true')
          .map((r) => r.textContent),
      ).toEqual(['Opus'])
      await userEvent.click(family('Sonnet'))
      await expect.element(question('Sonnet')).toBeVisible()
      // The pick only asks.
      expect(fakes.list.models).toEqual([])
      await userEvent.click(restart())
      // While the restart runs: the chip says so, the composer is off and says why, and so does every effort row.
      await expect.element(chip('Restarting…')).toBeVisible()
      await expect.element(page.getByRole('textbox', { name: 'The chat is restarting' })).toBeDisabled()
      await userEvent.click(chip('Restarting…'))
      for (const level of ['low', 'medium', 'high', 'xhigh']) await expect.element(effortRow(level)).toBeDisabled()
      await expect.element(line('The chat is restarting')).toBeVisible()
      await userEvent.keyboard('{Escape}')
      await menuGone()
      release()
      await expect.element(chip('Sonnet · medium effort')).toBeVisible()
      expect(fakes.list.models.map((m) => [m.chat, m.body])).toEqual([[plan, { model: 'sonnet', confirm: plan }]])
      // The same chat, its draft kept, and the composer back on.
      await expect.element(box()).toHaveValue('a draft to keep')
      await expect.element(box()).toBeEnabled()
      expect(fakes.list.chats().find((c) => c.id === plan)?.modelId).toBe('sonnet')
      // The list's family is checked now, and the effort still sets.
      await userEvent.click(chip('Sonnet · medium effort'))
      expect(
        rows()
          .filter((r) => r.getAttribute('aria-checked') === 'true')
          .map((r) => r.textContent),
      ).toEqual(['Sonnet'])
      await userEvent.click(effortRow('high'))
      await expect.element(chip('Sonnet · high effort')).toBeVisible()
      expect(fakes.list.efforts.map((e) => [e.chat, e.body])).toEqual([[plan, { effort: 'high' }]])
      // Never a prompt or a command: only the routes.
      expect(fakes.prompts).toEqual([])
      expect(getReports()).toEqual([])
    })

  it('posts nothing on Cancel', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    await pickModel('Opus 5.5 · medium effort', 'Haiku')
    await userEvent.click(page.getByRole('button', { name: 'Cancel', exact: true }))
    await expect.element(question('Haiku')).not.toBeInTheDocument()
    await expect.element(chip('Opus 5.5 · medium effort')).toBeVisible()
    expect(fakes.list.models).toEqual([])
  })

  it('offers no restart while the chat works', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    await pickModel('Opus 5.5 · medium effort', 'Haiku')
    fakes.list.setStatus(plan, 'working')
    await expect.element(page.getByText('Working', { exact: true }).first()).toBeVisible()
    await expect.element(restart()).toBeDisabled()
    await expect.element(line('Wait until the chat is idle')).toBeVisible()
    await userEvent.click(chip('Opus 5.5 · medium effort'))
    for (const name of families) await expect.element(family(name)).toBeDisabled()
    expect(fakes.list.models).toEqual([])
  })

  it('says why the server refused, by reason, with no report', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    const gone = () =>
      errorAnswer({ kind: 'not-found', path: `/api/chats/${plan}`, message: 'Not found', requestId: 'r-404' }, 404)
    for (const [answer, said] of [
      [notReady('skipsPermissions'), 'This chat skips permissions; change the model on the Mac'],
      [notReady('launchArgsUnknown'), 'Change the model on the Mac; the bridge cannot read how this chat started'],
      [notReady('folderChanged'), "The chat's folder changed; change the model on the Mac"],
      [notReady('restarting'), 'The chat is restarting'],
      [notReady('working'), 'Wait until the chat is idle'],
      [notReady('needsYou'), 'The chat needs you on the Mac'],
      [gone, 'That chat is gone'],
    ] as const) {
      fakes.list.answerModel(answer)
      await pickModel('Opus 5.5 · medium effort', 'Sonnet')
      await userEvent.click(restart())
      await expect.element(line(said)).toBeVisible()
      await expect.element(chip('Opus 5.5 · medium effort')).toBeVisible()
      await expect.element(box()).toBeEnabled()
    }
    // sameModel has nothing to do: no line.
    fakes.list.answerModel(notReady('sameModel'))
    await pickModel('Opus 5.5 · medium effort', 'Sonnet')
    await userEvent.click(restart())
    await expect.element(chip('Opus 5.5 · medium effort')).toBeVisible()
    await expect.poll(() => fakes.list.models).toHaveLength(8)
    expect(page.getByRole('status').getByText(/./).elements()).toHaveLength(0)
    expect(getReports()).toEqual([])
  })

  it('shows the resume command when the chat stopped and did not restart', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    fakes.list.answerModel(
      () =>
        new Response(JSON.stringify({ state: 'failed', session }), {
          status: 502,
          headers: { 'content-type': 'application/json' },
        }),
    )
    await pickModel('Opus 5.5 · medium effort', 'Sonnet')
    await userEvent.click(restart())
    const dialog = page.getByRole('dialog', { name: 'The chat did not restart' })
    await expect
      .element(dialog.getByText('The chat stopped and did not restart. On the Mac, run this in its pane:'))
      .toBeVisible()
    await expect.element(dialog.getByRole('textbox', { name: 'Command' })).toHaveValue(`claude --resume ${session}`)
    // One post only: the page tries nothing again.
    expect(fakes.list.models).toHaveLength(1)
    const reports = getReports()
    expect(reports.map((r) => r.error.message)).toEqual(['A model restart missed: failed 502'])
    expect(JSON.stringify(reports.map((r) => [r.error.message, r.error.stack]))).not.toContain(session)
    await userEvent.click(dialog.getByRole('button', { name: 'Close' }))
    await expect.element(dialog).not.toBeInTheDocument()
  })

  it('says the chat runs as before when herdr gave a bad reply', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    fakes.list.answerModel(() => errorAnswer({ kind: 'herdr-bad-reply', message: 'no exit', requestId: 'r-502' }, 502))
    await pickModel('Opus 5.5 · medium effort', 'Sonnet')
    await userEvent.click(restart())
    await expect.element(line('The chat did not restart; it runs as before')).toBeVisible()
    expect(page.getByRole('dialog').elements()).toHaveLength(0)
    expect(getReports().map((r) => r.error.message)).toEqual(['A model restart missed: herdr-bad-reply 502'])
  })

  it('keeps Restarting… for a starting chat until the list shows it idle', async () => {
    const fakes = withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    fakes.list.answerModel(
      () =>
        new Response(JSON.stringify({ state: 'starting', chat: plan }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    )
    await pickModel('Opus 5.5 · medium effort', 'Sonnet')
    await userEvent.click(restart())
    await expect.element(chip('Restarting…')).toBeVisible()
    await expect.poll(() => fakes.list.models).toHaveLength(1)
    // A list that shows the chat working keeps it restarting.
    fakes.list.setStatus(plan, 'working')
    await expect.element(page.getByText('Working', { exact: true }).first()).toBeVisible()
    await expect.element(chip('Restarting…')).toBeVisible()
    await expect.element(page.getByRole('textbox', { name: 'The chat is restarting' })).toBeDisabled()
    // workspaces.changed with the chat idle ends it.
    fakes.list.setStatus(plan, 'idle')
    await expect.element(chip('Opus 5.5 · medium effort')).toBeVisible()
    await expect.element(box()).toBeEnabled()
    expect(fakes.list.models).toHaveLength(1)
  })

  it('says the chat needs the owner after a restart that needs him', async () => {
    const fakes = withChats()
    await tapWorkspaces(desktop)
    await tapChat('plan the slice')
    fakes.list.answerModel(
      () =>
        new Response(JSON.stringify({ state: 'needsYou', chat: plan }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    )
    await pickModel('Opus 5.5 · medium effort', 'Haiku')
    await userEvent.click(restart())
    await expect.element(line('The chat needs you on the Mac')).toBeVisible()
    await expect.element(chip('Haiku · medium effort')).toBeVisible()
  })

  it('gives a Codex chat no picker', async () => {
    withChats()
    await tapWorkspaces(phone)
    await tapChat('drift check')
    expect(page.getByRole('button', { name: /^Model:/ }).elements()).toHaveLength(0)
  })
})
