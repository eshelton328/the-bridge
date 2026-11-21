import { ChatId, type LayoutNode, TabId } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import type { LiveTab } from '../types.ts'
import { panelsOf, ratioWrite } from './splitRatio.ts'

// W2c: the herdr split a dragged handle stands for, and the ratio that puts it where the owner let go.
const pane = (c: string): LayoutNode => ({ kind: 'pane', chat: ChatId.parse(`m/${c}`) })
const split = (direction: 'row' | 'column', ratio: number, first: LayoutNode, second: LayoutNode): LayoutNode => ({
  kind: 'split',
  direction,
  ratio,
  first,
  second,
})
const tabOf = (root: LayoutNode): LiveTab => ({
  id: TabId.parse('m/w:t1'),
  root,
  active: true,
  chats: [],
  focused: 'a',
  zoomed: false,
})

describe('panelsOf (W2c)', () => {
  it("gives each handle's panels as SplitPanes and RowsSplit place the panes", () => {
    expect(panelsOf(undefined, 2, 'columns')).toEqual([[0], [1]])
    expect(panelsOf(undefined, 3, 'columns')).toEqual([[0], [1, 2]])
    expect(panelsOf(undefined, 3, 'right')).toEqual([[1], [2]])
    expect(panelsOf(undefined, 4, 'left')).toEqual([[0], [3]])
    expect(panelsOf('rows', 3, 'rows')).toEqual([[0, 1], [2]])
    expect(panelsOf('rows', 4, 'bottom')).toEqual([[3], [2]])
    expect(panelsOf('stack', 3, 'rows')).toEqual([[0], [1], [2]])
    expect(panelsOf(undefined, 1, 'columns')).toEqual([[0]])
  })
})

describe('ratioWrite (W2c)', () => {
  it("gives a two-pane split the handle's new share, at the root's path", () => {
    const tab = tabOf(split('row', 0.5, pane('a'), pane('b')))
    expect(ratioWrite(tab, 'columns', [['a'], ['b']], [50, 50], [70, 30])).toEqual({
      tab: 'm/w:t1',
      path: [],
      ratio: 0.7,
    })
  })

  it('finds a nested split by its path: the right column of a pane beside a column', () => {
    const tab = tabOf(split('row', 0.5, pane('a'), split('column', 0.5, pane('b'), pane('c'))))
    expect(ratioWrite(tab, 'right', [['b'], ['c']], [50, 50], [40, 60])).toEqual({
      tab: 'm/w:t1',
      path: ['second'],
      ratio: 0.4,
    })
    // The handle between the columns stands for the root.
    expect(ratioWrite(tab, 'columns', [['a'], ['b', 'c']], [50, 50], [35, 65])?.path).toEqual([])
  })

  it("keeps the shares of panes the page does not draw: a stack's handle moves its split by the drawn sizes", () => {
    // column(column(a, b), c) at 0.5 and 0.5: a and b are a quarter each, c a half: drawn 25, 25, 50.
    const tab = tabOf(split('column', 0.5, split('column', 0.5, pane('a'), pane('b')), pane('c')))
    // The second handle (b | c) stands for the root: a + b grow from 50 to 60 of the drawn 100.
    expect(ratioWrite(tab, 'rows', [['a'], ['b'], ['c']], [25, 25, 50], [25, 35, 40])).toEqual({
      tab: 'm/w:t1',
      path: [],
      ratio: 0.6,
    })
    // The first handle (a | b) stands for the split at `first`.
    expect(ratioWrite(tab, 'rows', [['a'], ['b'], ['c']], [25, 25, 50], [30, 20, 50])?.path).toEqual(['first'])
  })

  it('clamps the ratio to 0.1 to 0.9', () => {
    // The drawn panes are a part of each side: a 1 % drag of a split at 0.85 goes past 0.9.
    const tab = tabOf(split('row', 0.85, split('row', 0.5, pane('a'), pane('x')), pane('b')))
    expect(ratioWrite(tab, 'columns', [['a'], ['b']], [50, 50], [90, 10])?.ratio).toBe(0.9)
    expect(
      ratioWrite(tabOf(split('row', 0.15, pane('a'), pane('b'))), 'columns', [['a'], ['b']], [15, 85], [5, 95])?.ratio,
    ).toBe(0.1)
  })

  it('has no write for a split across the handle, a handle that did not move, or a tab with no tree', () => {
    const across = tabOf(split('column', 0.5, pane('a'), pane('b')))
    expect(ratioWrite(across, 'columns', [['a'], ['b']], [50, 50], [60, 40])).toBeUndefined()
    const row = tabOf(split('row', 0.5, pane('a'), pane('b')))
    expect(ratioWrite(row, 'columns', [['a'], ['b']], [50, 50], [50, 50])).toBeUndefined()
    // row(row(a, b), c) drawn as a | (b over c): no split holds a before and b, c after.
    const nearest = tabOf(split('row', 0.5, split('row', 0.5, pane('a'), pane('b')), pane('c')))
    expect(ratioWrite(nearest, 'columns', [['a'], ['b', 'c']], [50, 50], [60, 40])).toBeUndefined()
    expect(ratioWrite({ ...row, root: undefined }, 'columns', [['a'], ['b']], [50, 50], [60, 40])).toBeUndefined()
  })
})
