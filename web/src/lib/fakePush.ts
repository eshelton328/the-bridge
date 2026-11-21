// A fake browser and server for Web Push tests (d-118): it replaces the
// methods of `pushBrowser` with spies, so no test asks the real browser for a
// permission or a subscription, and stubs fetch for `/api/push/*` with the
// answers the test picks. Every request it gets is in `requests`, with its
// method, path and JSON body. Call `fakePush()` in a test; vi.restoreAllMocks()
// and vi.unstubAllGlobals() undo it.
import { vi } from 'vitest'
import { type PushEnv, pushBrowser, type PushSubscriptionLike } from './pushBrowser.ts'

/** The server's key in the tests: 87 characters of base64url, as the contract's PushKeyResponse. */
export const fakePushKey = `B${'A'.repeat(86)}`
/** The push service URL of the fake subscription. */
export const fakeEndpoint = 'https://push.example.net/send/abc'

/** A desktop browser that can push. */
const desktopEnv: PushEnv = {
  secure: true,
  serviceWorker: true,
  pushManager: true,
  notification: true,
  ios: false,
  standalone: false,
}

export type FakePushOptions = {
  env?: Partial<PushEnv>
  /** The permission now, and what a request answers. */
  permission?: NotificationPermission
  answer?: NotificationPermission
  /** Whether the browser has a subscription now. */
  subscribed?: boolean
  /** Whether reading the subscription throws, as a broken service worker registration does. */
  readFails?: boolean
  /** The status each server call answers; 204 (200 with the key) when not set. */
  status?: { key?: number; save?: number; remove?: number; seen?: number }
}

/** One request the fake server got. */
type FakePushRequest = { method: string; path: string; body: unknown }

const parseBody = (init: RequestInit | undefined): unknown => {
  if (typeof init?.body !== 'string') return undefined
  return JSON.parse(init.body)
}

export function fakePush(options: FakePushOptions = {}) {
  const requests: FakePushRequest[] = []
  let permission: NotificationPermission = options.permission ?? 'default'
  let subscribed = options.subscribed ?? false
  const unsubscribe = vi.fn(() => {
    subscribed = false
    return Promise.resolve(true)
  })
  const subscription = {
    endpoint: fakeEndpoint,
    unsubscribe,
    toJSON: () => ({ endpoint: fakeEndpoint, expirationTime: null, keys: { p256dh: 'BPk3', auth: 'a1b2' } }),
  }
  const asSubscription = (): PushSubscriptionLike => subscription
  vi.spyOn(pushBrowser, 'env').mockReturnValue({ ...desktopEnv, ...options.env })
  vi.spyOn(pushBrowser, 'permission').mockImplementation(() => permission)
  const requestPermission = vi.spyOn(pushBrowser, 'requestPermission').mockImplementation(() => {
    permission = options.answer ?? 'granted'
    return Promise.resolve(permission)
  })
  vi.spyOn(pushBrowser, 'subscription').mockImplementation(() =>
    options.readFails === true
      ? Promise.reject(new DOMException('no registration', 'InvalidStateError'))
      : Promise.resolve(subscribed ? asSubscription() : null),
  )
  const subscribe = vi.spyOn(pushBrowser, 'subscribe').mockImplementation(() => {
    subscribed = true
    return Promise.resolve(asSubscription())
  })
  const status = options.status ?? {}
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
      location.origin,
    )
    const method = init?.method ?? 'GET'
    requests.push({ method, path: url.pathname, body: parseBody(init) })
    if (url.pathname === '/api/push/key') {
      const code = status.key ?? 200
      return Promise.resolve(
        code === 200
          ? Response.json({ publicKey: fakePushKey })
          : Response.json({ error: { kind: 'internal', message: 'x', requestId: 'r' } }, { status: code }),
      )
    }
    const code =
      url.pathname === '/api/push/seen'
        ? (status.seen ?? 204)
        : method === 'DELETE'
          ? (status.remove ?? 204)
          : (status.save ?? 204)
    if (url.pathname.startsWith('/api/push/')) {
      return Promise.resolve(
        code === 204
          ? new Response(null, { status: 204 })
          : Response.json({ error: { kind: 'invalid-input', message: 'x', requestId: 'r' } }, { status: code }),
      )
    }
    return Promise.reject(new TypeError(`fakePush has no answer for ${url.pathname}`))
  })
  return { requests, requestPermission, subscribe, unsubscribe, isSubscribed: () => subscribed }
}
