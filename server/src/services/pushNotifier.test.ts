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

function setup(
  stored: StoredSubscription[],
  answer: (s: PushSubscriptionRequest) => 'sent' | 'gone' | 'fail' = () => 'sent',
) {
  const logged = memoryLogger()
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
      const outcome = answer(subscription)
      return Promise.resolve(outcome === 'fail' ? err({ code: '500' }) : ok(outcome))
    },
  }
  const agents = createFakeAgents(machine)
  let watches = 0
  let reads = 0
  const counted = {
    ...agents,
    subscribe: (...args: Parameters<typeof agents.subscribe>) => ((watches += 1), agents.subscribe(...args)),
    readTranscript: (...args: Parameters<typeof agents.readTranscript>) => (
      (reads += 1), agents.readTranscript(...args)
    ),
  }
  const seen = createPushSeen(() => time)
  const notifier = createPushNotifier({ agents: counted, store, sender, seen, log: logged.log })
  const settle = () => new Promise((resolve) => setTimeout(resolve, 10))
  return {
    agents,
    notifier,
    sent,
    seen,
    settle,
    store,
    watches: () => watches,
    reads: () => reads,
    logText: logged.text,
    stored: () => list,
    later: (ms: number) => (time += ms),
  }
}

describe('the push notifier', () => {
  it('sends needsYou and done to each subscription, with the chat and workspace names and the preview line', async () => {
    const t = setup([sub(1), sub(2)])
    await t.notifier.refresh()
    t.agents.setStatus(chat, 'needsYou')
    await t.settle()
    t.agents.setStatus(chat, 'working')
    t.agents.setStatus(chat, 'done')
    await t.settle()
    const named = { chat, name: 'bridge themes', workspace: 'omni-brain' }
    // The fake's transcript ends with a running `pnpm` call after the reply "The theme now reads …".
    const asks = { ...named, event: 'needsYou', body: 'Wants to run: pnpm' }
    const ends = { ...named, event: 'done', body: 'The theme now reads prefers-color-scheme.' }
    expect(t.sent.map((s) => [s.endpoint, s.payload])).toEqual([
      [sub(1).endpoint, asks],
      [sub(2).endpoint, asks],
      [sub(1).endpoint, ends],
      [sub(2).endpoint, ends],
    ])
    // A done that no working came before, such as after idle, sends nothing.
    t.agents.setStatus(chat, 'idle')
    t.agents.setStatus(chat, 'done')
    await t.settle()
    expect(t.sent).toHaveLength(4)
    t.notifier.close()
  })

  it('sends no preview line to a subscription that turned the preview off, and reads no transcript for it', async () => {
    const t = setup([{ ...sub(1), preview: false }, sub(2)])
    await t.notifier.refresh()
    t.agents.setStatus(chat, 'needsYou')
    await t.settle()
    expect(t.sent.map((s) => [s.endpoint, s.payload.body])).toEqual([
      [sub(1).endpoint, null],
      [sub(2).endpoint, 'Wants to run: pnpm'],
    ])
    const only = setup([{ ...sub(1), preview: false }])
    await only.notifier.refresh()
    only.agents.setStatus(chat, 'needsYou')
    await only.settle()
    expect(only.sent.map((s) => s.payload.body)).toEqual([null])
    expect(only.reads()).toBe(0)
    t.notifier.close()
    only.notifier.close()
  })

  it('writes no preview line or workspace name into a log line, also when a send fails', async () => {
    const t = setup([sub(1)], () => 'fail')
    await t.notifier.refresh()
    t.agents.setStatus(chat, 'needsYou')
    await t.settle()
    expect(t.sent).toHaveLength(1)
    expect(t.logText()).toContain('push failed')
    expect(t.logText()).not.toContain('Wants to run')
    expect(t.logText()).not.toContain('omni-brain')
    expect(t.logText()).not.toContain('bridge themes')
    t.notifier.close()
  })

  it('sends done when a working chat goes to idle, as in the pane that the Mac shows', async () => {
    const t = setup([sub(1)])
    await t.notifier.refresh()
    t.agents.setStatus(chat, 'working')
    t.agents.setStatus(chat, 'idle')
    await t.settle()
    expect(t.sent.map((s) => [s.payload.chat, s.payload.event])).toEqual([[chat, 'done']])
    t.notifier.close()
  })

  it('sends done for a chat that a list change added while it worked', async () => {
    const t = setup([sub(1)])
    await t.notifier.refresh()
    const next = ChatId.parse('test-mac/bridge-themes-next')
    t.agents.renewSession(chat, next)
    await t.settle()
    t.agents.setStatus(next, 'done')
    await t.settle()
    expect(t.sent.map((s) => [s.payload.chat, s.payload.event])).toEqual([[next, 'done']])
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

  it('closes the watch of the agents when the push service drops the last subscription', async () => {
    const t = setup([sub(1)], () => 'gone')
    await t.notifier.refresh()
    expect(t.agents.subscriptions()).toBe(1)
    t.agents.setStatus(chat, 'needsYou')
    await t.settle()
    expect(t.stored()).toEqual([])
    expect(t.agents.subscriptions()).toBe(0)
    t.notifier.close()
  })

  it('opens no watch when the last subscription is removed during the first list read', async () => {
    const t = setup([sub(1)])
    const first = t.notifier.refresh()
    await t.store.remove(sub(1).endpoint)
    await t.notifier.refresh()
    await first
    await t.settle()
    expect(t.agents.subscriptions()).toBe(0)
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
