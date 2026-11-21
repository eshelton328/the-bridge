import { describe, expect, it } from 'vitest'
import { PushKeyResponse, PushPayload, PushSeenRequest, PushSubscriptionRequest } from './push.ts'

const subscription = {
  endpoint: 'https://web.push.apple.com/QGexample',
  expirationTime: null,
  keys: { p256dh: 'BExampleKey_-', auth: 'exampleAuth' },
}

describe('the push contract', () => {
  it('takes a browser subscription and refuses an http endpoint, a padded key or another field', () => {
    expect(PushSubscriptionRequest.safeParse(subscription).success).toBe(true)
    expect(
      PushSubscriptionRequest.safeParse({ ...subscription, endpoint: 'http://web.push.apple.com/x' }).success,
    ).toBe(false)
    expect(PushSubscriptionRequest.safeParse({ ...subscription, keys: { p256dh: 'a=', auth: 'b' } }).success).toBe(
      false,
    )
    expect(PushSubscriptionRequest.safeParse({ ...subscription, user: 'x' }).success).toBe(false)
  })

  it('takes a public key of 87 base64url characters only', () => {
    expect(PushKeyResponse.safeParse({ publicKey: 'B'.repeat(87) }).success).toBe(true)
    expect(PushKeyResponse.safeParse({ publicKey: 'B'.repeat(86) }).success).toBe(false)
  })

  it('holds a payload of the chat, its name and the event, and no text', () => {
    expect(PushPayload.safeParse({ chat: 'test-mac/c1', name: 'writer', event: 'needsYou' }).success).toBe(true)
    expect(PushPayload.safeParse({ chat: 'test-mac/c1', name: 'writer', event: 'done', text: 'hi' }).success).toBe(
      false,
    )
    expect(PushSeenRequest.safeParse({ at: 1 }).success).toBe(false)
  })
})
