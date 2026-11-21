import { createECDH, randomBytes } from 'node:crypto'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ChatId } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { createDiskPushStore } from './diskPush.ts'
import { createWebPushSender } from './webPushSender.ts'

describe('the web-push sender', () => {
  it('encrypts and signs with the stored VAPID keys, and gives only an errno code when the service does not answer', async () => {
    const keys = await createDiskPushStore(join(mkdtempSync(join(tmpdir(), 'bridge-push-')), 'push')).keys()
    if (!keys.ok) throw new Error('the store failed')
    const browser = createECDH('prime256v1')
    browser.generateKeys()
    // Nothing listens on port 9, so the request fails after the payload was encrypted and the JWT signed.
    const subscription = {
      endpoint: 'https://127.0.0.1:9/push/example',
      keys: { p256dh: browser.getPublicKey('base64url'), auth: randomBytes(16).toString('base64url') },
    }
    const payload = { chat: ChatId.parse('test-mac/c1'), name: 'writer', event: 'done' as const }
    const sent = await createWebPushSender('mailto:push@example.com').send(subscription, payload, keys.value)
    expect(sent).toEqual({ ok: false, error: { code: 'ECONNREFUSED' } })
  })
})
