import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { chatComposerDevice, type RouteSource, startChatKeyboardTrace, traceRoute } from './keyboardChatTrace.ts'

// From the dev server's switch: one trace session per keyboard open in a
// Workspaces chat, on /workspaces only. A session starts at the composer's
// focusin and stops 2 s (here 40 ms) after the keyboard closes, with one last
// POST; a focus within that time keeps the session.

const CLOSE_MS = 40

/** A phone or tablet chat's composer as WorkspacesPhone draws it, with text that must never reach a trace. */
function mountComposer(device: 'phone' | 'tablet' | 'desktop' = 'phone'): HTMLTextAreaElement {
  const host = document.createElement('div')
  host.className = `app-shell__root app-shell__root--size_${device}`
  host.innerHTML =
    '<div class="app-shell__detail"><div class="scroll-frame__root" role="region" aria-label="secret chat title">' +
    '<div class="scroll-frame__header">secret chat title</div>' +
    '<div class="scroll-frame__footer"><div data-keyboard-keep=""><textarea name="secret-name" aria-label="secret label">secret message</textarea></div></div>' +
    '</div></div>'
  document.body.append(host)
  onTestFinished(() => {
    host.remove()
  })
  const area = host.querySelector('textarea')
  if (area === null) throw new Error('no textarea')
  return area
}

type Route = { pathname: string; search: string }

/** A router stand-in: `go` moves it and tells the subscriber. */
function fakeRoute(start: Route) {
  let location = start
  const listeners = new Set<() => void>()
  const source: RouteSource = {
    current: () => location,
    subscribe: (onChange) => {
      listeners.add(onChange)
      return () => listeners.delete(onChange)
    },
  }
  return {
    source,
    go: (next: Route) => {
      location = next
      for (const listener of listeners) listener()
    },
  }
}

/** Starts the chat trace, posting into `posts`; stops it after the test. */
function watch(route: RouteSource, postEveryMs = 60_000) {
  const posts: string[] = []
  const running = startChatKeyboardTrace({
    route,
    postEveryMs,
    closeDelayMs: CLOSE_MS,
    post: (_endpoint, body) => {
      posts.push(body)
      return Promise.resolve(undefined)
    },
  })
  onTestFinished(running.stop)
  return { posts, running }
}

const parsed = (body: string | undefined): unknown => JSON.parse(body ?? '')
const startedAt = (body: string | undefined): unknown => {
  const value: unknown = parsed(body)
  if (typeof value !== 'object' || value === null) return undefined
  const field: unknown = Reflect.get(value, 'startedAt')
  return field
}
/** The keys of `value[key]`, or none when it is not an object. */
const keysOf = (value: unknown, key: string): string[] => {
  const field: unknown = typeof value === 'object' && value !== null ? Reflect.get(value, key) : undefined
  return typeof field === 'object' && field !== null ? Object.keys(field) : []
}
const wait = (ms: number) => new Promise((done) => setTimeout(done, ms))

describe('keyboard trace chat sessions', () => {
  it('starts no session and adds no listener on a route that is not a chat route', async () => {
    const add = vi.spyOn(document, 'addEventListener')
    const addWindow = vi.spyOn(window, 'addEventListener')
    onTestFinished(() => {
      add.mockRestore()
      addWindow.mockRestore()
    })
    const route = fakeRoute({ pathname: '/inbox', search: '?state=chat' })
    const { posts } = watch(route.source, 10)
    expect(add).not.toHaveBeenCalled()
    expect(addWindow).not.toHaveBeenCalled()
    const composer = mountComposer()
    composer.focus()
    composer.blur()
    await wait(CLOSE_MS * 3)
    expect(posts).toEqual([])
  })

  it('starts at the composer focusin and stops after the keyboard closes, with one POST at the stop', async () => {
    const route = fakeRoute({ pathname: '/workspaces', search: '?state=phoneChatFull' })
    const { posts } = watch(route.source)
    const composer = mountComposer()
    composer.focus()
    await wait(CLOSE_MS * 2)
    // The composer still has the focus: the keyboard is open and the session runs, with no POST yet.
    expect(posts).toEqual([])
    composer.blur()
    await wait(CLOSE_MS / 4)
    expect(posts).toEqual([])
    await expect.poll(() => posts.length).toBe(1)
    await wait(CLOSE_MS * 2)
    expect(posts).toHaveLength(1)
    expect(posts[0]).toContain('"type":"focusin"')
    expect(posts[0]).toContain('"type":"focusout"')
  })

  it('posts every interval while a session runs', async () => {
    const route = fakeRoute({ pathname: '/workspaces', search: '' })
    const { posts } = watch(route.source, 20)
    mountComposer().focus()
    await expect.poll(() => posts.length).toBeGreaterThanOrEqual(2)
    expect(new Set(posts.map(startedAt)).size).toBe(1)
  })

  it('makes two files for two keyboard opens, each with its own startedAt', async () => {
    const route = fakeRoute({ pathname: '/workspaces', search: '?state=phoneChatFull' })
    const { posts } = watch(route.source)
    const composer = mountComposer()
    composer.focus()
    composer.blur()
    await expect.poll(() => posts.length).toBe(1)
    composer.focus()
    composer.blur()
    await expect.poll(() => posts.length).toBe(2)
    expect(startedAt(posts[0])).not.toBe(startedAt(posts[1]))
  })

  it('keeps one session when the composer takes the focus again within the close delay', async () => {
    const route = fakeRoute({ pathname: '/workspaces', search: '' })
    const { posts } = watch(route.source)
    const composer = mountComposer()
    composer.focus()
    composer.blur()
    await wait(CLOSE_MS / 4)
    composer.focus()
    await wait(CLOSE_MS * 2)
    expect(posts).toEqual([])
    composer.blur()
    await expect.poll(() => posts.length).toBe(1)
    await wait(CLOSE_MS * 2)
    expect(posts).toHaveLength(1)
    const focusins = JSON.stringify(parsed(posts[0])).match(/"type":"focusin"/g) ?? []
    expect(focusins).toHaveLength(2)
  })

  it('waits for the visual viewport to grow back to its height before the open', async () => {
    const vv = window.visualViewport
    if (vv === null) throw new Error('no visualViewport')
    const before = vv.height
    let height = before
    const spy = vi.spyOn(vv, 'height', 'get').mockImplementation(() => height)
    onTestFinished(() => {
      spy.mockRestore()
    })
    const route = fakeRoute({ pathname: '/workspaces', search: '' })
    const { posts } = watch(route.source)
    const composer = mountComposer()
    composer.focus()
    height = before - 336
    composer.blur()
    await wait(CLOSE_MS * 3)
    // The keyboard is still on the screen: no stop yet.
    expect(posts).toEqual([])
    height = before
    await expect.poll(() => posts.length).toBe(1)
  })

  it('stops after a rotation, when the viewport is back to the layout height of the new orientation', async () => {
    const vv = window.visualViewport
    if (vv === null) throw new Error('no visualViewport')
    const screen = { width: 390, height: 844, inner: 844 }
    const spies = [
      vi.spyOn(vv, 'height', 'get').mockImplementation(() => screen.height),
      vi.spyOn(vv, 'width', 'get').mockImplementation(() => screen.width),
      vi.spyOn(window, 'innerHeight', 'get').mockImplementation(() => screen.inner),
    ]
    onTestFinished(() => {
      for (const spy of spies) spy.mockRestore()
    })
    const route = fakeRoute({ pathname: '/workspaces', search: '' })
    const { posts } = watch(route.source)
    const composer = mountComposer()
    composer.focus()
    screen.height = 508
    composer.blur()
    // Turned to landscape with the keyboard still up: no stop.
    Object.assign(screen, { width: 844, inner: 390, height: 200 })
    await wait(CLOSE_MS * 3)
    expect(posts).toEqual([])
    // The keyboard closes in landscape: the viewport is the layout's 390, short of the portrait 844.
    screen.height = 390
    await expect.poll(() => posts.length).toBe(1)
  })

  it('records the route and the chat in the header, with no other query value and no text', async () => {
    const route = fakeRoute({
      pathname: '/workspaces',
      search: '?state=tabletOneChat&source=live&keyboard-q=secret',
    })
    const { posts } = watch(route.source)
    const composer = mountComposer('tablet')
    composer.focus()
    composer.value = 'secret typed'
    composer.blur()
    await expect.poll(() => posts.length).toBe(1)
    const body = parsed(posts[0])
    expect(body).toMatchObject({
      route: { pathname: '/workspaces', state: 'tabletOneChat' },
      chat: { state: 'tabletOneChat', device: 'tablet' },
    })
    expect(keysOf(body, 'route')).toEqual(['pathname', 'state'])
    expect(keysOf(body, 'chat')).toEqual(['state', 'device'])
    expect(posts[0]).not.toMatch(/secret|live|source/)
  })

  it('starts a session for a composer that already has the focus when the trace starts', async () => {
    const composer = mountComposer()
    composer.focus()
    const route = fakeRoute({ pathname: '/workspaces', search: '' })
    const { posts } = watch(route.source)
    composer.blur()
    await expect.poll(() => posts.length).toBe(1)
    expect(posts[0]).toContain('"type":"focused"')
  })

  it('starts a session for a composer that has the focus when the route turns to /workspaces', async () => {
    const route = fakeRoute({ pathname: '/inbox', search: '' })
    const { posts } = watch(route.source)
    const composer = mountComposer()
    composer.focus()
    route.go({ pathname: '/workspaces', search: '' })
    composer.blur()
    await expect.poll(() => posts.length).toBe(1)
  })

  it('records a state that is not a state key as null', () => {
    expect(traceRoute({ pathname: '/workspaces', search: '?state=my%20chat%20title' })).toEqual({
      pathname: '/workspaces',
      state: null,
    })
    expect(traceRoute({ pathname: '/workspaces', search: '' })).toEqual({ pathname: '/workspaces', state: null })
  })

  it('takes only a phone or tablet chat composer in the AppShell detail frame', () => {
    expect(chatComposerDevice(mountComposer('phone'))).toBe('phone')
    expect(chatComposerDevice(mountComposer('tablet'))).toBe('tablet')
    expect(chatComposerDevice(mountComposer('desktop'))).toBeUndefined()
    const loose = document.createElement('textarea')
    document.body.append(loose)
    onTestFinished(() => {
      loose.remove()
    })
    expect(chatComposerDevice(loose)).toBeUndefined()
    expect(chatComposerDevice(null)).toBeUndefined()
  })

  it('starts on a chat route reached later, and ends a session when the route leaves it', async () => {
    const route = fakeRoute({ pathname: '/inbox', search: '' })
    const { posts } = watch(route.source)
    const composer = mountComposer()
    composer.focus()
    composer.blur()
    route.go({ pathname: '/workspaces', search: '' })
    composer.focus()
    route.go({ pathname: '/toolkit', search: '' })
    // Leaving the route stops the session at once, with its last POST.
    await expect.poll(() => posts.length).toBe(1)
    composer.blur()
    composer.focus()
    await wait(CLOSE_MS * 3)
    expect(posts).toHaveLength(1)
  })
})
