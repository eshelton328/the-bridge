import { describe, expect, expectTypeOf, it } from 'vitest'
import { z } from 'zod'
import { EventEnvelope, eventOf } from './events.ts'

const event = { source: 'mac-mini/herdr', seq: 7, type: 'chat.status', data: { status: 'working' } }

describe('events', () => {
  it('parses an envelope', () => {
    expect(EventEnvelope.parse(event)).toEqual(event)
  })

  it('refuses a negative or fractional sequence number and a source without its machine', () => {
    expect(EventEnvelope.safeParse({ ...event, seq: -1 }).success).toBe(false)
    expect(EventEnvelope.safeParse({ ...event, seq: 1.5 }).success).toBe(false)
    expect(EventEnvelope.safeParse({ ...event, source: 'herdr' }).success).toBe(false)
  })

  it('types the data of one event type', () => {
    const Status = eventOf('chat.status', z.object({ status: z.string() }))
    const parsed = Status.parse(event)
    expectTypeOf(parsed.type).toEqualTypeOf<'chat.status'>()
    expectTypeOf(parsed.data).toEqualTypeOf<{ status: string }>()
    expect(Status.safeParse({ ...event, type: 'chat.entry' }).success).toBe(false)
    expect(Status.safeParse({ ...event, data: {} }).success).toBe(false)
  })
})
