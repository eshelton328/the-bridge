// withFloors: each stacked pane at least its floor, the room taken from the largest panes, the shares still 100.
import { describe, expect, it } from 'vitest'
import { withFloors } from './paneFloors.ts'

const sum = (shares: readonly number[]) => Math.round(shares.reduce((total, s) => total + s, 0) * 100) / 100

describe('withFloors', () => {
  it('keeps shares that are all over their floors', () => {
    expect(withFloors([40, 60], [15, 5])).toEqual([40, 60])
  })

  it('raises the panes under their floors and takes the room from the largest pane', () => {
    // herdr's 5, 5, 10 and 20 % of a ten-pane column, scaled to fill: 12.5, 12.5, 25 and 50 %.
    const shares = withFloors([12.5, 12.5, 25, 50], [15, 15, 5, 15])
    expect(shares).toEqual([15, 15, 25, 45])
    expect(sum(shares)).toBe(100)
  })

  it('takes from the next largest pane when the largest reaches its own floor', () => {
    // The first pane needs 30: the largest gives 10 down to its floor of 50, the next 20 down to its floor of 10.
    const shares = withFloors([10, 30, 60], [40, 10, 50])
    expect(shares).toEqual([40, 10, 50])
    expect(sum(shares)).toBe(100)
  })

  it('shares the room by the floors when they make more than 100', () => {
    expect(withFloors([25, 25, 25, 25], [40, 40, 20, 20])).toEqual([33.33, 33.33, 16.67, 16.67])
  })
})
