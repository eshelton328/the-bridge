import { describe, expect, it } from 'vitest'
import { skillQuery } from './skillQuery.ts'

// The words the skill list reads, as the `/\S*$/` search found them. Its speed after a long paste is tested in Node
// (scripts/skillQuery.test.ts): Chromium's regex engine falls back to a linear one where Safari's backtracks.

describe('skillQuery', () => {
  it('returns the word before the caret when it starts with "/"', () => {
    expect(skillQuery('/', 1)).toBe('/')
    expect(skillQuery('/wr', 3)).toBe('/wr')
    expect(skillQuery('text /wri', 9)).toBe('/wri')
    expect(skillQuery('text\n\t/wri', 10)).toBe('/wri')
    // The caret mid-word: the word runs from its start to the caret.
    expect(skillQuery('text /writer more', 8)).toBe('/wr')
    expect(skillQuery('/writer', 4)).toBe('/wri')
  })

  it('returns null when the word before the caret does not start with "/"', () => {
    expect(skillQuery('', 0)).toBeNull()
    expect(skillQuery('text', 4)).toBeNull()
    expect(skillQuery('text /wri', 0)).toBeNull()
    expect(skillQuery('text /wri ', 10)).toBeNull()
    expect(skillQuery('a/wri', 5)).toBeNull()
    expect(skillQuery('text /wri', 5)).toBeNull()
  })
})
