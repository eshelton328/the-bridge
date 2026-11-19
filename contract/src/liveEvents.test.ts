import { describe, expect, expectTypeOf, it } from 'vitest'
import { ChatStatusEvent, LiveEvent, WorkspacesChangedEvent } from './liveEvents.ts'

const status = {
  source: 'mac-mini/herdr',
  seq: 3,
  type: 'chat.status',
  data: { chat: 'mac-mini/session-a', status: 'needsYou' },
}
const changed = { source: 'mac-mini/herdr', seq: 4, type: 'workspaces.changed', data: {} }

describe('live events', () => {
  it('parses a status event and a change event', () => {
    expect(ChatStatusEvent.parse(status)).toEqual(status)
    expect(WorkspacesChangedEvent.parse(changed)).toEqual(changed)
  })

  it('picks the event by its type', () => {
    const parsed = LiveEvent.parse(status)
    if (parsed.type !== 'chat.status') throw new Error('not a status event')
    expectTypeOf(parsed.data.status).toEqualTypeOf<'working' | 'needsYou' | 'idle' | 'done' | 'unknown'>()
    expect(LiveEvent.parse(changed).type).toBe('workspaces.changed')
  })

  it('refuses an unknown type, a status the app does not know and a chat ID without its machine', () => {
    expect(LiveEvent.safeParse({ ...changed, type: 'chat.entry' }).success).toBe(false)
    expect(LiveEvent.safeParse({ ...status, data: { ...status.data, status: 'blocked' } }).success).toBe(false)
    expect(LiveEvent.safeParse({ ...status, data: { ...status.data, chat: 'session-a' } }).success).toBe(false)
  })
})
