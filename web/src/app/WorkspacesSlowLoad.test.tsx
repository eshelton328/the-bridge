import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { clearReports, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { markApp } from './appMarker.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// NCC-181: a Workspaces page whose first live read is slow draws its loading layout and the loaded page in one tree;
// a pendingComponent was a second tree, so the backdrop, the shell, the nav and every scroller mounted twice. The
// owner's path: no URL parameters, a tap on Workspaces, and on the phone and the tablet a tap on the chat.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const title = 'plan the slice'
const chats = [
  {
    id: plan,
    kind: 'claude',
    title,
    model: 'claude-opus-5-5',
    contextUsed: null,
    modelId: null,
    effort: null,
    pane: `${plan}-pane`,
    status: 'idle',
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
/** How late the first layout read answers: past the test router's pendingMs (1 s), as in the CI run of NCC-181. */
const layoutDelayMs = 2500

const user = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })
const reply = (id: string, text: string): TranscriptEntry => ({ type: 'assistant', id, text, cut: false })

/** The stubbed server: the first layout read answers after `layoutDelayMs`, and each transcript read waits for `release`. */
function slowServer() {
  const transcripts = fakeTranscriptServer()
  transcripts.set(plan, [user('u1', 'Fix the build'), reply('a1', 'Looking at the build now.')])
  let layoutReads = 0
  let open: (() => void) | undefined
  const held = new Promise<void>((resolve) => {
    open = resolve
  })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      if (/^\/api\/chats\/[^/]+\/transcript$/.test(path)) await held
      const transcript = transcripts.handle(path, init)
      if (transcript !== undefined) return transcript
      if (path === '/api/workspaces')
        return new Response(
          JSON.stringify({ machine: 'mac-mini', workspaces: [{ id: workspace, label: 'live work', chats }] }),
          { status: 200 },
        )
      if (path === `/api/workspaces/${encodeURIComponent(workspace)}/layout`) {
        layoutReads += 1
        if (layoutReads === 1)
          await new Promise((resolve) => {
            setTimeout(resolve, layoutDelayMs)
          })
        return new Response(layout, { status: 200 })
      }
      if (path === '/api/events') {
        const body = new ReadableStream<Uint8Array>({
          start: (control) => {
            control.enqueue(new TextEncoder().encode('event: open\nretry: 200\ndata: {}\n\n'))
          },
        })
        return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } })
      }
      throw new TypeError(`no stub for ${url}`)
    }),
  )
  return {
    release: () => {
      open?.()
    },
  }
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

const sizes = [
  { name: 'the phone', size: [390, 844], nav: '[data-figma="tab bar"]', taps: true },
  { name: 'the tablet', size: [744, 1133], nav: '[data-figma="tab bar"]', taps: true },
  { name: 'the desktop', size: [1512, 982], nav: '[data-figma="nav rail"]', taps: false },
] as const

describe('a Workspaces page whose first live read is slow (NCC-181)', () => {
  for (const device of sizes)
    it(`draws its loading layout and the loaded page in one tree, and keeps the chat's scroller, on ${device.name}`, async () => {
      const server = slowServer()
      await setViewport(device.size[0], device.size[1])
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
      // The loading layout (R58), past the router's pendingMs: its nav and the workspaces that load.
      await expect
        .element(page.getByRole('status', { name: 'Loading Workspaces' }), { timeout: layoutDelayMs })
        .toBeInTheDocument()
      const backdrop = container.firstElementChild
      const nav = document.querySelector(device.nav)
      if (backdrop === null || nav === null) throw new Error('no loading layout')
      // The loaded page fills the same tree: the backdrop and the nav are the nodes the loading layout drew.
      await expect.element(page.getByText(title, { exact: true }).first(), { timeout: 2 * layoutDelayMs }).toBeVisible()
      expect(page.getByRole('status', { name: 'Loading Workspaces' }).query()).toBeNull()
      expect(container.firstElementChild).toBe(backdrop)
      expect(document.querySelector(device.nav)).toBe(nav)
      if (device.taps) {
        await userEvent.click(page.getByText(title, { exact: true }).first())
        await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
      }
      // The chat's own skeleton while its transcript read waits; its scroller holds the reply when the read answers.
      await expect.element(page.getByRole('status', { name: 'Loading this chat' })).toBeInTheDocument()
      const body = document.querySelector('[data-loading="transcript"]')?.parentElement ?? null
      if (body === null) throw new Error('no transcript skeleton')
      server.release()
      await expect.element(page.getByText('Looking at the build now.')).toBeVisible()
      expect(body.isConnected).toBe(true)
      expect(body.contains(page.getByText('Looking at the build now.').element())).toBe(true)
      expect(container.firstElementChild).toBe(backdrop)
      // The phone's and the tablet's chat has no tab bar; the desktop's rail stays.
      if (!device.taps) expect(document.querySelector(device.nav)).toBe(nav)
      expect(getReports()).toEqual([])
    })
})
