import { afterEach, describe, expect, it, vi } from 'vitest'
import { fakeEndpoint, fakePush, fakePushKey } from '../lib/fakePush.ts'
import { type PushMissError, setPushMissSink } from '../lib/pushSwitch.ts'
import { pushStore } from './pushStore.ts'
import { resetAllStores } from './resetStores.ts'

// The Notifications switch's store (d-118), driven through getState() with a fake browser and server (lib/fakePush.ts).

afterEach(() => {
  resetAllStores()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

/** Collects the push misses the store sends to the sink, by kind. */
function misses() {
  const kinds: string[] = []
  const remove = setPushMissSink((error: PushMissError) => {
    kinds.push(error.miss)
  })
  return { kinds, remove }
}

describe('pushStore', () => {
  it('starts unknown, not busy and not failed', () => {
    expect(pushStore.getState()).toMatchObject({ status: 'unknown', busy: false, failed: false })
  })

  it('reads off, on, denied, a Safari tab on iOS and a browser with no push', async () => {
    const { refresh } = pushStore.getState().actions
    fakePush({ permission: 'granted', subscribed: false })
    await refresh()
    expect(pushStore.getState().status).toBe('off')
    vi.restoreAllMocks()
    fakePush({ permission: 'granted', subscribed: true })
    await refresh()
    expect(pushStore.getState().status).toBe('on')
    vi.restoreAllMocks()
    fakePush({ permission: 'denied' })
    await refresh()
    expect(pushStore.getState().status).toBe('denied')
    vi.restoreAllMocks()
    fakePush({ env: { ios: true, standalone: false, pushManager: false } })
    await refresh()
    expect(pushStore.getState().status).toBe('homeScreen')
    vi.restoreAllMocks()
    fakePush({ env: { pushManager: false } })
    await refresh()
    expect(pushStore.getState().status).toBe('unsupported')
  })

  it('turns on: asks within the call, subscribes with the server key and saves the subscription', async () => {
    const push = fakePush()
    const turning = pushStore.getState().actions.setOn(true)
    // The permission request starts before the first wait, inside the tap.
    expect(push.requestPermission).toHaveBeenCalledOnce()
    expect(pushStore.getState().busy).toBe(true)
    await turning
    expect(push.subscribe).toHaveBeenCalledWith(fakePushKey)
    expect(push.requests).toEqual([
      { method: 'GET', path: '/api/push/key', body: undefined },
      {
        method: 'POST',
        path: '/api/push/subscriptions',
        body: { endpoint: fakeEndpoint, expirationTime: null, keys: { p256dh: 'BPk3', auth: 'a1b2' } },
      },
    ])
    expect(pushStore.getState()).toMatchObject({ status: 'on', busy: false, failed: false })
  })

  it('stays off and blocked when the owner denies the permission, with no subscription', async () => {
    const push = fakePush({ answer: 'denied' })
    await pushStore.getState().actions.setOn(true)
    expect(push.subscribe).not.toHaveBeenCalled()
    expect(push.requests).toEqual([])
    expect(pushStore.getState()).toMatchObject({ status: 'denied', failed: false })
  })

  it('stays off with no line when the owner closes the prompt', async () => {
    const push = fakePush({ answer: 'default' })
    await pushStore.getState().actions.setOn(true)
    expect(push.subscribe).not.toHaveBeenCalled()
    expect(pushStore.getState()).toMatchObject({ status: 'off', failed: false })
  })

  it('stays off with a line when the save misses, ends the subscription and reports the kind only', async () => {
    const sink = misses()
    const push = fakePush({ status: { save: 400 } })
    await pushStore.getState().actions.setOn(true)
    expect(push.unsubscribe).toHaveBeenCalledOnce()
    expect(push.isSubscribed()).toBe(false)
    expect(pushStore.getState()).toMatchObject({ status: 'off', failed: true, busy: false })
    expect(sink.kinds).toEqual(['save status-400'])
    sink.remove()
  })

  it('stays off with a line when the key read misses', async () => {
    const sink = misses()
    const push = fakePush({ status: { key: 503 } })
    await pushStore.getState().actions.setOn(true)
    expect(push.subscribe).not.toHaveBeenCalled()
    expect(pushStore.getState()).toMatchObject({ status: 'off', failed: true })
    expect(sink.kinds).toEqual(['key status-503'])
    sink.remove()
  })

  it('turns off: ends the subscription, then deletes it on the server by its endpoint', async () => {
    const push = fakePush({ permission: 'granted', subscribed: true })
    await pushStore.getState().actions.setOn(false)
    expect(push.requestPermission).not.toHaveBeenCalled()
    expect(push.unsubscribe).toHaveBeenCalledOnce()
    expect(push.requests).toEqual([
      { method: 'DELETE', path: '/api/push/subscriptions', body: { endpoint: fakeEndpoint } },
    ])
    expect(pushStore.getState()).toMatchObject({ status: 'off', failed: false })
  })

  it('takes no second turn while one runs', async () => {
    const push = fakePush()
    const first = pushStore.getState().actions.setOn(true)
    await pushStore.getState().actions.setOn(true)
    await first
    expect(push.requestPermission).toHaveBeenCalledOnce()
  })

  it('goes back to its first state on resetAllStores', async () => {
    fakePush({ permission: 'granted', subscribed: true })
    await pushStore.getState().actions.refresh()
    resetAllStores()
    expect(pushStore.getState().status).toBe('unknown')
  })
})
