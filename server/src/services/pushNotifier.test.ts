import { ChatId, MachineId, type PushPayload, type PushSubscriptionRequest } from '@bridge/contract'
import { err, ok } from '@bridge/shared'
import { describe, expect, it } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { memoryLogger } from '../logger.ts'
import { createPushSeen, type PushSender, type PushStore, type StoredSubscription } from './push.ts'
import { createPushNotifier } from './pushNotifier.ts'

const machine = MachineId.parse('test-mac')
const chat = ChatId.parse('test-mac/bridge-themes')
const keys = { publicKey: 'public', privateKey: 'private' }
const sub = (n: number): StoredSubscription => ({
  endpoint: `https://web.push.apple.com/example-${String(n)}`,
  keys: { p256dh: 'p', auth: 'a' },
  savedAt: n,
})

function setup(stored: StoredSubscription[], answer: (s: PushSubscriptionRequest) => 'sent' | 'gone' = () => 'sent') {
  let list = [...stored]
  let time = 1_000_000
  const sent: { endpoint: string; payload: PushPayload }[] = []
  const store: PushStore = {
    keys: () => Promise.resolve(ok(keys)),
    subscriptions: () => Promise.resolve(ok(list)),
    save: () => Promise.resolve(err({ reason: 'failed', code: 'unused' })),
    remove: (endpoint) => {
      list = list.filter((s) => s.endpoint !== endpoint)
      return Promise.resolve(ok(undefined))
    },
  }
  const sender: PushSender = {
    send: (subscription, payload) => {
      sent.push({ endpoint: subscription.endpoint, payload })
      return Promise.resolve(ok(answer(subscription)))
    },
  }
  const agents = createFakeAgents(machine)
  let watches = 0
  const counted = {
    ...agents,
    subscribe: (...args: Parameters<typeof agents.subscribe>) => ((watches += 1), agents.subscribe(...args)),
  }
  const seen = createPushSeen(() => time)
  const notifier = createPushNotifier({ agents: counted, store, sender, seen, log: memoryLogger().log })
  const settle = () => new Promise((resolve) => setTimeout(resolve, 10))
  return {
    agents,
    notifier,
    sent,
    seen,
    settle,
    watches: () => watches,
    stored: () => list,
    later: (ms: number) => (time += ms),
  }
}

describe('the push notifier', () => {
  it('sends needsYou and done to each subscription, with the chat name and no text', async () => {
    const t = setup([sub(1), sub(2)])
    await t.notifier.refresh()
    t.agents.setStatus(chat, 'needsYou')
    await t.settle()
    t.agents.setStatus(chat, 'working')
    t.agents.setStatus(chat, 'done')
    await t.settle()
    expect(t.sent.map((s) => [s.endpoint, s.payload])).toEqual([
      [sub(1).endpoint, { chat, name: 'bridge themes', event: 'needsYou' }],
      [sub(2).endpoint, { chat, name: 'bridge themes', event: 'needsYou' }],
      [sub(1).endpoint, { chat, name: 'bridge themes', event: 'done' }],
      [sub(2).endpoint, { chat, name: 'bridge themes', event: 'done' }],
    ])
    // A done that no working came before, such as after idle, sends nothing.
    t.agents.setStatus(chat, 'idle')
    t.agents.setStatus(chat, 'done')
    await t.settle()
    expect(t.sent).toHaveLength(4)
    t.notifier.close()
  })

  it('sends nothing while a page was seen in the last 30 s', async () => {
    const t = setup([sub(1)])
    await t.notifier.refresh()
    t.seen.seen()
    t.agents.setStatus(chat, 'needsYou')
    await t.settle()
    expect(t.sent).toEqual([])
    t.later(30_000)
    t.agents.setStatus(chat, 'working')
    t.agents.setStatus(chat, 'needsYou')
    await t.settle()
    expect(t.sent).toHaveLength(1)
    t.notifier.close()
  })

  it('drops a subscription that the push service no longer knows', async () => {
    const t = setup([sub(1), sub(2)], (s) => (s.endpoint === sub(1).endpoint ? 'gone' : 'sent'))
    await t.notifier.refresh()
    t.agents.setStatus(chat, 'needsYou')
    await t.settle()
    expect(t.stored().map((s) => s.endpoint)).toEqual([sub(2).endpoint])
    t.notifier.close()
  })

  it('holds no watch of the agents while no subscription is stored', async () => {
    const t = setup([])
    await t.notifier.refresh()
    t.agents.setStatus(chat, 'needsYou')
    await t.settle()
    expect(t.watches()).toBe(0)
    expect(t.sent).toEqual([])
  })
})
