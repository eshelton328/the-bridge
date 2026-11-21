// The server side of Web Push (d-118), as the contract's push.ts has it:
// `GET /api/push/key` for the VAPID public key, `POST` and `DELETE
// /api/push/subscriptions` for this browser's subscription, and `POST
// /api/push/seen`, which a visible page sends so the server holds its
// pushes. Each call answers a miss kind, never the server's message.
import { PushKeyResponse, PushSeenRequest, PushSubscriptionRequest, PushUnsubscribeRequest } from '@bridge/contract'
import { api } from './api.ts'

/** A call that missed: `network` (no answer), `status-<n>` (an answer that is not the success), or `invalid-key`. */
export type PushServerMiss = { readonly miss: string }

const missOf = (status: number): PushServerMiss => ({ miss: `status-${String(status)}` })
const network: PushServerMiss = { miss: 'network' }

/** The VAPID public key in base64url, or the miss. */
export async function readPushKey(): Promise<string | PushServerMiss> {
  try {
    const answer = await api.api.push.key.$get()
    if (!answer.ok) return missOf(answer.status)
    const parsed = PushKeyResponse.safeParse(await answer.json())
    return parsed.success ? parsed.data.publicKey : { miss: 'invalid-key' }
  } catch {
    return network
  }
}

/** Saves this browser's subscription (`PushSubscription.toJSON()`); undefined on a 204. */
export async function savePushSubscription(subscription: unknown): Promise<PushServerMiss | undefined> {
  const body = PushSubscriptionRequest.safeParse(subscription)
  if (!body.success) return { miss: 'invalid-subscription' }
  try {
    const answer = await api.api.push.subscriptions.$post({ json: body.data })
    return answer.status === 204 ? undefined : missOf(answer.status)
  } catch {
    return network
  }
}

/** Removes the subscription with `endpoint`; undefined on a 204, which the server also answers for one it does not know. */
export async function removePushSubscription(endpoint: string): Promise<PushServerMiss | undefined> {
  const body = PushUnsubscribeRequest.safeParse({ endpoint })
  if (!body.success) return { miss: 'invalid-endpoint' }
  try {
    const answer = await api.api.push.subscriptions.$delete({ json: body.data })
    return answer.status === 204 ? undefined : missOf(answer.status)
  } catch {
    return network
  }
}

/** Tells the server a page of the app shows now; undefined on a 204. */
export async function sendPushSeen(): Promise<PushServerMiss | undefined> {
  try {
    const answer = await api.api.push.seen.$post({ json: PushSeenRequest.parse({}) })
    return answer.status === 204 ? undefined : missOf(answer.status)
  } catch {
    return network
  }
}
