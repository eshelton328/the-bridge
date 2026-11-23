// Web Push (d-118): the store of the VAPID keys and the owner's push
// subscriptions, which push services a subscription may name, and when the
// owner last had a page open.
import type { PushMessage, PushSubscriptionRequest } from '@bridge/contract'
import type { Result } from '@bridge/shared'

/** The server's VAPID keys, base64url: the public key as an uncompressed P-256 point, the private key as its d. */
export type VapidKeys = { readonly publicKey: string; readonly privateKey: string }

/** A subscription and when it was saved (ms). */
export type StoredSubscription = PushSubscriptionRequest & { readonly savedAt: number }

/** A store fault: its errno code only, never a path or a key. */
export type PushStoreError = { readonly reason: 'failed'; readonly code: string }

export type PushStore = {
  /** The VAPID keys, made the first time and kept after that. */
  keys(): Promise<Result<VapidKeys, PushStoreError>>
  subscriptions(): Promise<Result<StoredSubscription[], PushStoreError>>
  /** Saves a subscription; one of the same endpoint is replaced, and past the limit the oldest goes. */
  save(subscription: PushSubscriptionRequest): Promise<Result<void, PushStoreError>>
  /** Removes the subscription of `endpoint`, if there is one. */
  remove(endpoint: string): Promise<Result<void, PushStoreError>>
}

/** A send fault: the push service's HTTP status or an errno code, never the endpoint. */
type PushSendError = { readonly code: string }

export type PushSender = {
  /** Sends one push; `gone` when the push service no longer knows the subscription (404 or 410). */
  send(
    subscription: PushSubscriptionRequest,
    payload: PushMessage,
    keys: VapidKeys,
  ): Promise<Result<'sent' | 'gone', PushSendError>>
}

/** The hosts of the push services of Safari, Chrome, Firefox and Edge; the server sends to no other host. */
const pushHosts = [
  /^web\.push\.apple\.com$/,
  /^fcm\.googleapis\.com$/,
  /^updates\.push\.services\.mozilla\.com$/,
  /\.notify\.windows\.com$/,
]

/** Whether `endpoint` is an https URL of a known push service. */
export function knownPushService(endpoint: string): boolean {
  if (!URL.canParse(endpoint)) return false
  const url = new URL(endpoint)
  return url.protocol === 'https:' && url.port === '' && pushHosts.some((host) => host.test(url.hostname))
}

/**
 * The endpoint as the WHATWG URL parser writes it. The host check reads that form, and web-push
 * parses with Node's old url.parse, which reads `https:/host/x` as no host, so a send must use it.
 */
export function canonicalEndpoint(endpoint: string): string {
  return URL.canParse(endpoint) ? new URL(endpoint).href : endpoint
}

/** How long after a page's "seen" no push goes. */
const seenWindowMs = 30_000

export type PushSeen = {
  /** A page of the owner is visible now. */
  seen(): void
  /** Whether a page was visible in the last `seenWindowMs`. */
  visible(): boolean
}

export function createPushSeen(now: () => number = Date.now): PushSeen {
  let last = Number.NEGATIVE_INFINITY
  return {
    seen: () => {
      last = now()
    },
    visible: () => now() - last < seenWindowMs,
  }
}
