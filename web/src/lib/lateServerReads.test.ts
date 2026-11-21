import { describe, expect, it } from 'vitest'
import { answersLateRead } from './lateServerReads.ts'

const origin = 'http://localhost:63315'

describe('answersLateRead', () => {
  it('answers an API read after a test body ended or between tests', () => {
    expect(answersLateRead('/api/workspaces', origin, 'pass')).toBe(true)
    expect(answersLateRead('/api/workspaces', origin, 'fail')).toBe(true)
    expect(answersLateRead(`${origin}/api/events`, origin, undefined)).toBe(true)
  })

  it('leaves a read while the test body runs to the server guard', () => {
    expect(answersLateRead('/api/workspaces', origin, 'run')).toBe(false)
  })

  it('leaves other paths and origins to the real fetch', () => {
    expect(answersLateRead('/src/index.css', origin, 'pass')).toBe(false)
    expect(answersLateRead('https://example.com/api/workspaces', origin, 'pass')).toBe(false)
  })
})
