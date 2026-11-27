import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  ChatStatusEvent,
  LayoutChangedEvent,
  LiveEvent,
  QueueChangedEvent,
  WorkspacesChangedEvent,
} from './liveEvents.ts'

const status = {
  source: 'mac-mini/herdr',
  seq: 3,
  type: 'chat.status',
  data: { chat: 'mac-mini/session-a', status: 'needsYou' },
}
const changed = { source: 'mac-mini/herdr', seq: 4, type: 'workspaces.changed', data: {} }
const layout = { source: 'mac-mini/herdr', seq: 5, type: 'layout.changed', data: { workspace: 'mac-mini/w17' } }

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

  it('parses a layout event that names its workspace, and refuses one without it', () => {
    expect(LayoutChangedEvent.parse(layout)).toEqual(layout)
    expect(LiveEvent.parse(layout).type).toBe('layout.changed')
    expect(LiveEvent.safeParse({ ...layout, data: {} }).success).toBe(false)
    expect(LiveEvent.safeParse({ ...layout, data: { workspace: 'w17' } }).success).toBe(false)
  })

  it('parses projects.changed, which holds no data', () => {
    const projects = { source: 'mac-mini/agents', seq: 6, type: 'projects.changed', data: {} }
    expect(LiveEvent.parse(projects).type).toBe('projects.changed')
  })

  it('parses a queue change that carries only the slug', () => {
    const queue = { source: 'mac-mini/server', seq: 6, type: 'queue.changed', data: { slug: 'after-dark' } }
    expect(QueueChangedEvent.parse(queue)).toEqual(queue)
    expect(LiveEvent.parse(queue).type).toBe('queue.changed')
    expect(LiveEvent.safeParse({ ...queue, data: { slug: 'after-dark', name: 'After dark' } }).success).toBe(false)
    expect(LiveEvent.safeParse({ ...queue, data: { slug: '../x' } }).success).toBe(false)
  })

  it('refuses an unknown type, a status the app does not know and a chat ID without its machine', () => {
    expect(LiveEvent.safeParse({ ...changed, type: 'chat.entry' }).success).toBe(false)
    expect(LiveEvent.safeParse({ ...status, data: { ...status.data, status: 'blocked' } }).success).toBe(false)
    expect(LiveEvent.safeParse({ ...status, data: { ...status.data, chat: 'session-a' } }).success).toBe(false)
  })
})
