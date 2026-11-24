// The side answer stream with a stub service, so a test can change the answer while the reader waits.
import { ChatId, SideAnswer, SideChangedEvent, SideId } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { memoryLogger } from '../logger.ts'
import type { SideAnswers } from '../services/sideAnswers.ts'
import { sidesRoutes } from './sides.ts'

const chat = ChatId.parse('test-mac/bridge-themes')
const side = SideId.parse('a1b2c3d4e5f60718')
const path = `/${encodeURIComponent(chat)}/side/${side}/events`
const at = (text: string, state: SideAnswer['state'] = 'answering') =>
  SideAnswer.parse({ side, chat, state, text, cut: false })

/** A service with one answer; `change` tells each watch, and `watches` counts the open ones. */
function stub() {
  let answer = at('')
  const listeners = new Set<(a: SideAnswer) => void>()
  const sides: SideAnswers = {
    ask: () => Promise.reject(new Error('not used')),
    get: (c, s) => (c === chat && s === side ? answer : undefined),
    stop: () => 'notFound',
    watch: (c, s, listener) => {
      if (c !== chat || s !== side) return undefined
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
  const change = (next: SideAnswer) => {
    answer = next
    for (const l of listeners) l(next)
  }
  return { sides, change, watches: () => listeners.size }
}

/** All SSE data lines of a body that ends. */
async function events(body: ReadableStream<Uint8Array>): Promise<SideChangedEvent[]> {
  const text = await new Response(body).text()
  return text
    .split('\n')
    .filter((l) => l.startsWith('data: ') && l !== 'data: {}')
    .map((l) => SideChangedEvent.parse(JSON.parse(l.slice('data: '.length))))
}

describe('side answer stream', () => {
  it('sends a slow reader the newest answer, not each one that came while it waited', async () => {
    const { sides, change, watches } = stub()
    const res = await sidesRoutes(sides, memoryLogger().log).request(path)
    if (res.body === null) throw new Error('no body')
    for (let at0 = 0; at0 < 10 && watches() === 0; at0++) await new Promise((r) => setTimeout(r, 5))
    for (let i = 1; i <= 200; i++) change(at('x'.repeat(i)))
    change(at('x'.repeat(200), 'done'))
    const sent = await events(res.body)
    expect(sent.at(-1)?.data.state).toBe('done')
    expect(sent.length).toBeLessThan(10)
    expect(sent.map((e) => e.seq)).toEqual(sent.map((_, i) => i))
    expect(watches()).toBe(0)
  })
})
