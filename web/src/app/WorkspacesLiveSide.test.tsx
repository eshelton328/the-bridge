import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { errorAnswer, type FakeTranscriptServer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { type FakeSideServer, fakeSideServer } from '../lib/fakeSideServer.ts'
import { fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// Backend #456, #460: a live Claude chat's Side chat, in the phone's sheet (M5), the tablet's sheet (T2), beside the
// desktop's chat (D2) and inside its pane of the workbench (D5), posts `POST /api/chats/:chat/side` with the question
// only and streams the answer from `GET /api/chats/:chat/side/:side/events`: the answer grows as it comes and the main
// chat gets nothing. The composer has no paperclip and the pane has no "Open as its own pane", as no route takes them.
// A Codex chat and a shell, which the server refuses (409 noSession), have no Side chat. Each miss is one line under
// the composer with the question back in the box; a 5xx is reported with the step, the kind and the status only. An
// answer that fails, stops at the server's 2 minutes, is cut or that the server no longer has says so. While a
// question waits, the composer's Stop posts `POST /api/chats/:chat/side/:side/stop` (backend #465): the answer ends
// `stopped` with its text so far, and a stop that misses is a quiet line with no report. Each test takes
// the owner's path: the app with no URL, then Workspaces, with the contract-checked fakes as the server; nothing reaches
// a real server.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const orchard = 'test-box/w-orchard'
const meadow = 'test-box/w-meadow'
const sketch = 'test-box/c1'
const notes = 'test-box/c2'
const brief = 'test-box/c3'
const logs = 'test-box/c4'

const summary = (id: string, title: string, kind: 'claude' | 'codex' | 'shell' = 'claude') => ({
  id,
  kind,
  title,
  model: kind === 'claude' ? 'claude-opus-5-5' : kind === 'codex' ? 'gpt-5.5' : 'zsh',
  contextUsed: null,
  modelId: kind === 'claude' ? ('opus' as const) : null,
  effort: null,
  pane: `${id}-pane`,
  status: 'idle' as const,
  parent: null,
})
const list = {
  machine: 'test-box',
  workspaces: [
    { id: orchard, label: 'orchard', chats: [summary(sketch, 'sketch the plan'), summary(notes, 'tidy the notes')] },
    {
      id: meadow,
      label: 'meadow',
      chats: [summary(brief, 'draft the brief', 'codex'), summary(logs, 'tail logs', 'shell')],
    },
  ],
}

type Fakes = { chats: FakeTranscriptServer; side: FakeSideServer }

/** The stubbed server: the fakes' routes, and a rejection for anything else. */
function withChats(): Fakes {
  const chats = fakeTranscriptServer()
  for (const c of list.workspaces.flatMap((w) => w.chats)) chats.set(c.id, [])
  const workspaces = fakeWorkspacesServer(chats, list)
  const side = fakeSideServer()
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const answer = side.handle(path, init) ?? chats.handle(path, init) ?? workspaces.handle(path, init)
      if (answer !== undefined) return Promise.resolve(answer)
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
  return { chats, side }
}

let view: { unmount: () => Promise<void> } | undefined

stubLiveServer()
answerLateServerReads()

afterEach(async () => {
  await view?.unmount()
  view = undefined
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  queryClient.clear()
  resetAllStores()
  await setViewport(1512, 982)
})

type Size = 'phone' | 'tablet' | 'desktop' | 'workbench'
const sizes: readonly Size[] = ['phone', 'tablet', 'desktop', 'workbench']
const viewports = { phone: [390, 844], tablet: [744, 1133], desktop: [1512, 982], workbench: [1512, 982] } as const

/** The titles of the workbench's panes, by their Maximise or Unzoom buttons, in the page's order. */
const drawn = () =>
  [...document.querySelectorAll('button[aria-label^="Maximise "], button[aria-label^="Unzoom "]')].map((b) =>
    (b.getAttribute('aria-label') ?? '').replace(/^(Maximise|Unzoom) /, ''),
  )

/**
 * Opens the app at `size` with no URL, taps Workspaces in the tab bar and opens `title`: a tap on its row on the phone,
 * the tablet and the desktop's sidebar; the desktop's workbench hides the sidebar and shows it in a pane.
 */
async function openChat(size: Size, title: string) {
  const [w, h] = viewports[size]
  await setViewport(w, h)
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
  view = await testRender(<RouterProvider router={router} />)
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  expect(router.state.location.searchStr).toBe('')
  await expect.element(page.getByText('sketch the plan', { exact: true }).first()).toBeVisible()
  if (size === 'workbench') {
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    if (title === 'draft the brief' || title === 'tail logs')
      await userEvent.click(page.getByRole('tab', { name: /meadow/ }))
    await expect.poll(drawn).toContain(title)
    return
  }
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
}

/** Opens `title`'s actions: the phone's sheet, or the tablet's or the desktop's menu. */
async function openActions(size: Size, title: string) {
  await userEvent.click(page.getByRole('button', { name: `${title} actions` }).first())
  if (size === 'phone') await expect.element(page.getByText('New chat', { exact: true })).toBeVisible()
  else await expect.element(page.getByRole('menuitem', { name: 'New chat' })).toBeVisible()
}

/** The Side chat row of the open actions: the phone's sheet names it as M4 does, the menus as D2b. */
const sideRow = (size: Size) =>
  size === 'phone'
    ? page.getByText('Side chat', { exact: true })
    : page.getByRole('menuitem', { name: 'Side chat (/btw)', exact: true })

/** The open side chat: the sheet on the phone and the tablet, the panel beside the chat or inside its pane. */
const sideChat = (size: Size) =>
  size === 'phone' || size === 'tablet'
    ? page.getByRole('dialog', { name: 'Side chat' })
    : page.getByRole('complementary', { name: 'Side chat' })

const questionBox = (size: Size) => sideChat(size).getByRole('textbox', { name: 'Ask a side question' })

/** Opens `title`'s side chat from its actions. */
async function openSide(size: Size, title: string) {
  await openActions(size, title)
  await userEvent.click(sideRow(size))
  await expect.element(questionBox(size)).toBeVisible()
}

/** Types `question` in the open side chat and sends it. */
async function ask(size: Size, question: string) {
  await userEvent.fill(questionBox(size), question)
  await userEvent.click(sideChat(size).getByRole('button', { name: 'Send', exact: true }))
}

const notReady = (state: 'noSession' | 'sideBusy') => () =>
  errorAnswer({ kind: 'chat-not-ready', state, message: 'not now', requestId: 'r-409' }, 409)

describe('Side chat on a live Claude chat (backend #460)', () => {
  for (const size of sizes)
    it(`asks the question only and streams the answer, which never enters the chat, on the ${size}`, async () => {
      const fakes = withChats()
      await openChat(size, 'sketch the plan')
      await openSide(size, 'sketch the plan')
      const side = sideChat(size)
      await expect
        .element(side.getByText('Nothing here enters sketch the plan. Close it and the main chat carries on.'))
        .toBeVisible()
      // No route takes a file or a pane of its own.
      expect(side.getByRole('button', { name: 'Attach a file' }).elements()).toHaveLength(0)
      expect(side.getByRole('button', { name: /Open as its own pane/ }).elements()).toHaveLength(0)
      await ask(size, '  Why did the build fail?  ')
      await expect
        .poll(() => fakes.side.asks)
        .toEqual([{ chat: sketch, body: { question: 'Why did the build fail?' } }])
      await expect.element(side.getByText('Why did the build fail?', { exact: true })).toBeVisible()
      await expect.element(side.getByText('Answering…', { exact: true })).toBeVisible()
      await expect.poll(() => fakes.side.opens).toHaveLength(1)
      const [id] = fakes.side.sides
      if (id === undefined) throw new Error('no side answer')
      fakes.side.change(id, { text: 'The build ' })
      await expect.element(side.getByText('The build', { exact: true })).toBeVisible()
      fakes.side.change(id, { text: 'The build needs marker-5150.', state: 'done' })
      await expect.element(side.getByText('The build needs marker-5150.', { exact: true })).toBeVisible()
      await expect.element(side.getByText('Answering…', { exact: true })).not.toBeInTheDocument()
      await expect.element(side.getByRole('button', { name: 'Copy' })).toBeVisible()
      await expect.element(questionBox(size)).toHaveValue('')
      // The main chat gets nothing: no prompt, and its transcript shows neither the question nor the answer.
      expect(fakes.chats.prompts).toEqual([])
      expect(page.getByText('The build needs marker-5150.', { exact: true }).elements()).toHaveLength(1)
      expect(page.getByText('Why did the build fail?', { exact: true }).elements()).toHaveLength(1)
    })

  for (const size of sizes)
    it(`offers no Side chat for a Codex chat or a shell, which the server refuses, on the ${size}`, async () => {
      const fakes = withChats()
      await openChat(size, 'draft the brief')
      await openActions(size, 'draft the brief')
      expect(sideRow(size).elements()).toHaveLength(0)
      await userEvent.keyboard('{Escape}')
      if (size === 'workbench') {
        await expect.poll(drawn).toContain('tail logs')
        await openActions(size, 'tail logs')
        expect(sideRow(size).elements()).toHaveLength(0)
      }
      expect(fakes.side.asks).toEqual([])
    })

  it('opens the side chat inside the pane it belongs to in the workbench (D5)', async () => {
    withChats()
    await openChat('workbench', 'tidy the notes')
    await openSide('workbench', 'tidy the notes')
    // The smallest box round this pane's Maximise that holds the side chat holds no other pane.
    let pane = page.getByRole('button', { name: 'Maximise tidy the notes' }).element().parentElement
    while (pane !== null && pane.querySelector('aside[aria-label="Side chat"]') === null) pane = pane.parentElement
    expect(pane).not.toBeNull()
    expect(pane?.querySelector('button[aria-label="Maximise sketch the plan"]')).toBeNull()
    await expect
      .element(
        sideChat('workbench').getByText('Nothing here enters tidy the notes. Close it and the main chat carries on.'),
      )
      .toBeVisible()
  })

  it('asks one question of a chat at a time, and the next after the answer', async () => {
    const fakes = withChats()
    await openChat('desktop', 'sketch the plan')
    await openSide('desktop', 'sketch the plan')
    await ask('desktop', 'First?')
    await expect.poll(() => fakes.side.opens).toHaveLength(1)
    await ask('desktop', 'Second?')
    await expect
      .element(sideChat('desktop').getByText('Not asked — a side question is still answering', { exact: true }))
      .toBeVisible()
    await expect.element(questionBox('desktop')).toHaveValue('Second?')
    expect(fakes.side.asks).toHaveLength(1)
    const [id] = fakes.side.sides
    if (id === undefined) throw new Error('no side answer')
    fakes.side.change(id, { text: 'One.', state: 'done' })
    await expect.element(sideChat('desktop').getByText('One.', { exact: true })).toBeVisible()
    await userEvent.click(sideChat('desktop').getByRole('button', { name: 'Send', exact: true }))
    await expect.poll(() => fakes.side.asks).toHaveLength(2)
    expect(fakes.side.asks[1]).toEqual({ chat: sketch, body: { question: 'Second?' } })
  })

  for (const [answer, text] of [
    [notReady('noSession'), 'Not asked — the chat has no saved turn yet; send it a message first'],
    [notReady('sideBusy'), 'Not asked — a side question is still answering'],
    [
      () => errorAnswer({ kind: 'not-found', path: '/api/x', message: 'Not found', requestId: 'r-404' }, 404),
      'Not asked — that chat is gone',
    ],
  ] as const)
    it(`says "${text}" and keeps the question in the box`, async () => {
      clearReports()
      onTestFinished(clearReports)
      const fakes = withChats()
      fakes.side.answerAsks(answer)
      await openChat('phone', 'sketch the plan')
      await openSide('phone', 'sketch the plan')
      await ask('phone', 'Is it safe?')
      await expect.element(sideChat('phone').getByText(text, { exact: true })).toBeVisible()
      await expect.element(questionBox('phone')).toHaveValue('Is it safe?')
      // No bubble of the question stays in the transcript: only the box holds it.
      const shown = sideChat('phone')
        .getByText('Is it safe?', { exact: true })
        .elements()
        .filter((e) => e.tagName !== 'TEXTAREA')
      expect(shown).toHaveLength(0)
      expect(getReports()).toEqual([])
    })

  it('says herdr-unavailable for the 503 of a server that runs no side questions, and reports the kind only', async () => {
    clearReports()
    onTestFinished(clearReports)
    const fakes = withChats()
    fakes.side.answerAsks(() =>
      errorAnswer({ kind: 'herdr-unavailable', message: 'herdr does not answer', requestId: 'r-503' }, 503),
    )
    await openChat('tablet', 'sketch the plan')
    await openSide('tablet', 'sketch the plan')
    await ask('tablet', 'Why marker-5150?')
    await expect.element(sideChat('tablet').getByText('Not asked — herdr-unavailable', { exact: true })).toBeVisible()
    await expect.element(sideChat('tablet').getByRole('button', { name: 'Retry' })).toBeVisible()
    await expect.element(questionBox('tablet')).toHaveValue('Why marker-5150?')
    const messages = getReports().map((r) => r.error.message)
    expect(messages).toEqual(["A side question's ask missed: herdr-unavailable (503)"])
    expect(JSON.stringify(getReports())).not.toMatch(/marker-5150|sketch/)
  })

  for (const [next, text] of [
    [{ state: 'failed' }, 'No answer — the side question failed'],
    [{ text: 'Half of it', state: 'timedOut' }, 'Stopped after 2 minutes'],
    [{ text: 'All of it', cut: true, state: 'done' }, 'Cut — the answer is longer than the page shows'],
  ] as const)
    it(`says "${text}" for an answer that ends ${next.state}${'cut' in next ? ' and cut' : ''}`, async () => {
      const fakes = withChats()
      await openChat('desktop', 'sketch the plan')
      await openSide('desktop', 'sketch the plan')
      await ask('desktop', 'What now?')
      await expect.poll(() => fakes.side.opens).toHaveLength(1)
      const [id] = fakes.side.sides
      if (id === undefined) throw new Error('no side answer')
      fakes.side.change(id, next)
      await expect.element(sideChat('desktop').getByText(text, { exact: true })).toBeVisible()
      if ('text' in next) await expect.element(sideChat('desktop').getByText(next.text, { exact: true })).toBeVisible()
      await expect.element(sideChat('desktop').getByText('Answering…', { exact: true })).not.toBeInTheDocument()
    })

  for (const size of ['phone', 'desktop'] as const)
    it(`stops an answer mid-way with the composer's Stop and keeps its text, on the ${size}`, async () => {
      const fakes = withChats()
      await openChat(size, 'sketch the plan')
      await openSide(size, 'sketch the plan')
      const side = sideChat(size)
      // No question waits: the composer draws no Stop.
      expect(side.getByRole('button', { name: 'Stop', exact: true }).elements()).toHaveLength(0)
      await ask(size, 'How long is it?')
      await expect.poll(() => fakes.side.opens).toHaveLength(1)
      const [id] = fakes.side.sides
      if (id === undefined) throw new Error('no side answer')
      fakes.side.change(id, { text: 'Half an answer' })
      await expect.element(side.getByText('Half an answer', { exact: true })).toBeVisible()
      await userEvent.click(side.getByRole('button', { name: 'Stop', exact: true }))
      await expect.poll(() => fakes.side.stops).toEqual([id])
      await expect.element(side.getByText('Stopped — the answer ends here', { exact: true })).toBeVisible()
      await expect.element(side.getByText('Half an answer', { exact: true })).toBeVisible()
      await expect.element(side.getByRole('button', { name: 'Stop', exact: true })).not.toBeInTheDocument()
      // The main chat is neither prompted nor stopped.
      expect(fakes.chats.prompts).toEqual([])
      expect(fakes.chats.stops).toEqual([])
      // The chat takes its next question.
      await ask(size, 'And now?')
      await expect.poll(() => fakes.side.asks).toHaveLength(2)
    })

  for (const size of ['phone', 'desktop'] as const)
    it(`says a stop that missed in a quiet line and reports nothing, on the ${size}`, async () => {
      clearReports()
      onTestFinished(clearReports)
      const fakes = withChats()
      fakes.side.answerStops(() =>
        errorAnswer(
          { kind: 'herdr-unavailable', message: 'herdr does not answer marker-5150', requestId: 'r-503' },
          503,
        ),
      )
      await openChat(size, 'sketch the plan')
      await openSide(size, 'sketch the plan')
      const side = sideChat(size)
      await ask(size, 'Why marker-5150?')
      await expect.poll(() => fakes.side.opens).toHaveLength(1)
      const [id] = fakes.side.sides
      if (id === undefined) throw new Error('no side answer')
      await userEvent.click(side.getByRole('button', { name: 'Stop', exact: true }))
      await expect.element(side.getByText('Not stopped — the server answered 503', { exact: true })).toBeVisible()
      expect(fakes.side.stops).toEqual([id])
      // The answer still answers, and ends on its own.
      await expect.element(side.getByRole('button', { name: 'Stop', exact: true })).toBeVisible()
      fakes.side.change(id, { text: 'It ended.', state: 'done' })
      await expect.element(side.getByText('It ended.', { exact: true })).toBeVisible()
      expect(getReports()).toEqual([])
      expect(fakes.chats.stops).toEqual([])
    })

  it('says the answer is gone when the server lost it in a restart', async () => {
    const fakes = withChats()
    await openChat('desktop', 'sketch the plan')
    await openSide('desktop', 'sketch the plan')
    await ask('desktop', 'Still there?')
    await expect.poll(() => fakes.side.opens).toHaveLength(1)
    const [id] = fakes.side.sides
    if (id === undefined) throw new Error('no side answer')
    fakes.side.change(id, { text: 'Part' })
    await expect.element(sideChat('desktop').getByText('Part', { exact: true })).toBeVisible()
    fakes.side.forget(id)
    fakes.side.drop(id)
    // The page connects again after the server's retry time and finds no answer.
    await expect
      .element(sideChat('desktop').getByText('This answer is gone — the server restarted', { exact: true }), {
        timeout: 10_000,
      })
      .toBeVisible()
    await expect.element(sideChat('desktop').getByText('Part', { exact: true })).toBeVisible()
  })

  it('connects again after a drop and shows the answer as it is then', async () => {
    const fakes = withChats()
    await openChat('desktop', 'sketch the plan')
    await openSide('desktop', 'sketch the plan')
    await ask('desktop', 'Again?')
    await expect.poll(() => fakes.side.opens).toHaveLength(1)
    const [id] = fakes.side.sides
    if (id === undefined) throw new Error('no side answer')
    fakes.side.drop(id)
    fakes.side.change(id, { text: 'Written while dropped.' })
    await expect.poll(() => fakes.side.opens, { timeout: 10_000 }).toHaveLength(2)
    await expect.element(sideChat('desktop').getByText('Written while dropped.', { exact: true })).toBeVisible()
  })
})
