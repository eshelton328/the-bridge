import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { appShellDockEvent } from '@eshelton328/component-library-1701'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { clearReports, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { type FakeTranscriptServer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { clickNow, holdTimers } from '../lib/holdTimers.ts'
import { queryClient } from '../lib/queryClient.ts'
import { afterRendering, renderedUntil, setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'

// Slice 3b: a live chat's pane shows its transcript. Each test takes the
// owner's path: it opens the app with no URL parameters, taps Workspaces and
// a live chat (the phone and the tablet) or shows the workbench's panes (the
// desktop), with a stubbed server (`fetch`) whose transcript routes are the
// contract-checked fake (lib/fakeTranscriptServer.ts). A pushed
// `transcript.changed` changes the entries in place; a miss shows a quiet
// line with Retry in the pane and reports once (d-115); a stream route that
// answers 404 (backend 3b-2 alone) shows the transcript with no line.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'
const drift = 'mac-mini/c3'
const logs = 'mac-mini/c4'

const summary = (id: string, kind: 'claude' | 'codex' | 'shell', title: string) => ({
  id,
  kind,
  title,
  model: kind === 'codex' ? 'gpt-5.5' : kind === 'shell' ? 'zsh' : 'claude-opus-5-5',
  contextUsed: null,
  modelId: null,
  effort: null,
  pane: `${id}-pane`,
  status: 'working',
  parent: null,
})
const chats = [
  summary(plan, 'claude', 'plan the slice'),
  summary(review, 'claude', 'review notes'),
  summary(drift, 'codex', 'drift check'),
  summary(logs, 'shell', 'tail logs'),
]
const split = (direction: 'row' | 'column', first: unknown, second: unknown) => ({
  kind: 'split',
  direction,
  ratio: 0.5,
  first,
  second,
})
const pane = (chat: string) => ({ kind: 'pane', chat })

const layout = JSON.stringify({
  workspace,
  tabs: [
    {
      id: 'mac-mini/w-live:t1',
      label: 'main',
      active: true,
      // Rows first: plan and review on top, drift and logs under them.
      root: split('column', split('row', pane(plan), pane(review)), split('row', pane(drift), pane(logs))),
      focusedChat: plan,
      zoomed: false,
      chats,
    },
  ],
})

const user = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })
const reply = (id: string, text: string, cut = false): TranscriptEntry => ({ type: 'assistant', id, text, cut })
const tool = (id: string, running: boolean): TranscriptEntry => ({
  type: 'tool',
  id,
  name: 'Bash',
  target: 'pnpm',
  running,
})

/** The stubbed server: the workspaces, their layout, the event stream and the transcript fake's routes. */
function fakeServer(transcripts: FakeTranscriptServer) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const { pathname: path, search } = new URL(url, window.location.origin)
      const transcript = transcripts.handle(path + search, init)
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

/** A transcript fake with plan's transcript: the owner's prompt, a running tool call and a reply. */
function withPlan(options: Parameters<typeof fakeTranscriptServer>[0] = {}) {
  const server = fakeTranscriptServer(options)
  server.set(plan, [user('u1', 'Fix the build'), tool('t1', true), reply('a1', 'Looking at the build now.')])
  server.set(review, [user('u2', 'Review the notes')])
  fakeServer(server)
  return server
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
  { name: 'the tablet', size: [756, 1129] },
] as const

describe("a live chat's transcript (slice 3b)", () => {
  for (const device of devices)
    it(`shows the transcript of a tapped live chat and a pushed change on ${device.name}`, async () => {
      const server = withPlan()
      await tapWorkspaces(device.size)
      await tapChat('plan the slice')
      const chat = chatRegion('plan the slice')
      await expect.element(page.getByText('Fix the build')).toBeVisible()
      await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
      await expect.element(page.getByText('Transcript not live yet')).not.toBeInTheDocument()
      // The chat's own stream, and only its: the list's other chat has none.
      await expect.poll(() => server.openStreams()).toEqual([plan])
      server.push(plan, [tool('t1', false), reply('a2', 'The build passes.')])
      await expect.element(page.getByText('The build passes.')).toBeVisible()
      // The replaced entry keeps its place: the new reply comes after the first one.
      const texts = chat.element().textContent
      expect(texts.indexOf('Looking at the build now.')).toBeLessThan(texts.indexOf('The build passes.'))
      await expect.element(page.getByText('Earlier entries not live yet')).not.toBeInTheDocument()
      // Back to the list closes the stream.
      await userEvent.click(page.getByRole('button', { name: 'Back to Workspaces' }).first())
      await expect.poll(() => server.openStreams()).toEqual([])
      expect(getReports()).toEqual([])
    })

  it("shows each pane's transcript in the desktop workbench, and a pushed change in its pane", async () => {
    const server = withPlan()
    await tapWorkspaces([1512, 982])
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(page.getByText('Fix the build')).toBeVisible()
    await expect.element(page.getByText('Review the notes')).toBeVisible()
    // Only the Claude chats read: the Codex chat's transcript and the shell's terminal are not live yet.
    await expect.poll(() => [...server.openStreams()].sort()).toEqual([plan, review])
    expect([...new Set(server.reads)].sort()).toEqual([plan, review])
    expect(workbenchPane('drift check')?.textContent).toContain('Transcript not live yet')
    expect(workbenchPane('tail logs')?.textContent).toContain('Terminal not live yet')
    server.push(review, [reply('a9', 'Two notes need a source.')])
    await expect.element(page.getByText('Two notes need a source.')).toBeVisible()
    expect(workbenchPane('review notes')?.textContent).toContain('Two notes need a source.')
    expect(workbenchPane('plan the slice')?.textContent).not.toContain('Two notes need a source.')
    // The reply is named after the chat's agent.
    expect(workbenchPane('review notes')?.textContent).toContain('Claude')
    expect(getReports()).toEqual([])
  })

  for (const device of devices)
    it(`reads nothing for a tapped Codex chat, whose transcript stays not live, on ${device.name}`, async () => {
      const server = withPlan()
      await tapWorkspaces(device.size)
      await tapChat('drift check')
      await expect.element(page.getByText('Transcript not live yet')).toBeVisible()
      await new Promise((resolve) => setTimeout(resolve, 300))
      expect(server.opens).toEqual([])
      expect(server.reads).toEqual([])
      expect(getReports()).toEqual([])
    })

  it("copies a live reply's text with its Copy button, on the phone", async () => {
    withPlan()
    const written: string[] = []
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation((text) => {
      written.push(text)
      return Promise.resolve()
    })
    await tapWorkspaces([390, 844])
    await tapChat('plan the slice')
    await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
    // "Copied" waits for the test's clock, not the runner's (lib/holdTimers.ts). Until the test lets it go, no step is a
    // Vitest action or poll, which would move it too: the press is a DOM click and each wait counts rendering steps.
    const copied = chatRegion('plan the slice').getByRole('button', { name: 'Copied' })
    const release = holdTimers()
    clickNow(chatRegion('plan the slice').getByRole('button', { name: 'Copy' }).element())
    await renderedUntil(() => written.length > 0)
    expect(written).toEqual(['Looking at the build now.'])
    // The button says it copied, as a sample reply's does (audit P-4).
    await renderedUntil(() => copied.query() !== null)
    expect(copied.element()).toBeVisible()
    release()
    expect(getReports()).toEqual([])
  })

  it("reads Copy failed on a live reply's Copy when the clipboard refuses, and reports without its text", async () => {
    withPlan()
    const broken = new Error('the clipboard broke')
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(() => Promise.reject(broken))
    await tapWorkspaces([756, 1129])
    await tapChat('plan the slice')
    const chat = chatRegion('plan the slice')
    await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
    // "Copy failed" waits for the test's clock, as "Copied" does above.
    const failed = chat.getByRole('button', { name: 'Copy failed' })
    const release = holdTimers()
    clickNow(chat.getByRole('button', { name: 'Copy' }).element())
    await renderedUntil(() => failed.query() !== null)
    expect(failed.element()).toBeVisible()
    release()
    expect(getReports().map((r) => r.error)).toEqual([broken])
    expect(JSON.stringify(getReports().map((r) => [r.error.message, r.error.stack]))).not.toContain('Looking at')
    // The open ErrorTray shows the clipboard's error alone.
    const trays = () => [...document.querySelectorAll('aside[aria-label="Error reports"]')]
    await userEvent.click(page.getByRole('button', { name: '1 error' }))
    await expect
      .poll(() =>
        trays()
          .map((t) => t.textContent)
          .join('\n'),
      )
      .toContain('the clipboard broke')
    expect(
      trays()
        .map((t) => t.textContent)
        .join('\n'),
    ).not.toContain('Looking at')
  })

  it('shows a quiet empty line for a Claude chat whose transcript has no entries', async () => {
    const server = fakeTranscriptServer()
    server.set(plan, [])
    fakeServer(server)
    await tapWorkspaces([390, 844])
    await tapChat('plan the slice')
    await expect.element(page.getByText('Send a message to start.')).toBeVisible()
    server.push(plan, [user('u1', 'First message')])
    await expect.element(page.getByText('First message')).toBeVisible()
    await expect.element(page.getByText('Send a message to start.')).not.toBeInTheDocument()
    expect(getReports()).toEqual([])
  })

  // A stand-in for window.visualViewport, moved as iOS Safari moves it when its keyboard opens (WorkspacesKeyboardGap).
  class FakeViewport extends EventTarget {
    height = document.documentElement.clientHeight
    width = document.documentElement.clientWidth
    offsetTop = 0
    offsetLeft = 0
    scale = 1
    move(change: { height: number }) {
      this.height = change.height
      this.dispatchEvent(new Event('resize'))
    }
  }
  /** Puts `value` in place of window.visualViewport until the test ends. */
  function replaceVisualViewport(value: FakeViewport) {
    const own = Object.getOwnPropertyDescriptor(window, 'visualViewport')
    Object.defineProperty(window, 'visualViewport', { configurable: true, value })
    onTestFinished(() => {
      if (own) Object.defineProperty(window, 'visualViewport', own)
      else Reflect.deleteProperty(window, 'visualViewport')
    })
  }

  // R73 (the owner: "It's not smooth moving the text and icon with the keyboard"): the R68 group jumped to a new
  // centre as the keyboard opened and closed, half the keyboard's reach. The group carries `data-keyboard-glide`
  // (library beta.128, R73 part 2), so AppShell glides it on the keyboard's curve to the place the dock's end gives it.
  // Each rendering step, from the tap on the message box to the keyboard closed again, reads the composer's top, the
  // mark's top, the composer's height and the line's bottom. With no step left out: while the composer is one row the
  // group stays where it is; the composer's growth from one row at the dock's start (R39) moves it by half that growth;
  // and through the open and the close every step lies on the line from the keyboard-closed place to the
  // keyboard-open one, so the group moves with the composer and never jumps, also where it ends on the composer
  // (the iPhone) and with R36's gap (the iPad mini). The line never goes over the composer (R68). The keyboard tops
  // are WorkspacesKeyboardGap's.
  for (const [device, size, keyboardTop] of [
    ['iPad mini', [744, 1133], 833],
    ['iPhone', [390, 844], 464],
  ] as const)
    it(`moves a new chat's mark, name and line with the composer, never by a jump, while the keyboard opens and closes, on the ${device}`, async () => {
      const viewport = new FakeViewport()
      replaceVisualViewport(viewport)
      const server = fakeTranscriptServer()
      server.set(plan, [])
      fakeServer(server)
      await tapWorkspaces(size)
      await tapChat('plan the slice')
      const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
      if (!(root instanceof HTMLElement)) throw new Error('no root')
      root.style.height = '100%'
      const region = chatRegion('plan the slice')
      await expect.element(region.getByText('Send a message to start.')).toBeVisible()
      await afterRendering()
      const mark = region.element().querySelector<HTMLElement>('[data-chat-empty-part="mark"]')
      const line = region.element().querySelector<HTMLElement>('[data-chat-empty-part="line"]')
      const shell = mark?.closest<HTMLElement>('.app-shell__root')
      const field = region.getByRole('textbox').element()
      const composer = field.closest('.scroll-frame__footer')
      if (!mark || !line || !shell || !(field instanceof HTMLElement) || !composer) throw new Error('no empty state')
      const read = () => ({
        composerTop: composer.getBoundingClientRect().top,
        top: mark.getBoundingClientRect().top,
        footer: composer.getBoundingClientRect().height,
        lineBottom: line.getBoundingClientRect().bottom,
        t: performance.now(),
      })
      // Each dock event starts a glide from where the group is drawn to that event's end place (R73 part 2). The first
      // open of a portrait keyboard docks twice, to the expected keyboard and then to the measured one; on the iPad mini
      // both give the group the same end place, so the group can end its travel while the composer still moves.
      const docks: number[] = []
      const onDock = () => docks.push(performance.now())
      shell.addEventListener(appShellDockEvent, onDock)
      onTestFinished(() => {
        shell.removeEventListener(appShellDockEvent, onDock)
      })
      const at = read()
      const steps: ReturnType<typeof read>[] = []
      let sampling = true
      const sample = () => {
        steps.push(read())
        if (sampling) requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
      const settled = async () => {
        await expect.poll(() => document.getAnimations().length).toBe(0)
        await renderedUntil(() => true)
      }
      await userEvent.click(field)
      viewport.move({ height: keyboardTop })
      await expect.poll(() => shell.style.getPropertyValue('--app-shell-keyboard')).not.toBe('')
      await settled()
      // On the keyboard the whole group shows over the composer.
      expect(line.getBoundingClientRect().bottom).toBeLessThanOrEqual(composer.getBoundingClientRect().top + 0.5)
      const up = read()
      viewport.move({ height: size[1] })
      await expect.poll(() => shell.style.getPropertyValue('--app-shell-keyboard')).toMatch(/^(0px)?$/)
      await settled()
      sampling = false
      const down = read()
      // The keyboard closed again with the box still focused: the composer stays grown, and the group sits half that
      // growth higher than before the tap.
      expect(Math.abs(down.top - at.top + (down.footer - at.footer) / 2)).toBeLessThanOrEqual(1)
      // The open and the close move the group as far as the keyboard-open place, in step with the composer.
      expect(Math.abs(up.top - down.top)).toBeGreaterThan(device === 'iPhone' ? 50 : 4)
      // Each step's move of the group and of the composer, with the composer's growth taken out in the step it leaves or
      // takes one row (R39): the group stays centred above the composer, so it moves half that growth. That step can
      // come late on a slow machine.
      const oneRow = (s: { footer: number }) => Math.abs(s.footer - at.footer) < 0.5
      const moves = steps.slice(1).map((s, i) => {
        const before = steps[i] ?? s
        const grow = oneRow(before) !== oneRow(s) ? s.footer - before.footer : 0
        return {
          glide: docks.filter((time) => time <= s.t).length,
          group: s.top - before.top + grow / 2,
          composer: s.composerTop - before.composerTop + grow,
        }
      })
      // Each glide moves the group by one ratio of the composer's move: its travel over the composer's in that glide.
      // In each step the group moves at most that ratio of the composer's move, + 1 px. A jump of the group in one step
      // (R73 part 1) is more.
      const ratioOf = (glide: number) => {
        const own = moves.filter((move) => move.glide === glide)
        const composer = own.reduce((sum, move) => sum + move.composer, 0)
        const group = own.reduce((sum, move) => sum + move.group, 0)
        return Math.abs(composer) < 1 ? 0 : Math.abs(group / composer)
      }
      const jumps = moves.map((move) => Math.abs(move.group) - Math.abs(move.composer) * ratioOf(move.glide))
      const worst = jumps.indexOf(Math.max(...jumps))
      expect(steps.length).toBeGreaterThan(10)
      expect(
        Math.max(...jumps),
        `step ${String(worst + 1)} of ${JSON.stringify(steps.map((s) => [Math.round(s.t), s.composerTop, s.top, s.footer]))}, docks ${JSON.stringify(docks.map(Math.round))}`,
      ).toBeLessThanOrEqual(1)
      expect(Math.max(...steps.map((s) => s.lineBottom - s.composerTop))).toBeLessThanOrEqual(0.5)
      expect(getReports()).toEqual([])
    })

  // R68 (the owner: "something a bit more polished for new chats", "nice icons that are centered"): a new chat's
  // transcript centres the chat's mark in a round tile, its name and one quiet line above the composer. A short space
  // (the keyboard up) hides the line, then the name, and never covers or moves the composer.
  for (const [device, size] of [
    ['phone', [390, 844]],
    ['tablet', [744, 1133]],
  ] as const)
    it(`centres a new chat's mark, name and line, opened from the list, on the ${device}`, async () => {
      const viewport = new FakeViewport()
      replaceVisualViewport(viewport)
      const server = fakeTranscriptServer()
      server.set(plan, [])
      fakeServer(server)
      await tapWorkspaces(size)
      await tapChat('plan the slice')
      // The render's root fills the window, as `#root` does in index.css; earlier tests leave their renders.
      const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
      if (!(root instanceof HTMLElement)) throw new Error('no root')
      root.style.height = '100%'
      await afterRendering()
      const region = chatRegion('plan the slice')
      await expect.element(region.getByText('Send a message to start.')).toBeVisible()
      const empty = region.element().querySelector<HTMLElement>('[data-chat-empty]')
      const part = (name: string) => empty?.querySelector<HTMLElement>(`[data-chat-empty-part="${name}"]`)
      const mark = part('mark')
      const title = part('title')
      const line = part('line')
      const body = empty?.closest<HTMLElement>('.scroll-frame__body')
      const composer = region.getByRole('textbox').element().closest('.scroll-frame__footer')
      if (!empty || !mark || !title || !line || !body || !composer) throw new Error('no empty state in the chat')
      expect(mark.querySelector('svg')).not.toBeNull()
      expect(title.textContent).toBe('plan the slice')
      // Centred across the transcript, and in the middle of the space above the composer.
      const middle = (r: DOMRect) => r.left + r.width / 2
      const box = body.getBoundingClientRect()
      for (const el of [mark, title, line])
        expect(Math.abs(middle(el.getBoundingClientRect()) - middle(box))).toBeLessThanOrEqual(1)
      const group = { top: mark.getBoundingClientRect().top, bottom: line.getBoundingClientRect().bottom }
      const space = empty.getBoundingClientRect()
      expect(Math.abs(group.top - space.top - (space.bottom - group.bottom))).toBeLessThanOrEqual(2)
      expect(space.bottom).toBeLessThanOrEqual(composer.getBoundingClientRect().top + 0.5)
      // The keyboard up, as the shell docks it (R36's way, WorkspacesKeyboardGap.test.tsx): a tap on the message box, then
      // the visual viewport shrinks and the dock moves the composer up at the open's end. Two keyboard tops leave the
      // space room for the mark and the name (the line clipped) and for the mark alone; the first top is a probe, and the
      // second corrects it by the space it left, as the composer grows when it takes the focus.
      const inside = (el: HTMLElement) => {
        const r = el.getBoundingClientRect()
        const s = empty.getBoundingClientRect()
        return r.left >= s.left - 0.5 && r.right <= s.right + 0.5 && r.top >= s.top - 0.5 && r.bottom <= s.bottom + 0.5
      }
      const shell = body.closest<HTMLElement>('.app-shell__root')
      const field = region.getByRole('textbox').element()
      if (!shell || !(field instanceof HTMLElement)) throw new Error('no AppShell or message box')
      const room = () => Math.round(empty.getBoundingClientRect().height)
      await userEvent.click(field)
      for (const [want, shows] of [
        [96, { title: true, line: false }],
        [60, { title: false, line: false }],
      ] as const) {
        let top = size[1] - 360
        for (let step = 0; step < 2; step++) {
          // A probe that left the room wanted needs no second move (the dock would not change).
          if (step > 0 && room() === want) break
          const before = shell.style.getPropertyValue('--app-shell-keyboard')
          viewport.move({ height: top })
          // The dock changes the layout only at the open's end, so wait for its new reach.
          await expect.poll(() => shell.style.getPropertyValue('--app-shell-keyboard')).not.toBe(before)
          await renderedUntil(() => true)
          let last = -1
          await expect
            .poll(() => {
              const now = room()
              const same = now === last
              last = now
              return same
            })
            .toBe(true)
          top -= room() - want
        }
        expect(Math.abs(room() - want)).toBeLessThanOrEqual(2)
        expect(empty.getBoundingClientRect().bottom).toBeLessThanOrEqual(composer.getBoundingClientRect().top + 0.5)
        expect(inside(mark)).toBe(true)
        expect(inside(title)).toBe(shows.title)
        expect(inside(line)).toBe(shows.line)
        // A hidden part wraps whole into the next column, past the box's right edge, so none of its glyphs is drawn:
        // it is never cut through.
        for (const [el, shown] of [
          [title, shows.title],
          [line, shows.line],
        ] as const)
          if (!shown)
            expect(el.getBoundingClientRect().left).toBeGreaterThanOrEqual(empty.getBoundingClientRect().right - 0.5)
      }
      // The keyboard closes: all three show again.
      field.blur()
      viewport.move({ height: size[1] })
      await expect.poll(() => inside(line)).toBe(true)
      expect(inside(title)).toBe(true)
      expect(getReports()).toEqual([])
    })

  it('shows the earlier line once the server has no older page, and the cut line', async () => {
    const server = fakeTranscriptServer()
    server.set(plan, [reply('a1', 'A very long reply', true)], true)
    fakeServer(server)
    await tapWorkspaces([390, 844])
    await tapChat('plan the slice')
    await expect.element(page.getByText('Earlier entries not live yet')).toBeVisible()
    await expect.element(page.getByText('Cut — full text not live yet')).toBeVisible()
  })

  it('shows the transcript with no line and no report when the stream route answers 404 (3b-2 alone)', async () => {
    const server = withPlan({ streams: 'missing' })
    await tapWorkspaces([390, 844])
    await tapChat('plan the slice')
    await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(server.opens).toEqual([plan])
    expect(server.reads).toEqual([plan])
    await expect.element(page.getByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
    await expect.element(page.getByText(/^Transcript (not live|updates)/)).not.toBeInTheDocument()
    expect(getReports()).toEqual([])
  })

  it('shows the quiet line for an unknown chat: a 404 read with a 404 stream, reported once', async () => {
    const server = withPlan({ streams: 'missing' })
    server.answerReads(
      () =>
        new Response(
          JSON.stringify({ error: { kind: 'not-found', path: '/api/chats/x', message: 'no chat', requestId: 'r-4' } }),
          { status: 404 },
        ),
    )
    await tapWorkspaces([390, 844])
    await tapChat('plan the slice')
    const chat = chatRegion('plan the slice')
    await expect.element(chat.getByText('Transcript not live — status 404')).toBeVisible()
    await expect.element(chat.getByRole('button', { name: 'Retry' })).toBeVisible()
    expect(getReports().map((r) => r.error.message)).toEqual([
      'A chat transcript read missed: status 404 not-found (chat mac-mini/c1)',
    ])
  })

  it('shows a missed read in the pane with Retry, reports it once, and Retry reads the transcript', async () => {
    const server = withPlan()
    server.answerReads(
      () =>
        new Response(
          JSON.stringify({ error: { kind: 'herdr-unavailable', message: 'herdr is down', requestId: 'r-9' } }),
          { status: 503 },
        ),
    )
    await tapWorkspaces([756, 1129])
    await tapChat('plan the slice')
    const chat = chatRegion('plan the slice')
    await expect.element(chat.getByText('Transcript not live — herdr-unavailable')).toBeVisible()
    await userEvent.click(chat.getByRole('button', { name: 'Retry' }))
    await expect.poll(() => server.reads.length).toBe(2)
    await expect.element(chat.getByText('Transcript not live — herdr-unavailable')).toBeVisible()
    expect(getReports().map((r) => r.error.message)).toEqual([
      'A chat transcript read missed: herdr-unavailable (chat mac-mini/c1)',
    ])
    server.answerReads(undefined)
    await userEvent.click(chat.getByRole('button', { name: 'Retry' }))
    await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
    await expect.element(chat.getByText('Transcript not live — herdr-unavailable')).not.toBeInTheDocument()
    expect(getReports()).toHaveLength(1)
  })

  it('connects again quietly after a dropped stream, and reads again (review R43)', async () => {
    const server = withPlan()
    await tapWorkspaces([390, 844])
    await tapChat('plan the slice')
    const chat = chatRegion('plan the slice')
    await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
    await expect.poll(() => server.openStreams()).toEqual([plan])
    server.drop(plan)
    server.set(plan, [user('u1', 'Fix the build'), tool('t1', false), reply('a1', 'Looking at the build now.')])
    // The entries stay, and the stream comes back after the server's retry time (100 ms in the fake), well within the
    // grace: no line, no report, and the read again shows the tool call that ended meanwhile.
    await expect.poll(() => server.reads.length).toBe(2)
    await expect.poll(() => server.openStreams()).toEqual([plan])
    await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
    await expect.element(chat.getByText(outageLine)).not.toBeInTheDocument()
    await expect.element(chat.getByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
    expect(getReports()).toEqual([])
  })

  // #313: a chat that leaves the list (after /clear, or when its pane closes) ends its stream with one `error` event of
  // kind not-found. The page ends it quietly; any other kind is still an outage.
  const sizes = [
    { name: 'the phone', size: [390, 844] },
    { name: 'the desktop', size: [1512, 982] },
  ] as const
  /** Opens plan's transcript on the owner's path: the phone taps it, the desktop shows the workbench's panes. */
  async function openPlan(size: readonly [number, number]) {
    await tapWorkspaces(size)
    if (size[0] < 700) await tapChat('plan the slice')
    else await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
  }
  // A miss's line; a Codex pane's "Transcript not live yet" is not one.
  const outageLine = /^Transcript (not live —|updates)/

  for (const device of sizes) {
    it(`ends the stream quietly when the chat leaves the list (not-found), on ${device.name}`, async () => {
      const server = withPlan()
      await openPlan(device.size)
      await expect.poll(() => server.openStreams()).toContain(plan)
      const reads = server.reads.length
      const opens = server.opens.length
      server.gone(plan)
      await expect.poll(() => server.openStreams()).not.toContain(plan)
      // Longer than the fake's retry time (100 ms): a page that connects again would have done so by now.
      await new Promise((resolve) => setTimeout(resolve, 600))
      expect(server.reads.length).toBe(reads)
      expect(server.opens.length).toBe(opens)
      await expect.element(page.getByText(outageLine)).not.toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
      // The entries read before stay.
      await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
      expect(getReports()).toEqual([])
    })

    it(`still shows the outage line and reports once for another error kind, on ${device.name}`, async () => {
      const server = withPlan()
      await openPlan(device.size)
      await expect.poll(() => server.openStreams()).toContain(plan)
      server.fail(plan, 'herdr-unavailable')
      await expect.element(page.getByText('Transcript updates lost — connecting again')).toBeVisible()
      // It connects again and reads the transcript again.
      await expect.poll(() => server.reads.filter((c) => c === plan).length).toBe(2)
      expect(getReports().map((r) => r.error.message)).toEqual([
        'A chat transcript stream missed: ended herdr-unavailable (chat mac-mini/c1)',
      ])
    })
  }

  it('keeps the fixtures: ?source=fixtures reads no transcript', async () => {
    const server = withPlan()
    await setViewport(390, 844)
    router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/workspaces?source=fixtures'] }),
      defaultErrorComponent: RouteError,
    })
    view = await testRender(<RouterProvider router={router} />, rootErrorOptions)
    await userEvent.click(page.getByText('bridge themes', { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    expect(server.opens).toEqual([])
    expect(server.reads).toEqual([])
  })

  // The served log of 2026-11-21: iOS closes the stream of a page in the background, and the page saw that close as
  // an outage when it showed again ("ended", 0.4 to 1.5 s before the page read its workspaces again). The page now
  // connects again quietly once it shows; a miss after that connection is an outage, reported once.
  describe('back from the background', () => {
    /** Makes the page hidden (`hidden` true) or visible again, with the events Safari sends. */
    function setHidden(hidden: boolean) {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => (hidden ? 'hidden' : 'visible'),
      })
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
      if (hidden) window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))
      document.dispatchEvent(new Event('visibilitychange'))
      if (!hidden) window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
    }
    afterEach(() => {
      Reflect.deleteProperty(document, 'visibilityState')
      Reflect.deleteProperty(document, 'hidden')
    })

    /** Hides the page, closes plan's stream as iOS does, and shows the page again. */
    async function closedInBackground(server: FakeTranscriptServer) {
      await expect.poll(() => server.openStreams()).toContain(plan)
      setHidden(true)
      server.close(plan)
      await expect.poll(() => server.openStreams()).not.toContain(plan)
      setHidden(false)
    }

    for (const device of sizes)
      it(`does not connect again while hidden, then connects at once and quietly when it shows, on ${device.name}`, async () => {
        const server = withPlan()
        await openPlan(device.size)
        await expect.poll(() => server.openStreams()).toContain(plan)
        const reads = server.reads.length
        // The page's clock moves only when the test moves it (lib/holdTimers.ts). A Vitest poll would move it too, so
        // each wait until the release counts rendering steps.
        const release = holdTimers()
        setHidden(true)
        server.close(plan)
        await renderedUntil(() => !server.openStreams().includes(plan))
        // Hidden, it does not connect again however long it waits (R70).
        for (let at = 0; at < 40; at += 1) await vi.advanceTimersByTimeAsync(1000)
        await afterRendering()
        expect(server.openStreams()).not.toContain(plan)
        expect(server.reads.length).toBe(reads)
        expect(document.body.textContent).not.toMatch(outageLine)
        // Shown, it connects at once: the clock stands still.
        setHidden(false)
        await renderedUntil(() => server.openStreams().includes(plan))
        await renderedUntil(() => server.reads.length > reads)
        expect(server.reads.length).toBe(reads + 1)
        release()
        await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
        await expect.element(page.getByText(outageLine)).not.toBeInTheDocument()
        await expect.element(page.getByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
        expect(getReports()).toEqual([])
        // The stream it opened works: a pushed change shows.
        server.push(plan, [reply('a2', 'The build passes.')])
        await expect.element(page.getByText('The build passes.')).toBeVisible()
      })

    for (const device of sizes)
      it(`connects again at once and quietly when the close shows only after the page is back, on ${device.name}`, async () => {
        const server = withPlan()
        await openPlan(device.size)
        await expect.poll(() => server.openStreams()).toContain(plan)
        const reads = server.reads.length
        // iOS: the page cannot run in the background, so it sees the closed stream only once it shows again.
        setHidden(true)
        setHidden(false)
        // The clock stands still: a connection on the retry time (100 ms in the fake) would never come.
        // A Vitest poll would move it, so each wait until the release counts rendering steps.
        const release = holdTimers()
        server.close(plan)
        await renderedUntil(() => server.openStreams().includes(plan))
        await renderedUntil(() => server.reads.length > reads)
        expect(server.reads.length).toBe(reads + 1)
        release()
        await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
        await expect.element(page.getByText(outageLine)).not.toBeInTheDocument()
        await expect.element(page.getByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
        expect(getReports()).toEqual([])
      })

    it('reports once when the stream fails again after the page showed and connected again, on the phone', async () => {
      const server = withPlan()
      await openPlan([390, 844])
      const reads = server.reads.length
      await closedInBackground(server)
      await expect.poll(() => server.openStreams()).toContain(plan)
      await expect.poll(() => server.reads.length).toBe(reads + 1)
      expect(getReports()).toEqual([])
      // The page is visible, and the connection it made after it showed drops, and the server does not answer again
      // by the 4th try (R70): an outage. The page's clock moves only when the test moves it (lib/holdTimers.ts).
      server.answerStreams(() => new Response('Bad Gateway', { status: 502 }))
      // The backoff waits half of each step: 0.25, 0.5, 1, 2, 4 and 8 s.
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      const release = holdTimers()
      server.drop(plan)
      for (let at = 0; at < 11_000; at += 500) await vi.advanceTimersByTimeAsync(500)
      const shown = () => document.body.textContent.includes('Transcript updates lost — connecting again')
      await renderedUntil(shown)
      expect(getReports().map((r) => r.error.message)).toEqual([
        'A chat transcript stream missed: status 502 (chat mac-mini/c1)',
      ])
      // It connects again after the backoff's wait once the server answers: the miss at 10 s waited 15 s.
      server.answerStreams(undefined)
      for (let at = 11_000; at < 26_000; at += 1000) await vi.advanceTimersByTimeAsync(1000)
      await renderedUntil(() => server.reads.length === reads + 2 && !shown())
      release()
      expect(getReports()).toHaveLength(1)
    })

    it('reports a read that answers a 502 that is not JSON at the 4th visible miss, after the page showed', async () => {
      const server = withPlan()
      await openPlan([390, 844])
      await expect.poll(() => server.openStreams()).toContain(plan)
      // The proxy answers for a server that is down: an answer, not the background's close, so the backoff counts it.
      server.answerReads(() => new Response('Bad Gateway', { status: 502 }))
      setHidden(true)
      server.close(plan)
      await expect.poll(() => server.openStreams()).not.toContain(plan)
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      const release = holdTimers()
      setHidden(false)
      await renderedUntil(() => document.body.textContent.includes('Reconnecting…'))
      // The miss at 10 s after the first, with 4 in a row, shows the line and reports.
      for (let at = 0; at < 12_000 && getReports().length === 0; at += 250) await vi.advanceTimersByTimeAsync(250)
      release()
      expect(getReports()).toHaveLength(1)
      expect(getReports().map((r) => r.error.message)).toEqual([
        'A chat transcript read missed: unreachable 502 (chat mac-mini/c1)',
      ])
      await expect.element(page.getByText(/^Transcript not live —/)).toBeVisible()
    })

    it("reports the stream's error event even when the read then gets no answer while hidden, on the phone", async () => {
      const server = withPlan()
      await openPlan([390, 844])
      await expect.poll(() => server.openStreams()).toContain(plan)
      // The next read waits until the test ends it with no answer.
      let endRead: (() => void) | undefined
      server.answerReads(
        () =>
          new Promise<Response>((_, reject) => {
            endRead = () => {
              reject(new TypeError('Load failed'))
            }
          }),
      )
      // Visible, a stream that ends connects again after the backoff's wait and waits for the read; then the page hides.
      server.close(plan)
      await expect.poll(() => endRead).toBeDefined()
      await expect.poll(() => server.openStreams()).toContain(plan)
      setHidden(true)
      // The server's watch fails first, then the read gets no answer.
      server.fail(plan, 'internal')
      endRead?.()
      await expect.poll(() => getReports().length).toBe(1)
      expect(getReports().map((r) => r.error.message)).toEqual([
        'A chat transcript stream missed: ended internal (chat mac-mini/c1)',
      ])
    })

    it('reports a server error on the connection made after the page showed, once, on the phone', async () => {
      const server = withPlan()
      await openPlan([390, 844])
      server.answerStreams(
        () =>
          new Response(JSON.stringify({ error: { kind: 'internal', message: 'server broke', requestId: 'r-500' } }), {
            status: 500,
          }),
      )
      await closedInBackground(server)
      const chat = chatRegion('plan the slice')
      await expect.element(chat.getByText('Transcript updates lost — connecting again')).toBeVisible()
      await expect.poll(() => server.opens.length).toBeGreaterThan(3)
      expect(getReports().map((r) => r.error.message)).toEqual([
        'A chat transcript stream missed: status 500 (chat mac-mini/c1)',
      ])
    })
  })
})
