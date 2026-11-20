import { describe, expect, it } from 'vitest'
import { createRateLimit } from './rateLimit.ts'

describe('the rate limit', () => {
  it('takes the limit in a window, refuses the rest, and starts again in the next window', () => {
    let at = 0
    const limit = createRateLimit(3, 60_000, () => at)
    expect([1, 2, 3, 4].map(() => limit.take('owner'))).toEqual([true, true, true, false])
    expect(limit.take('local')).toBe(true)
    at = 59_999
    expect(limit.take('owner')).toBe(false)
    at = 60_000
    expect(limit.take('owner')).toBe(true)
  })
})
