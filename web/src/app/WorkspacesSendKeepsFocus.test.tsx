import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { type FakeTranscriptServer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { afterRendering, setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// Send keeps the keyboard up (the owner's phone, 2026-11-21: "the keyboard closes
// before the message actually gets sent"). On iOS the keyboard closes when the
// message box loses the focus, and a press on Send took it. Each test takes the
// owner's path: the app with no URL parameters, a tap on Workspaces and on a
// live chat, the message typed in its box. A press on Send (a click, or a touch
// as iOS sends one) must leave the focus in the box through the send, the 204
// and the box emptying. Enter in the box and Send from the keyboard (Tab, then
// Enter or Space) still send. The iOS Simulator probe of the same path is in
// the PR (visualViewport.height 377 with the keyboard up, 714 closed).
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
      id: `${workspace}:t1`,
      label: 'main',
      active: true,
      root: { kind: 'pane', chat: plan },
      focusedChat: plan,
      zoomed: false,
      chats,
    },
  ],
})
const user = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })

/** The stubbed server: the workspace, its layout, the event stream and the fake's chat routes. */
function withChat(): FakeTranscriptServer {
  const fake = fakeTranscriptServer()
  fake.set(plan, [user('u1', 'Fix the build')])
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
          ),
        )
      if (path === `/api/workspaces/${encodeURIComponent(workspace)}/layout`)
        return Promise.resolve(new Response(layout))
      if (path === '/api/events') {
        const body = new ReadableStream<Uint8Array>({
          start: (control) => {
            control.enqueue(new TextEncoder().encode('event: open\nretry: 200\ndata: {}\n\n'))
          },
        })
        return Promise.resolve(new Response(body, { headers: { 'content-type': 'text/event-stream' } }))
      }
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
  return fake
}

/** A send's answer that the test gives when it chooses. */
function held() {
  let end: (answer: Response) => void = () => undefined
  return {
    answer: () =>
      new Promise<Response>((resolve) => {
        end = resolve
      }),
    end: (res: Response) => {
      end(res)
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

const phone = [390, 844] as const
const desktop = [1512, 982] as const

/** The open chat's region on the phone, or the chat's pane on the desktop. */
const chatRegion = () => page.getByRole('region', { name: title })
const box = () => chatRegion().getByRole('textbox')
const sendButton = () => chatRegion().getByRole('button', { name: 'Send', exact: true })
/** The message box's own textarea. */
const area = () => box().element()

/** Opens the app at `size` with no URL parameters, taps Workspaces (and on the phone the chat) and types `text`. */
async function openAndType(size: readonly [number, number], text: string) {
  await setViewport(size[0], size[1])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    defaultErrorComponent: RouteError,
  })
  view = await testRender(<RouterProvider router={router} />, rootErrorOptions)
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  expect(router.state.location.searchStr).toBe('')
  if (size === phone) {
    await userEvent.click(page.getByText(title, { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
  }
  await userEvent.fill(box(), text)
  await expect.element(box()).toHaveFocus()
}

/** A touch at the middle of `element`, as iOS sends one: `type` on `element`, with the touch at that point. */
function touch(type: 'touchstart' | 'touchend', element: Element, at: Element = element): TouchEvent {
  const rect = at.getBoundingClientRect()
  const point = new Touch({
    identifier: 1,
    target: element,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
  })
  const event = new TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    touches: type === 'touchstart' ? [point] : [],
    targetTouches: type === 'touchstart' ? [point] : [],
    changedTouches: [point],
  })
  element.dispatchEvent(event)
  return event
}

describe('a press on Send keeps the focus in the message box, so the phone keyboard stays up', () => {
  it('keeps the focus in the box through a tap on Send, the pending send, the 204 and the box emptying, on the phone', async () => {
    const fake = withChat()
    const answer = held()
    fake.answerPrompts(answer.answer)
    await openAndType(phone, 'ship it')
    await userEvent.click(sendButton())
    // The press itself: the focus never leaves the box.
    expect(document.activeElement).toBe(area())
    await expect.poll(() => fake.posts).toEqual([{ chat: plan, route: 'prompt' }])
    expect(document.activeElement).toBe(area())
    // While the send is pending the box stays editable (a disabled field closes the iOS keyboard).
    await expect.element(box()).toBeEnabled()
    answer.end(new Response(null, { status: 204 }))
    await expect.element(box()).toHaveValue('')
    await afterRendering()
    expect(document.activeElement).toBe(area())
    await expect.element(sendButton()).toBeEnabled()
    await afterRendering()
    expect(document.activeElement).toBe(area())
    expect(getReports()).toEqual([])
  })

  it('cancels the touch on Send, which takes the focus on iOS, and sends once from the touch, on the phone', async () => {
    const fake = withChat()
    await openAndType(phone, 'ship it')
    const send = sendButton().element()
    const start = touch('touchstart', send)
    expect(start.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(area())
    const end = touch('touchend', send)
    expect(end.defaultPrevented).toBe(true)
    await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: 'ship it' }])
    await expect.element(box()).toHaveValue('')
    await afterRendering()
    expect(document.activeElement).toBe(area())
    expect(fake.posts).toHaveLength(1)
  })

  it('sends nothing for a touch that slides off Send before it ends, on the phone', async () => {
    const fake = withChat()
    await openAndType(phone, 'not yet')
    touch('touchstart', sendButton().element())
    touch('touchend', sendButton().element(), chatRegion().getByRole('heading', { name: title }).element())
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(fake.posts).toEqual([])
    await expect.element(box()).toHaveValue('not yet')
    expect(document.activeElement).toBe(area())
  })

  it('still sends from the keyboard: Tab to Send, then Enter and Space, on the phone', async () => {
    const fake = withChat()
    await openAndType(phone, 'first')
    // Send is in the tab order after the box.
    for (let step = 0; step < 6 && document.activeElement !== sendButton().element(); step += 1)
      await userEvent.keyboard('{Tab}')
    await expect.element(sendButton()).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: 'first' }])
    await expect.element(box()).toHaveValue('')
    await userEvent.fill(box(), 'second')
    sendButton().element().focus()
    await userEvent.keyboard(' ')
    await expect
      .poll(() => fake.prompts)
      .toEqual([
        { chat: plan, text: 'first' },
        { chat: plan, text: 'second' },
      ])
    await expect.element(box()).toHaveValue('')
  })

  it('still sends with Enter in the box and keeps the focus there, on the desktop', async () => {
    const fake = withChat()
    await openAndType(desktop, 'ship it')
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: 'ship it' }])
    await expect.element(box()).toHaveValue('')
    await expect.element(box()).toHaveFocus()
  })

  it('keeps the focus in the box through a click on Send, on the desktop', async () => {
    const fake = withChat()
    await openAndType(desktop, 'ship it')
    await userEvent.click(sendButton())
    expect(document.activeElement).toBe(area())
    await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: 'ship it' }])
    await expect.element(box()).toHaveValue('')
    await afterRendering()
    expect(document.activeElement).toBe(area())
  })
})
