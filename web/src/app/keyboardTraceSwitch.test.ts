import { describe, expect, it, onTestFinished, vi } from 'vitest'
import type { RouteSource } from './keyboardChatTrace.ts'
import { KEYBOARD_TRACE_SWITCH_URL, keyboardTraceMode, startKeyboardTraceIfOn } from './keyboardTraceSwitch.ts'

// The trace runs with the overlay from `?keyboard-trace`, with no overlay
// from the dev server's switch (the installed Home Screen app, where no one
// can type a URL), and not at all when the switch is off, fails or is slow.

/** Puts `search` in the URL for this test, and puts the old URL back after it. */
function withSearch(search: string) {
  const before = window.location.href
  window.history.replaceState(null, '', `${window.location.pathname}${search}`)
  onTestFinished(() => {
    window.history.replaceState(null, '', before)
  })
}

/** Sets `navigator.webdriver` for this test, as Playwright sets it to true; the browser's own value comes back after it. */
function withWebdriver(value: boolean) {
  Object.defineProperty(navigator, 'webdriver', { configurable: true, value })
  onTestFinished(() => {
    Reflect.deleteProperty(navigator, 'webdriver')
  })
}

type FetchSwitch = (url: string, init: RequestInit) => Promise<Response>

const answer =
  (body: unknown, status = 200) =>
  () =>
    Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))

/** Starts the trace through the switch with `fetchSwitch` and the R57 shift with `fetchShift`, posting into `posts`; stops it after the test. */
async function start(
  fetchSwitch: (url: string, init: RequestInit) => Promise<Response>,
  timeoutMs = 500,
  route?: RouteSource,
  fetchShift: FetchSwitch = answer({ shiftTop: 0 }),
) {
  const posts: string[] = []
  const running = await startKeyboardTraceIfOn({
    fetchSwitch,
    timeoutMs,
    ...(route === undefined ? {} : { route }),
    trace: {
      postEveryMs: 50,
      closeDelayMs: 20,
      post: (_endpoint, body) => {
        posts.push(body)
        return Promise.resolve(undefined)
      },
    },
    header: { everyMs: 40 },
    shift: { fetchShift, everyMs: 30 },
  })
  if (running) onTestFinished(running.stop)
  return { running, posts }
}

/** An open chat's header, as PhoneChat draws it: ChatHead's title h2 in the AppShell detail (headerTrace.ts). */
function mountChatTitle() {
  const host = document.createElement('div')
  host.className = 'app-shell__root app-shell__root--size_tablet'
  host.innerHTML = '<div class="app-shell__detail"><header data-figma="105:785"><h2>secret title</h2></header></div>'
  document.body.append(host)
  onTestFinished(() => {
    host.remove()
  })
}

/** A route source fixed at `/workspaces`. */
const onWorkspaces: RouteSource = {
  current: () => ({ pathname: '/workspaces', search: '' }),
  subscribe: () => () => undefined,
}

/** The posts that are header dumps (headerTrace.ts). */
const headerPosts = (posts: string[]) => posts.filter((body) => body.includes('"trace":"header"'))

const overlay = () => document.querySelector('[data-keyboard-trace]')

/** The composer of a phone chat, as WorkspacesPhone draws it: the AppShell detail's ScrollFrame footer. */
function mountPhoneComposer(): HTMLTextAreaElement {
  const host = document.createElement('div')
  host.className = 'app-shell__root app-shell__root--size_phone'
  host.innerHTML =
    '<div class="app-shell__detail"><div class="scroll-frame__root"><div class="scroll-frame__footer">' +
    '<div data-keyboard-keep=""><textarea></textarea></div></div></div></div>'
  document.body.append(host)
  onTestFinished(() => {
    host.remove()
  })
  const area = host.querySelector('textarea')
  if (area === null) throw new Error('no textarea')
  return area
}

describe('keyboard trace switch', () => {
  it('traces with the overlay when the URL has ?keyboard-trace, without asking the switch', async () => {
    withSearch('?keyboard-trace')
    const fetchSwitch = vi.fn<FetchSwitch>(answer({ enabled: false }))
    const { running, posts } = await start(fetchSwitch)
    expect(fetchSwitch).not.toHaveBeenCalled()
    expect(running).toBeDefined()
    expect(overlay()).not.toBeNull()
    await expect.poll(() => posts.length).toBeGreaterThan(0)
  })

  it('runs the chat sessions with no overlay when the switch is on, asking it once with no cache', async () => {
    withSearch('')
    withWebdriver(false)
    const fetchSwitch = vi.fn<FetchSwitch>(answer({ enabled: true }))
    const route = { pathname: '/inbox', search: '' }
    // The router calls each subscriber: the chat sessions and the header dump both follow it.
    const subscribers = new Set<() => void>()
    const changed = () => {
      for (const onChange of subscribers) onChange()
    }
    const { running, posts } = await start(fetchSwitch, 500, {
      current: () => route,
      subscribe: (onChange) => {
        subscribers.add(onChange)
        return () => subscribers.delete(onChange)
      },
    })
    expect(fetchSwitch).toHaveBeenCalledTimes(1)
    expect(fetchSwitch.mock.calls[0]?.[0]).toBe(KEYBOARD_TRACE_SWITCH_URL)
    expect(fetchSwitch.mock.calls[0]?.[1]).toMatchObject({ cache: 'no-store' })
    expect(running).toBeDefined()
    expect(overlay()).toBeNull()
    // Off a chat route a composer's focus starts nothing.
    const composer = mountPhoneComposer()
    composer.focus()
    composer.blur()
    await new Promise((done) => setTimeout(done, 150))
    expect(posts).toEqual([])
    // On /workspaces it starts a session, which posts once it stops.
    route.pathname = '/workspaces'
    changed()
    composer.focus()
    composer.blur()
    await expect.poll(() => posts.length).toBeGreaterThan(0)
    expect(JSON.parse(posts.at(-1) ?? '')).toMatchObject({ chat: { device: 'phone', state: null } })
    expect(overlay()).toBeNull()
  })

  it('does not trace when the switch is off', async () => {
    withSearch('')
    withWebdriver(false)
    const fetchSwitch = vi.fn<FetchSwitch>(answer({ enabled: false }))
    const { running, posts } = await start(fetchSwitch)
    expect(fetchSwitch).toHaveBeenCalledTimes(1)
    expect(running).toBeUndefined()
    expect(overlay()).toBeNull()
    expect(posts).toEqual([])
  })

  it('does not trace, and shows no error, when the switch fails, is slow or answers oddly', async () => {
    withSearch('')
    withWebdriver(false)
    const errors = vi.spyOn(console, 'error')
    onTestFinished(() => {
      errors.mockRestore()
    })
    const slow = (_url: string, init: RequestInit) =>
      new Promise<Response>((_done, fail) => {
        init.signal?.addEventListener('abort', () => {
          fail(new DOMException('aborted', 'AbortError'))
        })
      })
    for (const answerSwitch of [
      () => Promise.reject(new TypeError('Failed to fetch')),
      slow,
      answer({ enabled: true }, 500),
      answer({ enabled: 'true' }),
      () => Promise.resolve(new Response('not json', { status: 200 })),
    ]) {
      const fetchSwitch = vi.fn<FetchSwitch>(answerSwitch)
      expect(await keyboardTraceMode({ fetchSwitch, timeoutMs: 50 })).toBe('off')
      const { running, posts } = await start(fetchSwitch, 50)
      // The switch was asked each time, so the answer, not automation, turned the trace off.
      expect(fetchSwitch).toHaveBeenCalledTimes(2)
      expect(running).toBeUndefined()
      expect(posts).toEqual([])
    }
    expect(overlay()).toBeNull()
    expect(errors).not.toHaveBeenCalled()
  })

  it('starts nothing from the switch under automation, and never asks it', async () => {
    withSearch('')
    withWebdriver(true)
    const fetchSwitch = vi.fn<FetchSwitch>(answer({ enabled: true }))
    expect(await keyboardTraceMode({ fetchSwitch })).toBe('off')
    const { running, posts } = await start(fetchSwitch)
    expect(running).toBeUndefined()
    const composer = mountPhoneComposer()
    composer.focus()
    composer.blur()
    await new Promise((done) => setTimeout(done, 150))
    expect(fetchSwitch).not.toHaveBeenCalled()
    expect(posts).toEqual([])
  })

  it('still traces from the param under automation, and marks the trace automated', async () => {
    withSearch('?keyboard-trace')
    withWebdriver(true)
    const { running, posts } = await start(answer({ enabled: false }))
    expect(running).toBeDefined()
    await expect.poll(() => posts.length).toBeGreaterThan(0)
    expect(JSON.parse(posts[0] ?? '')).toMatchObject({ automated: true })
  })

  it('dumps an open chat header with the switch on, never its title', async () => {
    withSearch('')
    withWebdriver(false)
    mountChatTitle()
    const { running, posts } = await start(vi.fn<FetchSwitch>(answer({ enabled: true })), 500, onWorkspaces)
    expect(running).toBeDefined()
    await expect.poll(() => headerPosts(posts).length).toBeGreaterThan(0)
    expect(JSON.parse(headerPosts(posts).at(-1) ?? '')).toMatchObject({
      trace: 'header',
      route: { pathname: '/workspaces' },
    })
    expect(posts.join('')).not.toContain('secret')
  })

  it('takes no header dump when the switch is off or fails', async () => {
    withSearch('')
    withWebdriver(false)
    mountChatTitle()
    for (const answerSwitch of [answer({ enabled: false }), () => Promise.reject(new TypeError('Failed to fetch'))]) {
      const { running, posts } = await start(vi.fn<FetchSwitch>(answerSwitch), 50, onWorkspaces)
      expect(running).toBeUndefined()
      await new Promise((done) => setTimeout(done, 150))
      expect(posts).toEqual([])
    }
  })

  it('moves #root down by the shift with the switch on, live, and puts it back when it stops', async () => {
    withSearch('')
    withWebdriver(false)
    const root = document.createElement('div')
    root.id = 'root'
    document.body.append(root)
    onTestFinished(() => {
      root.remove()
    })
    let shiftTop = 0
    const fetchShift = vi.fn<FetchSwitch>(() => answer({ shiftTop })())
    const { running } = await start(vi.fn<FetchSwitch>(answer({ enabled: true })), 500, onWorkspaces, fetchShift)
    expect(running).toBeDefined()
    await expect.poll(() => fetchShift.mock.calls.length).toBeGreaterThan(1)
    expect(fetchShift.mock.calls[0]?.[0]).toBe('/__keyboard-trace/shift')
    expect(root.style.top).toBe('')
    shiftTop = 40
    await expect.poll(() => root.style.top).toBe('40px')
    expect(root.style.transform).toBe('')
    running?.stop()
    expect(root.style.top).toBe('')
  })

  it('never asks the shift while the switch is off', async () => {
    withSearch('')
    withWebdriver(false)
    const fetchShift = vi.fn<FetchSwitch>(answer({ shiftTop: 40 }))
    const { running } = await start(vi.fn<FetchSwitch>(answer({ enabled: false })), 50, onWorkspaces, fetchShift)
    expect(running).toBeUndefined()
    await new Promise((done) => setTimeout(done, 100))
    expect(fetchShift).not.toHaveBeenCalled()
  })
})
