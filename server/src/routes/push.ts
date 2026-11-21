// /api/push (d-118): the VAPID public key, the owner's push subscriptions
// and the "seen" signal of a visible page. A subscription's endpoint must
// be a known push service, as the server will send to it. No endpoint or
// key goes into a log line or an error body; a store fault logs its code.
import { PushKeyResponse, PushSeenRequest, PushSubscriptionRequest, PushUnsubscribeRequest } from '@bridge/contract'
import { type Context, Hono } from 'hono'
import { type AppEnv, errorJson, internalMessage } from '../errors.ts'
import type { Logger } from '../logger.ts'
import {
  canonicalEndpoint,
  knownPushService,
  type PushSeen,
  type PushStore,
  type PushStoreError,
} from '../services/push.ts'
import { jsonBody, jsonOnly, smallJson } from './jsonBody.ts'

/** `changed` runs after each save or remove of a subscription, so the sender watches the chats only while one is stored. */
export function pushRoutes(store: PushStore, seen: PushSeen, log: Logger, changed: () => void = () => undefined) {
  const failed = (c: Context<AppEnv>, error: PushStoreError) => {
    log.error('push store failed', { requestId: c.get('requestId'), code: error.code })
    return errorJson(c, 'internal', { message: internalMessage })
  }
  return new Hono<AppEnv>()
    .get('/key', async (c) => {
      const keys = await store.keys()
      if (!keys.ok) return failed(c, keys.error)
      return c.json(PushKeyResponse.parse({ publicKey: keys.value.publicKey }), 200)
    })
    .post('/subscriptions', smallJson, jsonOnly, jsonBody(PushSubscriptionRequest), async (c) => {
      const subscription = c.req.valid('json')
      if (!knownPushService(subscription.endpoint))
        return errorJson(c, 'invalid-input', {
          message: 'the endpoint is not a known push service',
          issues: ['endpoint: unknown push service'],
        })
      // The written form can be longer than the sent one (each "é" becomes "%C3%A9"), so the contract checks it again.
      const written = PushSubscriptionRequest.safeParse({
        ...subscription,
        endpoint: canonicalEndpoint(subscription.endpoint),
      })
      if (!written.success)
        return errorJson(c, 'invalid-input', {
          message: 'the endpoint is too long',
          issues: ['endpoint: too long as a URL'],
        })
      const saved = await store.save(written.data)
      if (!saved.ok) return failed(c, saved.error)
      changed()
      return c.body(null, 204)
    })
    .delete('/subscriptions', smallJson, jsonOnly, jsonBody(PushUnsubscribeRequest), async (c) => {
      const removed = await store.remove(canonicalEndpoint(c.req.valid('json').endpoint))
      if (!removed.ok) return failed(c, removed.error)
      changed()
      return c.body(null, 204)
    })
    .post('/seen', smallJson, jsonOnly, jsonBody(PushSeenRequest), (c) => {
      seen.seen()
      return c.body(null, 204)
    })
}
