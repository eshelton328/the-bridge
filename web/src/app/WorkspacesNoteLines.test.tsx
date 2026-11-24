import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { clearReports, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { type FakeTranscriptServer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'

// A harness note (`NoteEntry`, R46: a background task's report, a Stop hook)
// and a message from another chat (a `peer` note, R55) never look like the
// owner's own message. Each test
// takes the owner's path: it opens the app with no URL parameters, taps
// Workspaces and a live chat (the phone and the tablet) or shows the
// workbench's pane (the desktop), with a stubbed server (`fetch`) whose
// transcript routes are the contract-checked fake
// (lib/fakeTranscriptServer.ts). The owner's prompt is his bubble; a task or
// hook note is a muted line with its kind's icon and its text, with no bubble
// and not the bubble's colour, its text readable on the pane (4.5:1). A peer
// note is the library's peer message: an amber start bar and "From <name>",
// its text readable, no bubble (R55).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
// One live Claude chat, alone in its workspace's layout.
const chats = [
  {
    id: plan,
    kind: 'claude',
    title: 'plan the slice',
    model: 'claude-opus-5-5',
    contextUsed: null,
    modelId: null,
    effort: null,
    pane: `${plan}-pane`,
    status: 'working',
    parent: null,
  },
]
const layout = JSON.stringify({
  workspace,
  tabs: [
    {
      id: 'mac-mini/w-live:t1',
      label: 'main',
      active: true,
      root: { kind: 'pane', chat: plan },
      focusedChat: plan,
      zoomed: false,
      chats,
    },
  ],
})

/** The stubbed server: the workspaces, their layout, the event stream and the transcript fake's routes. */
function fakeServer(transcripts: FakeTranscriptServer) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const transcript = transcripts.handle(path, init)
      if (transcript !== undefined) return Promise.resolve(transcript)
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

let view: { unmount: () => Promise<void> } | undefined
let router: ReturnType<typeof createRouter> | undefined

// Each test stubs fetch itself; between tests, a read that a page started after its test ended gets the stubbed
// server, never the one on this machine (liveServerStub.ts).
stubLiveServer()

// A read that a page starts after its test ended gets no answer, not the real server (lib/lateServerReads.ts).
answerLateServerReads()

afterEach(async () => {
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

/** Opens the app at `size` and taps Workspaces in the rail or the tab bar; the URL has no parameters. */
async function tapWorkspaces(size: readonly [number, number]) {
  await setViewport(size[0], size[1])
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

const devices = [
  { name: 'the phone', size: [390, 844] },
  { name: 'the tablet', size: [744, 1133] },
] as const

/** A transcript fake with plan's transcript as `entries`. */
function withPlan(entries: TranscriptEntry[]) {
  const server = fakeTranscriptServer()
  server.set(plan, entries)
  fakeServer(server)
  return server
}

const prompt: TranscriptEntry = { type: 'user', id: 'u1', text: 'Check the build, please', cut: false }
const reply: TranscriptEntry = { type: 'assistant', id: 'a1', text: 'Started the build check.', cut: false }
const notes: TranscriptEntry[] = [
  { type: 'note', id: 'n1', kind: 'task', text: 'Background task finished: build check passed' },
  { type: 'note', id: 'n3', kind: 'hook', text: 'Stop hook: reply rewritten' },
]
const noteLines = [
  { kind: 'task', label: 'Task', text: 'Background task finished: build check passed' },
  { kind: 'hook', label: 'Hook', text: 'Stop hook: reply rewritten' },
]

/** The message bubbles in `scope`: the library Message's root (an `article`). */
const bubbles = (scope: Element) => [...scope.querySelectorAll('article.message__root')]

/** A colour as its sRGB channels and alpha, read through a canvas so any CSS colour syntax works. */
function channels(colour: string): [number, number, number, number] {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext('2d')
  if (context === null) throw new Error('no canvas')
  context.fillStyle = colour
  context.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data
  return [r, g, b, a]
}

/** The first background behind `element` that is not transparent: its own or an ancestor's. */
function backdrop(element: Element): string {
  for (let node: Element | null = element; node !== null; node = node.parentElement) {
    const colour = getComputedStyle(node).backgroundColor
    if (channels(colour)[3] > 0) return colour
  }
  return getComputedStyle(document.body).backgroundColor
}

const luminance = (colour: string) => {
  const [r, g, b] = channels(colour).map((c) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0)
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05)
}

/** Fails unless `scope` shows the prompt as the owner's bubble and each note as its own muted line. */
function expectNotesApart(scope: Element) {
  const owner = bubbles(scope).filter((b) => b.textContent.includes('Check the build, please'))
  expect(owner).toHaveLength(1)
  const [bubble] = owner
  if (bubble === undefined) throw new Error('no bubble')
  const bubbleColour = backdrop(bubble)
  const lines = [...scope.querySelectorAll('[data-note-kind]')]
  expect(lines.map((l) => l.getAttribute('data-note-kind'))).toEqual(noteLines.map((n) => n.kind))
  for (const [i, note] of noteLines.entries()) {
    const line = lines[i]
    if (line === undefined) throw new Error(`no ${note.kind} note`)
    // Its kind's icon, named by its label, and its text.
    const icon = line.querySelector('svg[role="img"]')
    expect(icon?.querySelector('title')?.textContent).toBe(note.label)
    // The icon's title is its name, so the line reads as the label and then the text.
    expect(line.textContent).toBe(`${note.label}${note.text}`)
    // No bubble: not a Message, not inside one, and no bubble's text holds it.
    expect(line.closest('article')).toBeNull()
    expect(line.querySelector('article')).toBeNull()
    expect(bubbles(scope).some((b) => b.textContent.includes(note.text))).toBe(false)
    // Not the bubble's colour: the line has no fill of its own, and what is behind it is the pane, not the bubble.
    expect(channels(getComputedStyle(line).backgroundColor)[3]).toBe(0)
    expect(channels(backdrop(line))).not.toEqual(channels(bubbleColour))
    // Muted, unlike the prompt's text, and still readable on the pane.
    const ink = getComputedStyle(line).color
    expect(channels(ink)).not.toEqual(channels(getComputedStyle(bubble).color))
    expect(contrast(ink, backdrop(line))).toBeGreaterThanOrEqual(4.5)
    // It stays inside the transcript.
    expect(line.getBoundingClientRect().right).toBeLessThanOrEqual(scope.getBoundingClientRect().right + 0.5)
  }
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth)
}

describe('a task or hook note in a live transcript (R46)', () => {
  for (const device of devices)
    it(`shows each note as a muted line with its icon and the prompt as the owner's bubble on ${device.name}`, async () => {
      withPlan([prompt, ...notes, reply])
      await tapWorkspaces(device.size)
      await tapChat('plan the slice')
      const chat = chatRegion('plan the slice')
      await expect.element(chat.getByText('Stop hook: reply rewritten')).toBeVisible()
      await expect.element(chat.getByRole('img', { name: 'Task' })).toBeVisible()
      await expect.element(chat.getByRole('img', { name: 'Hook' })).toBeVisible()
      expectNotesApart(chat.element())
      expect(getReports()).toEqual([])
    })

  it("shows each note as a muted line with its icon and the prompt as the owner's bubble on the desktop", async () => {
    withPlan([prompt, ...notes, reply])
    await tapWorkspaces([1512, 982])
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(page.getByText('Stop hook: reply rewritten')).toBeVisible()
    const pane = workbenchPane('plan the slice')
    if (pane === null) throw new Error('no pane')
    expectNotesApart(pane)
    expect(getReports()).toEqual([])
  })
})

// R55: made-up samples of the two ways another chat's message comes, as the server sends them (#454): a SendMessage
// peer message and a prompt typed in an `<agent-prompt>` wrapper, both a `peer` note with its `message`, and a peer
// note from a line with no text. The owner's typed text that only holds the tag stays his prompt: the server decides
// that (`claudeTranscript.test.ts`, line w3), so here it is a user entry and must stay his bubble.
const peerNotes: TranscriptEntry[] = [
  {
    type: 'note',
    id: 'p1',
    kind: 'peer',
    text: 'Message from sample-lab',
    message: {
      from: 'sample-lab',
      via: 'message',
      text: 'Port question: **5190** is in use. I recommend 5191.',
      cut: false,
    },
  },
  {
    type: 'note',
    id: 'p2',
    kind: 'peer',
    text: 'Message from sample-coord',
    message: { from: 'sample-coord', via: 'prompt', text: 'Build the three header options on port 5191.', cut: false },
  },
  { type: 'note', id: 'p3', kind: 'peer', text: 'Message from sample-inbox' },
]
const quoting: TranscriptEntry = {
  type: 'user',
  id: 'u2',
  text: 'Why did <agent-prompt from="sample-coord">hi</agent-prompt> show up?',
  cut: false,
}
const peers = [
  { name: 'From sample-lab', text: 'Port question: 5190 is in use. I recommend 5191.' },
  { name: 'From sample-coord', text: 'Build the three header options on port 5191.' },
  { name: 'From sample-inbox', text: undefined },
]

/** Fails unless each peer note in `scope` is a peer message: amber bar and label, readable text, never a bubble. */
function expectPeersApart(scope: Element) {
  const owner = bubbles(scope).filter(
    (b) => b.getAttribute('aria-labelledby') !== null && b.textContent.includes('Check the build, please'),
  )
  const [bubble] = owner
  if (bubble === undefined) throw new Error('no bubble')
  const bubbleFill = channels(getComputedStyle(bubble).backgroundColor)
  for (const peer of peers) {
    const article = [...scope.querySelectorAll('article')].find(
      (a) => a.querySelector('.message__name')?.textContent === peer.name,
    )
    if (article === undefined) throw new Error(`no ${peer.name}`)
    const style = getComputedStyle(article)
    // No bubble: no fill of its own, and the owner's bubbles never hold its text.
    expect(channels(style.backgroundColor)[3]).toBe(0)
    expect(channels(style.backgroundColor)).not.toEqual(bubbleFill)
    if (peer.text !== undefined)
      expect(
        bubbles(scope)
          .filter((b) => b !== article)
          .some((b) => b.textContent.includes(peer.text)),
      ).toBe(false)
    // The amber bar: 2 px, solid, on the start side, the label's colour; amber is red over green over blue.
    expect([style.borderLeftWidth, style.borderLeftStyle, style.borderTopWidth]).toEqual(['2px', 'solid', '0px'])
    const label = article.querySelector('.message__name')
    if (label === null) throw new Error('no label')
    const amber = getComputedStyle(label).color
    expect(channels(style.borderLeftColor)).toEqual(channels(amber))
    const [r, g, b] = channels(amber)
    expect(r > g && g > b && r - b > 80).toBe(true)
    // The chat icon before the label, in the label's colour.
    const icon = article.querySelector('.message__author svg')
    expect(icon).not.toBeNull()
    if (icon !== null) expect(channels(getComputedStyle(icon).color)).toEqual(channels(amber))
    // Readable: the label 4.5:1 and the bar 3:1 on what is behind the message.
    const behind = backdrop(article)
    expect(contrast(amber, behind)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(style.borderLeftColor, behind)).toBeGreaterThanOrEqual(3)
    const body = article.querySelector('.message__body')
    if (peer.text === undefined) {
      // A peer note with no text shows its label only.
      expect(body).toBeNull()
    } else {
      if (!(body instanceof HTMLElement)) throw new Error(`no text in ${peer.name}`)
      expect(body.textContent).toBe(peer.text)
      // The body's text is not muted and reads 4.5:1 on the pane.
      const ink = getComputedStyle(body.querySelector('p') ?? body).color
      expect(contrast(ink, behind)).toBeGreaterThanOrEqual(4.5)
    }
    // It stays inside the transcript.
    expect(article.getBoundingClientRect().right).toBeLessThanOrEqual(scope.getBoundingClientRect().right + 0.5)
  }
  // Markdown in a peer's text draws as Markdown.
  expect(scope.querySelector('strong')?.textContent).toBe('5190')
  // The owner's text that only holds the tag stays his bubble, with the tag as text.
  const quoted = bubbles(scope).filter((b) =>
    b.textContent.includes('<agent-prompt from="sample-coord">hi</agent-prompt>'),
  )
  expect(quoted).toHaveLength(1)
  expect(quoted[0]?.querySelector('.message__name')).toBeNull()
  // No peer note is drawn as a muted note line.
  expect([...scope.querySelectorAll('[data-note-kind]')].map((l) => l.getAttribute('data-note-kind'))).toEqual([
    'task',
    'hook',
  ])
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth)
}

describe('a message from another chat in a live transcript (R55)', () => {
  for (const mode of ['dark', 'light'] as const)
    for (const device of devices)
      it(`shows each peer message in amber with its text, never as the owner's bubble, on ${device.name} in ${mode}`, async () => {
        document.documentElement.classList.toggle('dark', mode === 'dark')
        try {
          withPlan([prompt, notes[0] ?? prompt, ...peerNotes, quoting, notes[1] ?? prompt, reply])
          await tapWorkspaces(device.size)
          await tapChat('plan the slice')
          const chat = chatRegion('plan the slice')
          await expect.element(chat.getByRole('article', { name: 'From sample-lab' })).toBeVisible()
          await expect.element(chat.getByRole('article', { name: 'From sample-coord' })).toBeVisible()
          await expect.element(chat.getByRole('article', { name: 'From sample-inbox' })).toBeVisible()
          await expect.element(chat.getByText('Stop hook: reply rewritten')).toBeVisible()
          expectPeersApart(chat.element())
          expect(getReports()).toEqual([])
        } finally {
          document.documentElement.classList.add('dark')
        }
      })

  it("shows each peer message in amber with its text, never as the owner's bubble, on the desktop", async () => {
    withPlan([prompt, notes[0] ?? prompt, ...peerNotes, quoting, notes[1] ?? prompt, reply])
    await tapWorkspaces([1512, 982])
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(page.getByRole('article', { name: 'From sample-lab' })).toBeVisible()
    await expect.element(page.getByRole('article', { name: 'From sample-inbox' })).toBeVisible()
    const pane = workbenchPane('plan the slice')
    if (pane === null) throw new Error('no pane')
    expectPeersApart(pane)
    expect(getReports()).toEqual([])
  })
})
