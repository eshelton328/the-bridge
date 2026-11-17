import { describe, expect, expectTypeOf, it } from 'vitest'
import { InboxItemId } from './ids.ts'

describe('InboxItemId', () => {
  it('parses a slug into a branded id', () => {
    const id = InboxItemId.parse('write-the-tickets')
    expect(id).toBe('write-the-tickets')
    expectTypeOf(id).toEqualTypeOf<InboxItemId>()
  })

  it('rejects a string that is not a slug', () => {
    expect(InboxItemId.safeParse('Write the tickets').success).toBe(false)
    expect(InboxItemId.safeParse('').success).toBe(false)
  })

  it('is not assignable from a plain string', () => {
    expectTypeOf<string>().not.toExtend<InboxItemId>()
  })
})
