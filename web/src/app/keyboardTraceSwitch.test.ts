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

/** Starts the trace through the switch with `fetchSwitch`, posting into `posts`; stops it after the test. */
async function start(
  fetchSwitch: (url: string, init: RequestInit) => Promise<Response>,
  timeoutMs = 500,
  route?: RouteSource,
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
  })
  if (running) onTestFinished(running.stop)
  return { running, posts }
}

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
    let changed: () => void = () => undefined
    const { running, posts } = await start(fetchSwitch, 500, {
      current: () => route,
      subscribe: (onChange) => {
        changed = onChange
        return () => undefined
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
    const { running, posts } = await start(answer({ enabled: false }))
    expect(running).toBeUndefined()
    expect(overlay()).toBeNull()
    expect(posts).toEqual([])
  })

  it('does not trace, and shows no error, when the switch fails, is slow or answers oddly', async () => {
    withSearch('')
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
    for (const fetchSwitch of [
      () => Promise.reject(new TypeError('Failed to fetch')),
      slow,
      answer({ enabled: true }, 500),
      answer({ enabled: 'true' }),
      () => Promise.resolve(new Response('not json', { status: 200 })),
    ]) {
      expect(await keyboardTraceMode({ fetchSwitch, timeoutMs: 50 })).toBe('off')
      const { running, posts } = await start(fetchSwitch, 50)
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
})
