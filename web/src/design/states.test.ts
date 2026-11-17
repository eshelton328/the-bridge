import { describe, expect, it } from 'vitest'
import { boards } from './registry.gen.ts'

// Every state file parses against its page schema (d-084), so a state an
// agent or a Figma survey broke fails here before a screen shows it.
describe('state files', () => {
  it('has at least one board', () => {
    expect(boards.length).toBeGreaterThan(0)
  })

  for (const b of boards) {
    it(`${b.id} matches its page schema`, () => {
      const result = b.check()
      expect(result.ok ? 'valid' : result.error).toBe('valid')
    })

    it(`${b.id} names at least one Figma frame`, () => {
      expect(b.frames.length).toBeGreaterThan(0)
    })
  }
})
