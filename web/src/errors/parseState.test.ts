import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { FixtureError } from './appError.ts'
import { parseState } from './parseState.ts'

const schema = z.object({ data: z.object({ count: z.number().int() }), ui: z.object({ open: z.boolean() }) })

describe('parseState', () => {
  it('returns a state that matches the schema', () => {
    const state = { title: 'ok', frames: [], data: { count: 3 }, ui: { open: true } }
    expect(parseState(schema, state, 'test/ok')).toEqual(state)
  })

  it('throws FixtureError naming the state and the field for a state that does not match', () => {
    const state = { title: 'broken', frames: [], data: { count: 1.5 }, ui: { open: true } }
    expect(() => parseState(schema, state, 'test/broken')).toThrow(FixtureError)
    expect(() => parseState(schema, state, 'test/broken')).toThrow(/test\/broken[\s\S]*data\.count/)
  })
})
