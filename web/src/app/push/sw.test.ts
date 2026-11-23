import { ChatId, maxPushBody, maxPushName, PushMessage } from '@bridge/contract'
import { describe, expect, it, vi } from 'vitest'

// The service worker (public/sw.js, d-118), loaded as a module with a fake `self`: what each event does with the
// worker's registration and clients. The worker has no fetch handler and keeps no cache.

type Listener = (event: unknown) => void

/** A fake service worker global: its listeners, and the calls it saw. */
function fakeWorker(windows: { url: string }[] = [], shown: { tag: string; close: () => void }[] = []) {
  const listeners = new Map<string, Listener[]>()
  const focused = windows.map(() => ({ postMessage: vi.fn() }))
  const clientList = windows.map((w, i) => ({
    url: w.url,
    focus: vi.fn(() => Promise.resolve(focused[i])),
    postMessage: vi.fn(),
  }))
  const self = {
    location: { origin: 'https://bridge.example.com' },
    addEventListener: (type: string, listener: Listener) => {
      listeners.set(type, [...(listeners.get(type) ?? []), listener])
    },
    skipWaiting: vi.fn(() => Promise.resolve()),
    clients: {
      claim: vi.fn(() => Promise.resolve()),
      matchAll: vi.fn(() => Promise.resolve(clientList)),
      openWindow: vi.fn(() => Promise.resolve(null)),
    },
    registration: {
      showNotification: vi.fn(() => Promise.resolve()),
      getNotifications: vi.fn((filter: { tag: string }) => Promise.resolve(shown.filter((n) => n.tag === filter.tag))),
    },
  }
  return { self, listeners, clientList, focused, shown }
}

/** Runs sw.js with `self` as its global. */
async function load(windows: { url: string }[] = [], shown: { tag: string; close: () => void }[] = []) {
  const worker = fakeWorker(windows, shown)
  // The file as the app serves it from public/, at the path mountApp registers.
  const swSource = await (await fetch('/sw.js')).text()
  // A classic script, as a service worker runs it: the file inside a function of `self`, kept on the window for the test.
  const hook = '__bridgeSwUnderTest'
  const blob = new Blob([`window.${hook} = function (self) {\n${swSource}\n}`], { type: 'text/javascript' })
  const url = URL.createObjectURL(blob)
  // A script that fails to load never fires load, so the test fails on its timeout.
  await new Promise<void>((resolve) => {
    const script = document.createElement('script')
    script.src = url
    script.onload = () => {
      script.remove()
      resolve()
    }
    document.head.append(script)
  })
  URL.revokeObjectURL(url)
  const run: unknown = Reflect.get(window, hook)
  Reflect.deleteProperty(window, hook)
  if (typeof run !== 'function') throw new Error('sw.js did not load')
  Reflect.apply(run, undefined, [worker.self])
  return worker
}

/** Sends one event to the worker's listeners and waits for what it passed to waitUntil. */
async function dispatch(worker: ReturnType<typeof fakeWorker>, type: string, event: object) {
  const waits: Promise<unknown>[] = []
  for (const listener of worker.listeners.get(type) ?? []) {
    listener({
      ...event,
      waitUntil: (p: Promise<unknown>) => {
        waits.push(p)
      },
    })
  }
  await Promise.all(waits)
}

const pushOf = (text: string) => ({ data: { text: () => text } })
const good = {
  chat: 'mac-mini/5af4ed88-2e47-4bbb-aafa-f5206af29daf',
  name: 'bridge themes',
  workspace: 'the-bridge',
  event: 'done',
  body: null,
}

describe('the service worker', () => {
  it('listens for install, activate, push and notificationclick only: no fetch handler, so no cache', async () => {
    const worker = await load()
    expect([...worker.listeners.keys()].sort()).toEqual(['activate', 'install', 'notificationclick', 'push'])
  })

  it('takes over at once: install skips waiting and activate claims the open pages', async () => {
    const worker = await load()
    await dispatch(worker, 'install', {})
    expect(worker.self.skipWaiting).toHaveBeenCalledOnce()
    await dispatch(worker, 'activate', {})
    expect(worker.self.clients.claim).toHaveBeenCalledOnce()
  })

  it('shows one notification per push: "chat · workspace" as the title, the event line with no preview, the chat as the tag', async () => {
    const worker = await load()
    await dispatch(worker, 'push', pushOf(JSON.stringify(good)))
    await dispatch(worker, 'push', pushOf(JSON.stringify({ ...good, event: 'needsYou' })))
    await dispatch(worker, 'push', pushOf(JSON.stringify({ ...good, name: '', workspace: '' })))
    expect(worker.self.registration.showNotification.mock.calls).toEqual([
      ['bridge themes · the-bridge', { body: 'Done', tag: good.chat, data: { chat: good.chat } }],
      ['bridge themes · the-bridge', { body: 'Needs you', tag: good.chat, data: { chat: good.chat } }],
      ['The Bridge', { body: 'Done', tag: good.chat, data: { chat: good.chat } }],
    ])
  })

  it('shows the old payload of sw.js version 2 with the chat name and the event line', async () => {
    const worker = await load()
    await dispatch(worker, 'push', pushOf(JSON.stringify({ chat: good.chat, name: 'writer', event: 'needsYou' })))
    expect(worker.self.registration.showNotification.mock.calls).toEqual([
      ['writer', { body: 'Needs you', tag: good.chat, data: { chat: good.chat } }],
    ])
  })

  it('shows the preview line as the body when the push has one', async () => {
    const worker = await load()
    await dispatch(worker, 'push', pushOf(JSON.stringify({ ...good, event: 'needsYou', body: 'Wants to run: pnpm' })))
    expect(worker.self.registration.showNotification.mock.calls).toEqual([
      ['bridge themes · the-bridge', { body: 'Wants to run: pnpm', tag: good.chat, data: { chat: good.chat } }],
    ])
  })

  it("closes the chat's notification that shows before it shows the new one, and leaves other chats'", async () => {
    const old = { tag: good.chat, close: vi.fn() }
    const other = { tag: 'mac-mini/other', close: vi.fn() }
    const worker = await load([], [old, other])
    await dispatch(worker, 'push', pushOf(JSON.stringify(good)))
    expect(old.close).toHaveBeenCalledOnce()
    expect(other.close).not.toHaveBeenCalled()
    expect(old.close.mock.invocationCallOrder[0]).toBeLessThan(
      worker.self.registration.showNotification.mock.invocationCallOrder[0] ?? 0,
    )
  })

  it.each([
    ['text that is not JSON', 'not json'],
    ['a JSON array', JSON.stringify([good])],
    ['no data', null],
    ['a chat ID that is a URL', JSON.stringify({ ...good, chat: 'https://evil.example/x' })],
    ['a chat ID with a path', JSON.stringify({ ...good, chat: 'mac-mini/../../logout' })],
    ['a chat ID with no machine', JSON.stringify({ ...good, chat: '5af4ed88' })],
    ['a chat ID that is not a string', JSON.stringify({ ...good, chat: 7 })],
    ["a name over the contract's longest", JSON.stringify({ ...good, name: 'x'.repeat(maxPushName + 1) })],
    ['a name that is not a string', JSON.stringify({ ...good, name: { text: 'x' } })],
    ['an unknown event', JSON.stringify({ ...good, event: 'started' })],
    ['an extra key', JSON.stringify({ ...good, url: 'https://evil.example/' })],
    ['a missing key', JSON.stringify({ chat: good.chat, name: good.name })],
    ['an empty preview line', JSON.stringify({ ...good, body: '' })],
    ["a preview line over the contract's longest", JSON.stringify({ ...good, body: 'x'.repeat(maxPushBody + 1) })],
    ['a preview line that is not a string', JSON.stringify({ ...good, body: 7 })],
    [
      "a workspace name over the contract's longest",
      JSON.stringify({ ...good, workspace: 'x'.repeat(maxPushName + 1) }),
    ],
  ])('shows nothing for a push with %s', async (_, text) => {
    const worker = await load()
    await dispatch(worker, 'push', text === null ? { data: null } : pushOf(text))
    expect(worker.self.registration.showNotification).not.toHaveBeenCalled()
  })

  it("takes a name of the contract's longest", async () => {
    const worker = await load()
    await dispatch(worker, 'push', pushOf(JSON.stringify({ ...good, name: 'x'.repeat(maxPushName) })))
    expect(worker.self.registration.showNotification).toHaveBeenCalledOnce()
  })

  it('checks a chat ID as the contract does', async () => {
    const samples = [
      'mac-mini/5af4ed88-2e47-4bbb-aafa-f5206af29daf',
      'a/b',
      'mac-mini/w17:t1.x_y',
      'Mac/x',
      'mac--mini/x',
      '-mac/x',
      'mac/',
      'mac/x/y',
      'mac/x y',
      'mac/%2F',
      'mac/x?y',
      'mac/x#y',
      '/x',
    ]
    for (const chat of samples) {
      const worker = await load()
      await dispatch(worker, 'push', pushOf(JSON.stringify({ ...good, chat })))
      const shown = worker.self.registration.showNotification.mock.calls.length === 1
      expect([chat, shown]).toEqual([chat, ChatId.safeParse(chat).success])
    }
  })

  it("shows a payload when, and only when, the contract's PushMessage takes it", async () => {
    const samples: unknown[] = [
      good,
      { ...good, event: 'needsYou' },
      { ...good, name: '' },
      { ...good, name: 'x'.repeat(maxPushName) },
      { ...good, name: 'x'.repeat(maxPushName + 1) },
      { ...good, event: 'started' },
      { ...good, chat: 'mac-mini/../x' },
      { ...good, extra: 1 },
      { chat: good.chat, name: good.name },
      { chat: good.chat, name: good.name, event: 'done' },
      { chat: good.chat, name: good.name, event: 'done', body: null },
      { ...good, name: 7 },
      { ...good, body: 'Merged.' },
      { ...good, body: '😀'.repeat(maxPushBody) },
      { ...good, body: '😀'.repeat(maxPushBody + 1) },
      { ...good, body: '' },
      { ...good, workspace: '😀'.repeat(maxPushName) },
      { ...good, workspace: 'x'.repeat(maxPushName + 1) },
      [good],
      null,
    ]
    for (const payload of samples) {
      const worker = await load()
      await dispatch(worker, 'push', pushOf(JSON.stringify(payload)))
      const shown = worker.self.registration.showNotification.mock.calls.length === 1
      expect([payload, shown]).toEqual([payload, PushMessage.safeParse(payload).success])
    }
  })

  it('on a tap, closes the notification and opens a window on the chat when the app has none open', async () => {
    const worker = await load()
    const close = vi.fn()
    await dispatch(worker, 'notificationclick', { notification: { close, data: { chat: good.chat } } })
    expect(close).toHaveBeenCalledOnce()
    expect(worker.self.clients.openWindow).toHaveBeenCalledWith(
      'https://bridge.example.com/workspaces?chat=mac-mini%2F5af4ed88-2e47-4bbb-aafa-f5206af29daf',
    )
  })

  it('on a tap, focuses the open app window and asks it to open the chat', async () => {
    const worker = await load([{ url: 'https://other.example/' }, { url: 'https://bridge.example.com/inbox' }])
    await dispatch(worker, 'notificationclick', { notification: { close: vi.fn(), data: { chat: good.chat } } })
    expect(worker.clientList[0]?.focus).not.toHaveBeenCalled()
    expect(worker.clientList[1]?.focus).toHaveBeenCalledOnce()
    expect(worker.focused[1]?.postMessage).toHaveBeenCalledWith({ type: 'bridge:open-chat', chat: good.chat })
    expect(worker.self.clients.openWindow).not.toHaveBeenCalled()
  })

  it('on a tap, still asks the open app window to open the chat when the browser refuses to focus it', async () => {
    const worker = await load([{ url: 'https://bridge.example.com/inbox' }])
    const app = worker.clientList[0]
    app?.focus.mockImplementation(() => Promise.reject(new DOMException('Not allowed to focus', 'InvalidAccessError')))
    await dispatch(worker, 'notificationclick', { notification: { close: vi.fn(), data: { chat: good.chat } } })
    expect(app?.postMessage).toHaveBeenCalledWith({ type: 'bridge:open-chat', chat: good.chat })
    expect(worker.self.clients.openWindow).not.toHaveBeenCalled()
  })

  it.each([
    ['a URL', 'https://evil.example/phish'],
    ['a path', '//evil.example/x'],
    ['nothing', undefined],
  ])('on a tap whose chat is %s, opens only the app at its origin', async (_, chat) => {
    const worker = await load()
    await dispatch(worker, 'notificationclick', { notification: { close: vi.fn(), data: { chat } } })
    expect(worker.self.clients.openWindow).toHaveBeenCalledWith('https://bridge.example.com/')
  })
})
