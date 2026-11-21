import { mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { maxPushSubscriptions, PushKeyResponse } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { createDiskPushStore } from './diskPush.ts'

const newRoot = () => join(mkdtempSync(join(tmpdir(), 'bridge-push-')), 'push')
const sub = (n: number) => ({
  endpoint: `https://web.push.apple.com/example-${String(n)}`,
  keys: { p256dh: `key${String(n)}`, auth: 'auth' },
})
const value = <T>(result: { ok: true; value: T } | { ok: false; error: unknown }): T => {
  if (!result.ok) throw new Error('the store failed')
  return result.value
}

describe('the disk push store', () => {
  it('makes the VAPID keys once, in a 0600 file of a 0700 folder, with a public key the contract takes', async () => {
    const root = newRoot()
    const keys = value(await createDiskPushStore(root).keys())
    expect(PushKeyResponse.safeParse({ publicKey: keys.publicKey }).success).toBe(true)
    expect(Buffer.from(keys.privateKey, 'base64url')).toHaveLength(32)
    // A new store on the same folder, as after a restart, keeps the same keys.
    expect(value(await createDiskPushStore(root).keys())).toEqual(keys)
    expect(statSync(root).mode & 0o777).toBe(0o700)
    expect(statSync(join(root, 'vapid.json')).mode & 0o777).toBe(0o600)
  })

  it('replaces a subscription of the same endpoint, keeps the newest ten and removes one by endpoint', async () => {
    const root = newRoot()
    let time = 0
    const store = createDiskPushStore(root, () => (time += 1))
    await Promise.all(Array.from({ length: maxPushSubscriptions + 2 }, (_, n) => store.save(sub(n))))
    await store.save({ ...sub(11), keys: { p256dh: 'newKey', auth: 'auth' } })
    const kept = value(await store.subscriptions())
    expect(kept.map((s) => s.endpoint)).toEqual(
      Array.from({ length: 10 }, (_, n) => sub(n + 2).endpoint)
        .filter((e) => e !== sub(11).endpoint)
        .concat(sub(11).endpoint),
    )
    expect(kept.at(-1)?.keys.p256dh).toBe('newKey')
    await store.remove(sub(5).endpoint)
    await store.remove('https://web.push.apple.com/unknown')
    expect(value(await store.subscriptions()).map((s) => s.endpoint)).not.toContain(sub(5).endpoint)
    expect(statSync(join(root, 'subscriptions.json')).mode & 0o777).toBe(0o600)
    expect(readdirSync(root).filter((name) => name.endsWith('.tmp'))).toEqual([])
    expect(JSON.parse(readFileSync(join(root, 'subscriptions.json'), 'utf8'))).toHaveLength(9)
  })

  it('removes a subscription saved in a loose form by its written form', async () => {
    const store = createDiskPushStore(newRoot())
    value(await store.save({ ...sub(1), endpoint: 'https:/web.push.apple.com/example-1' }))
    value(await store.remove(sub(1).endpoint))
    expect(value(await store.subscriptions())).toEqual([])
  })

  it('gives no subscriptions before the first save, and an errno code when the folder cannot be made', async () => {
    expect(value(await createDiskPushStore(newRoot()).subscriptions())).toEqual([])
    const blocked = createDiskPushStore('/dev/null/push')
    expect(await blocked.keys()).toEqual({ ok: false, error: { reason: 'failed', code: 'ENOTDIR' } })
  })
})
