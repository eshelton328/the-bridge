import { afterEach, describe, expect, it, vi } from 'vitest'
import { fakeEndpoint, fakePush } from './fakePush.ts'
import { savePushPreviewAtStart } from './pushSwitch.ts'

// The save at the app's start (d-118): a subscription from before the preview choice gets the key, so the server
// stops sending sw.js version 2's payload to it.

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('savePushPreviewAtStart', () => {
  it('saves the subscription again with the preview choice when push is on', async () => {
    const push = fakePush({ permission: 'granted', subscribed: true })
    await savePushPreviewAtStart(true)
    expect(push.requests).toEqual([
      {
        method: 'POST',
        path: '/api/push/subscriptions',
        body: { endpoint: fakeEndpoint, expirationTime: null, keys: { p256dh: 'BPk3', auth: 'a1b2' }, preview: true },
      },
    ])
  })

  it('sends nothing when push is off, blocked or has no permission yet', async () => {
    for (const options of [
      { permission: 'granted' as const, subscribed: false },
      { permission: 'denied' as const },
      { permission: 'default' as const },
    ]) {
      const push = fakePush(options)
      await savePushPreviewAtStart(true)
      expect(push.requests).toEqual([])
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    }
  })
})
