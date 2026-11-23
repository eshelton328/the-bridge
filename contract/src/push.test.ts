import { describe, expect, it } from 'vitest'
import {
  maxPushBody,
  maxPushName,
  PushKeyResponse,
  PushPayload,
  PushSeenRequest,
  PushSubscriptionRequest,
} from './push.ts'

const subscription = {
  endpoint: 'https://web.push.apple.com/QGexample',
  expirationTime: null,
  keys: { p256dh: 'BExampleKey_-', auth: 'exampleAuth' },
}

/** The UTF-8 bytes of a text: 1 to 4 for each code point. */
const utf8Bytes = (text: string) =>
  Array.from(text).reduce((sum, ch) => {
    const code = ch.codePointAt(0) ?? 0
    return sum + (code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4)
  }, 0)

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

  it('takes the preview choice with a subscription, and reads none as no field', () => {
    expect(PushSubscriptionRequest.safeParse({ ...subscription, preview: false }).success).toBe(true)
    expect(PushSubscriptionRequest.safeParse({ ...subscription, preview: 'no' }).success).toBe(false)
  })

  it('takes a public key of 87 base64url characters only', () => {
    expect(PushKeyResponse.safeParse({ publicKey: 'B'.repeat(87) }).success).toBe(true)
    expect(PushKeyResponse.safeParse({ publicKey: 'B'.repeat(86) }).success).toBe(false)
  })

  const payload = { chat: 'test-mac/c1', name: 'writer', workspace: 'the-bridge', event: 'done', body: null }

  it('holds a payload of the chat, its name, its workspace, the event and an optional preview line', () => {
    expect(PushPayload.safeParse(payload).success).toBe(true)
    expect(PushPayload.safeParse({ ...payload, event: 'needsYou', body: 'Wants to run: pnpm' }).success).toBe(true)
    expect(PushPayload.safeParse({ ...payload, text: 'hi' }).success).toBe(false)
    expect(PushPayload.safeParse({ ...payload, body: '' }).success).toBe(false)
    expect(PushPayload.safeParse({ chat: 'test-mac/c1', name: 'writer', event: 'done' }).success).toBe(false)
    expect(PushSeenRequest.safeParse({ at: 1 }).success).toBe(false)
  })

  it('counts the preview line in code points, so an emoji is one of its 140', () => {
    expect(PushPayload.safeParse({ ...payload, body: '😀'.repeat(maxPushBody) }).success).toBe(true)
    expect(PushPayload.safeParse({ ...payload, body: '😀'.repeat(maxPushBody + 1) }).success).toBe(false)
  })

  it('stays under the 4 KB Web Push limit at the largest names and line', () => {
    // RFC 8291: one record of 4096 bytes holds the text, a 16-byte tag, a padding byte and the 86-byte header.
    const largest = PushPayload.parse({
      chat: `${'m'.repeat(63)}/${'s'.repeat(200)}`,
      name: '😀'.repeat(maxPushName),
      workspace: '😀'.repeat(maxPushName),
      event: 'needsYou',
      body: '😀'.repeat(maxPushBody),
    })
    expect(utf8Bytes(JSON.stringify(largest))).toBeLessThan(4096 - 86 - 16 - 1)
  })
})
