import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
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
import { queryClient } from '../lib/queryClient.ts'
import { afterRendering, renderedUntil, setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'

// The R73 glide cases of WorkspacesLiveTranscript.test.tsx, moved here so that they run in their own Vitest project
// (`web-motion`, `pnpm test:motion`) with one worker and no other test file beside them (NCC-174). Each case reads
// one sample per rendering step while the keyboard opens and closes, and a runner whose CPU the other workers take
// draws no frame for up to 200 ms: the case then has too few samples to judge the glide, and a step can span two
// glides. The cases take the owner's path as in that file: the app with no URL parameters, Workspaces and a live chat,
// with a stubbed server.
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

describe("a live chat's transcript (slice 3b)", () => {
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
      // A read at each dock too, so that no step spans two glides: a slow machine can draw no frame for 200 ms, and a
      // step from one glide into the next mixed their ratios (NCC-53). Inside the dock event AppShell has ended the old
      // glide and not yet started the new one, so the read waits for a microtask, where the new glide starts at the place
      // the group is drawn. Only the frame reads count as the run's samples.
      // A dock that gives the moving dock a new target keeps its clock, and the group moves on from where it is drawn:
      // the step that ends at the read belongs to the glide it ends. A dock that starts a new clock writes a new end time
      // on the root (`keyboardEnd`) and starts that clock 50 ms back, where iOS's keyboard already is when Safari reports
      // it (the library's `keyboardReportLag`), so its first place is part of the way along: the step that ends at the
      // read is that glide's first step (NCC-176).
      const dockReads: ReturnType<typeof read>[] = []
      let clockEnd = shell.dataset.keyboardEnd
      const onDock = () => {
        const time = performance.now()
        docks.push(time)
        const newClock = shell.dataset.keyboardEnd !== clockEnd
        clockEnd = shell.dataset.keyboardEnd
        if (sampling)
          queueMicrotask(() => {
            dockReads.push({ ...read(), t: newClock ? time + 0.001 : time - 0.001 })
          })
      }
      shell.addEventListener(appShellDockEvent, onDock)
      onTestFinished(() => {
        shell.removeEventListener(appShellDockEvent, onDock)
      })
      const at = read()
      const frames: ReturnType<typeof read>[] = []
      let sampling = true
      const sample = () => {
        frames.push(read())
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
      const steps = [...frames, ...dockReads].sort((a, b) => a.t - b.t)
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
      expect(frames.length).toBeGreaterThan(10)
      expect(
        Math.max(...jumps),
        `step ${String(worst + 1)} of ${JSON.stringify(steps.map((s) => [Math.round(s.t), s.composerTop, s.top, s.footer]))}, docks ${JSON.stringify(docks.map(Math.round))}`,
      ).toBeLessThanOrEqual(1)
      expect(Math.max(...steps.map((s) => s.lineBottom - s.composerTop))).toBeLessThanOrEqual(0.5)
      expect(getReports()).toEqual([])
    })
})
