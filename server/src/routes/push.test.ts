// API tests of /api/push (d-118), in process with the disk push store in a
// temporary folder.
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ErrorBody, MachineId, PushKeyResponse } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { createDiskPushStore } from '../adapters/diskPush.ts'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { createApp } from '../app.ts'
import { memoryLogger } from '../logger.ts'
import { createPushSeen, knownPushService } from '../services/push.ts'

const local = { Host: '127.0.0.1:5181' }
const json = { ...local, 'Content-Type': 'application/json' }
const endpoint = 'https://web.push.apple.com/QGexample-endpoint'
const subscription = { endpoint, expirationTime: null, keys: { p256dh: 'BExampleKey', auth: 'exampleAuth' } }

function setup() {
  let time = 1_000_000
  const logger = memoryLogger()
  const push = createDiskPushStore(join(mkdtempSync(join(tmpdir(), 'bridge-push-')), 'push'))
  const seen = createPushSeen(() => time)
  const app = createApp({
    agents: createFakeAgents(MachineId.parse('test-mac')),
    owner: 'owner@example.com',
    log: logger.log,
    push,
    seen,
  })
  const send = (method: string, path: string, body: unknown) =>
    app.request(`/api/push${path}`, { method, headers: json, body: JSON.stringify(body) })
  return { app, push, seen, send, logger, later: (ms: number) => (time += ms) }
}

describe('/api/push', () => {
  it('gives the same VAPID public key each time', async () => {
    const { app } = setup()
    const first = PushKeyResponse.parse(await (await app.request('/api/push/key', { headers: local })).json())
    const again = PushKeyResponse.parse(await (await app.request('/api/push/key', { headers: local })).json())
    expect(again).toEqual(first)
  })

  it('saves and removes a subscription, and writes no endpoint or key to the log', async () => {
    const { push, send, logger } = setup()
    expect((await send('POST', '/subscriptions', subscription)).status).toBe(204)
    const saved = await push.subscriptions()
    expect(saved.ok && saved.value.map((s) => s.endpoint)).toEqual([endpoint])
    expect((await send('DELETE', '/subscriptions', { endpoint })).status).toBe(204)
    expect((await send('DELETE', '/subscriptions', { endpoint })).status).toBe(204)
    const left = await push.subscriptions()
    expect(left.ok && left.value).toEqual([])
    expect(logger.text()).not.toContain('QGexample')
  })

  it('keeps an endpoint in the form that the host check read, so a send goes to that host', async () => {
    const { push, send } = setup()
    const loose = 'https:/web.push.apple.com/QGexample-endpoint'
    expect((await send('POST', '/subscriptions', { ...subscription, endpoint: loose })).status).toBe(204)
    const saved = await push.subscriptions()
    expect(saved.ok && saved.value.map((s) => s.endpoint)).toEqual([endpoint])
    expect((await send('DELETE', '/subscriptions', { endpoint: loose })).status).toBe(204)
    const left = await push.subscriptions()
    expect(left.ok && left.value).toEqual([])
  })

  it('refuses an endpoint of an unknown host and a body that is not the contract, with 400', async () => {
    const { send } = setup()
    const other = await send('POST', '/subscriptions', { ...subscription, endpoint: 'https://push.example.com/x' })
    expect(other.status).toBe(400)
    expect(ErrorBody.parse(await other.json()).error.kind).toBe('invalid-input')
    expect((await send('POST', '/subscriptions', { endpoint })).status).toBe(400)
    expect((await send('POST', '/seen', { visible: true })).status).toBe(400)
  })

  it('counts a page as visible for 30 s after its seen', async () => {
    const { seen, send, later } = setup()
    expect(seen.visible()).toBe(false)
    expect((await send('POST', '/seen', {})).status).toBe(204)
    later(29_000)
    expect(seen.visible()).toBe(true)
    later(1_000)
    expect(seen.visible()).toBe(false)
  })

  it("takes only https endpoints on the hosts of the browsers' push services", () => {
    expect(knownPushService('https://fcm.googleapis.com/fcm/send/x')).toBe(true)
    expect(knownPushService('https://wns2-par02p.notify.windows.com/w/?token=x')).toBe(true)
    expect(knownPushService('https://web.push.apple.com.example.com/x')).toBe(false)
    expect(knownPushService('https://web.push.apple.com:8443/x')).toBe(false)
    expect(knownPushService('http://updates.push.services.mozilla.com/x')).toBe(false)
  })
})
