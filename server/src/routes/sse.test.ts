// The heartbeat of both SSE streams (R43b): a `: ping` comment line every
// 15 s, and no timer left once the client goes. Fake timers, fake adapter.
import { MachineId } from '@bridge/contract'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { createApp } from '../app.ts'
import { memoryLogger } from '../logger.ts'
import { ssePingMs } from './sse.ts'

const machine = MachineId.parse('test-mac')
const local = { Host: '127.0.0.1:5181' }

/** Reads the whole body as it comes; `text()` gives what came so far. */
function collect(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const decoder = new TextDecoder()
  let text = ''
  void (async () => {
    for (;;) {
      const { value, done } = await reader.read().catch(() => ({ value: undefined, done: true }))
      if (done) return
      text += decoder.decode(value, { stream: true })
    }
  })()
  return () => text
}

/** Waits a moment of real time, so a write the timers made reaches `collect`. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 30))

afterEach(() => {
  vi.useRealTimers()
})

describe('the SSE heartbeat', () => {
  for (const [name, path] of [
    ['/api/events', '/api/events'],
    ['a transcript stream', `/api/chats/${encodeURIComponent('test-mac/bridge-themes')}/transcript/events`],
  ] as const)
    it(`sends ": ping" every 15 s on ${name}, and stops when the client goes`, async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
      const app = createApp({ agents: createFakeAgents(machine), owner: 'owner@example.com', log: memoryLogger().log })
      const res = await app.request(path, { headers: local })
      expect(res.status).toBe(200)
      if (!res.body) throw new Error('no body')
      const reader = res.body.getReader()
      const text = collect(reader)
      await settle()
      expect(text()).toContain('event: open')
      expect(ssePingMs).toBe(15_000)
      const timers = vi.getTimerCount()
      expect(timers).toBeGreaterThan(0)
      vi.advanceTimersByTime(ssePingMs - 1)
      await settle()
      expect(text()).not.toContain(': ping')
      vi.advanceTimersByTime(1)
      await settle()
      expect(text().split(': ping\n\n')).toHaveLength(2)
      vi.advanceTimersByTime(ssePingMs)
      await settle()
      expect(text().split(': ping\n\n')).toHaveLength(3)
      await reader.cancel()
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(vi.getTimerCount()).toBe(timers - 1)
    })
})
