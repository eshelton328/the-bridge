// Web Push (d-118): the port of the store of the VAPID keys and the owner's
// push subscriptions.
import type { PushSubscriptionRequest } from '@bridge/contract'
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
