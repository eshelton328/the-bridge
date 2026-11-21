// What the browser gives Web Push (d-118): whether it can push at all, the
// notification permission, and this browser's push subscription on the
// app's service worker (public/sw.js, registered by app/push/). One object,
// so a test replaces a method with vi.spyOn and never asks the real browser
// for a permission or a subscription.

/** Where push stands in this browser before any subscription. */
export type PushSupport = 'supported' | 'unsupported' | 'homeScreen'

/** What decides the support, read from the browser by `pushBrowser.env()`. */
export type PushEnv = {
  readonly secure: boolean
  readonly serviceWorker: boolean
  readonly pushManager: boolean
  readonly notification: boolean
  /** An iPhone or iPad, also an iPad that names itself a Mac. */
  readonly ios: boolean
  /** The page runs as the home-screen app (`navigator.standalone`, or display-mode standalone). */
  readonly standalone: boolean
}

/**
 * iOS pushes only to the home-screen app: in Safari's tab it is `homeScreen`, so the row can say how to get it. Any
 * other browser without a secure context, a service worker, PushManager or Notification is `unsupported`.
 */
export function pushSupportOf(env: PushEnv): PushSupport {
  if (env.ios && !env.standalone) return 'homeScreen'
  if (!env.secure || !env.serviceWorker || !env.pushManager || !env.notification) return 'unsupported'
  return 'supported'
}

/** A VAPID key in base64url as the bytes `pushManager.subscribe()` takes. */
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64url
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(base64url.length / 4) * 4, '=')
  const text = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(text.length))
  for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i)
  return bytes
}

/** What the app reads of a push subscription. */
export type PushSubscriptionLike = Pick<PushSubscription, 'endpoint' | 'unsubscribe' | 'toJSON'>

/** The app's service worker registration, if one is registered (none in tests and Storybook). */
const registration = (): Promise<ServiceWorkerRegistration | undefined> =>
  'serviceWorker' in navigator ? navigator.serviceWorker.getRegistration('/') : Promise.resolve(undefined)

export const pushBrowser = {
  env(): PushEnv {
    const ua = navigator.userAgent
    return {
      secure: window.isSecureContext,
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notification: 'Notification' in window,
      ios: /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1),
      standalone:
        Reflect.get(navigator, 'standalone') === true || window.matchMedia('(display-mode: standalone)').matches,
    }
  },
  permission(): NotificationPermission {
    return 'Notification' in window ? Notification.permission : 'denied'
  },
  /** Asks for the permission; call it in the tap's own handler, as iOS asks only in a user gesture. */
  requestPermission(): Promise<NotificationPermission> {
    return Notification.requestPermission()
  },
  async subscription(): Promise<PushSubscriptionLike | null> {
    const found = await registration()
    return found === undefined ? null : found.pushManager.getSubscription()
  },
  /** Subscribes with the server's key; undefined when the app has no service worker registered. */
  async subscribe(publicKey: string): Promise<PushSubscriptionLike | undefined> {
    const found = await registration()
    if (found === undefined) return undefined
    // A worker that still installs cannot subscribe; `ready` resolves once one is active.
    const active = found.active === null ? await navigator.serviceWorker.ready : found
    return active.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) })
  },
}
