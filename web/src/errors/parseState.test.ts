import { describe, expect, it, onTestFinished, vi } from 'vitest'
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

  // d-134: a served build reads the live server, so it checks the merged state; any other build skips the parse.
  const build = (mode: string) => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('MODE', mode)
    onTestFinished(() => {
      vi.unstubAllEnvs()
    })
  }
  const broken = { title: 'broken', frames: [], data: { count: 1.5 }, ui: { open: true } }

  it('checks the state in a served build, which reads the live server', () => {
    build('served')
    expect(() => parseState(schema, broken, 'test/served')).toThrow(FixtureError)
  })

  it('returns the state unchecked in a production build, which reads only fixtures', () => {
    build('production')
    expect(parseState(schema, broken, 'test/production')).toBe(broken)
  })
})
