import { describe, expect, it } from 'vitest'
import { backoffCapMs, reconnectBackoff } from './reconnectBackoff.ts'

const steps = [500, 1000, 2000, 4000, 8000, 16_000, backoffCapMs, backoffCapMs]

describe('reconnectBackoff (R70)', () => {
  it('waits below 0.5, 1, 2, 4, 8, 16 s, then at most 30 s, with full jitter', () => {
    const low = reconnectBackoff(() => 0)
    const high = reconnectBackoff(() => 0.999_999)
    const half = reconnectBackoff(() => 0.5)
    for (const step of steps) {
      expect(low.miss(true).waitMs).toBe(0)
      const top = high.miss(true).waitMs
      expect(top).toBeLessThan(step)
      expect(top).toBeGreaterThanOrEqual(step - 1)
      expect(half.miss(true).waitMs).toBe(step / 2)
    }
  })

  it('starts the steps again after a reset, and marks the first miss of each row', () => {
    const backoff = reconnectBackoff(() => 0.5)
    expect([1, 2, 3].map(() => backoff.miss(true))).toEqual([
      { waitMs: 250, first: true, enough: false },
      { waitMs: 500, first: false, enough: false },
      { waitMs: 1000, first: false, enough: false },
    ])
    backoff.reset()
    expect(backoff.miss(false)).toEqual({ waitMs: 250, first: true, enough: false })
  })

  it('has enough for the banner from the 4th visible miss in a row; hidden misses do not count', () => {
    const backoff = reconnectBackoff(() => 0)
    const enough = () => [true, false, true, true, true, true].map((v) => backoff.miss(v).enough)
    expect(enough()).toEqual([false, false, false, false, true, true])
    backoff.reset()
    expect([1, 2, 3, 4].map(() => backoff.miss(true).enough)).toEqual([false, false, false, true])
  })
})
