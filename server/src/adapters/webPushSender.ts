// Sends a Web Push with the web-push package (d-118): the payload is
// encrypted for the browser's keys and signed with the server's VAPID key.
// A fault gives the push service's HTTP status or an errno code only.
import { err, ok } from '@bridge/shared'
import webpush from 'web-push'
import { canonicalEndpoint, type PushSender } from '../services/push.ts'

const codeOf = (thrown: unknown) =>
  thrown instanceof Error && 'code' in thrown && typeof thrown.code === 'string' ? thrown.code : 'unknown'

/** `subject` is the contact that the push service may use: a mailto: or https: URL. */
export function createWebPushSender(subject: string): PushSender {
  return {
    async send(subscription, payload, keys) {
      try {
        await webpush.sendNotification(
          { endpoint: canonicalEndpoint(subscription.endpoint), keys: subscription.keys },
          JSON.stringify(payload),
          {
            vapidDetails: { subject, publicKey: keys.publicKey, privateKey: keys.privateKey },
            TTL: 3600,
            urgency: 'high',
            timeout: 10_000,
          },
        )
        return ok('sent')
      } catch (thrown) {
        if (thrown instanceof webpush.WebPushError)
          return thrown.statusCode === 404 || thrown.statusCode === 410
            ? ok('gone')
            : err({ code: `http-${String(thrown.statusCode)}` })
        return err({ code: codeOf(thrown) })
      }
    },
  }
}
