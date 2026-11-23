// Web Push (d-118): the server's VAPID public key, the owner's push
// subscriptions, the page's "seen" signal and the payload of one push. A
// payload names the chat, its workspace and the event, and, when the
// subscription wants a preview, one short line of what the chat did or
// waits on (bridge-coord, 2026-11-23): never a code block, a tool result
// or a file's text.
import { z } from 'zod'
import { ChatId } from './ids.ts'

/** The most push subscriptions the server keeps; a new one past it replaces the oldest. */
export const maxPushSubscriptions = 10
/** The most characters of the chat name, or of the workspace name, in a push. */
export const maxPushName = 120
/** The most characters (code points) of a push's preview line. */
export const maxPushBody = 140

const base64url = /^[A-Za-z0-9_-]+$/

/** The response of `GET /api/push/key`: the VAPID public key, an uncompressed P-256 point in base64url. */
export const PushKeyResponse = z.strictObject({ publicKey: z.string().regex(/^[A-Za-z0-9_-]{87}$/) })
export type PushKeyResponse = z.infer<typeof PushKeyResponse>

/** A push service's URL for one browser; the server checks its host. */
const PushEndpoint = z.url({ protocol: /^https$/ }).max(1024)

/** The body of `POST /api/push/subscriptions`: the browser's `PushSubscription.toJSON()`. */
export const PushSubscriptionRequest = z.strictObject({
  endpoint: PushEndpoint,
  expirationTime: z.number().nullable().optional(),
  keys: z.strictObject({
    p256dh: z.string().regex(base64url).max(128),
    auth: z.string().regex(base64url).max(64),
  }),
  /** Whether a push to this browser may hold a preview line ("Show message preview"); absent is true. */
  preview: z.boolean().optional(),
})
export type PushSubscriptionRequest = z.infer<typeof PushSubscriptionRequest>

/** The body of `DELETE /api/push/subscriptions`. */
export const PushUnsubscribeRequest = z.strictObject({ endpoint: PushEndpoint })
export type PushUnsubscribeRequest = z.infer<typeof PushUnsubscribeRequest>

/** The body of `POST /api/push/seen`, which a visible page sends: no push goes while one was seen in 30 s. */
export const PushSeenRequest = z.strictObject({})
export type PushSeenRequest = z.infer<typeof PushSeenRequest>

/** Why a push goes: a chat waits for the owner, or a chat finished its turn. */
export const PushEvent = z.enum(['needsYou', 'done'])
export type PushEvent = z.infer<typeof PushEvent>

/** The JSON text of one push: the chat, its name, its workspace's name, the event and the preview line (null: none). */
export const PushPayload = z.strictObject({
  chat: ChatId,
  name: z.string().max(maxPushName),
  workspace: z.string().max(maxPushName),
  event: PushEvent,
  body: z
    .string()
    .min(1)
    .refine((text) => Array.from(text).length <= maxPushBody, { message: `at most ${String(maxPushBody)} characters` })
    .nullable(),
})
export type PushPayload = z.infer<typeof PushPayload>
