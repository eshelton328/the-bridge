// The layout mapper (slice 3a): a herdr tab's split tree in, the page's own
// layout out, for each shape the rule names and for the nearest layout.
import { ChatSummary, LayoutNode, TabLayout, chatsOf } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { layoutOfTab } from './liveLayout.ts'

const pane = (local: string) => ({ kind: 'pane', chat: `mac-mini/${local}` }) as const
type Raw =
  | ReturnType<typeof pane>
  | { kind: 'split'; direction: 'row' | 'column'; ratio: number; first: Raw; second: Raw }
const row = (ratio: number, first: Raw, second: Raw): Raw => ({ kind: 'split', direction: 'row', ratio, first, second })
const column = (ratio: number, first: Raw, second: Raw): Raw => ({
  kind: 'split',
  direction: 'column',
  ratio,
  first,
  second,
})

const tab = (raw: Raw, focused: string, active = true) => {
  const root = LayoutNode.parse(raw)
  return TabLayout.parse({
    id: `mac-mini/w:${focused}`,
    label: 'main',
    active,
    root,
    focusedChat: `mac-mini/${focused}`,
    chats: chatsOf(root).map((id) =>
      ChatSummary.parse({
        id,
        kind: 'claude',
        title: id,
        model: null,
        contextUsed: null,
        status: 'idle',
        parent: null,
      }),
    ),
  })
}

const noShell = () => false

describe('layoutOfTab', () => {
  it('fills the space with one pane', () => {
    expect(layoutOfTab([tab(pane('a'), 'a')], noShell)).toEqual({ panes: ['a'], focusedPane: 'a' })
  })

  it('puts a row side by side and a column one above the other, each at its ratio', () => {
    expect(layoutOfTab([tab(row(0.3, pane('a'), pane('b')), 'b')], noShell)).toEqual({
      panes: ['a', 'b'],
      splitSizes: { columns: [30, 70] },
      focusedPane: 'b',
    })
    expect(layoutOfTab([tab(column(0.65, pane('a'), pane('b')), 'a')], noShell)).toEqual({
      panes: ['a', 'b'],
      split: 'stack',
      splitSizes: { rows: [65, 35] },
      focusedPane: 'a',
    })
  })

  it('places the rows-first and the columns-first 2×2 clockwise, each handle at its ratio', () => {
    expect(
      layoutOfTab([tab(column(0.5, row(0.6, pane('a'), pane('b')), row(0.25, pane('c'), pane('d'))), 'd')], noShell),
    ).toEqual({
      panes: ['a', 'b', 'd', 'c'],
      split: 'rows',
      splitSizes: { rows: [50, 50], top: [60, 40], bottom: [25, 75] },
      focusedPane: 'd',
    })
    expect(
      layoutOfTab([tab(row(0.4, column(0.7, pane('a'), pane('c')), column(0.2, pane('b'), pane('d'))), 'a')], noShell),
    ).toEqual({
      panes: ['a', 'b', 'd', 'c'],
      splitSizes: { columns: [40, 60], left: [70, 30], right: [20, 80] },
      focusedPane: 'a',
    })
  })

  it('maps the three-pane forms of both splits', () => {
    expect(layoutOfTab([tab(column(0.5, row(0.3, pane('a'), pane('b')), pane('c')), 'a')], noShell)).toEqual({
      panes: ['a', 'b', 'c'],
      split: 'rows',
      splitSizes: { rows: [50, 50], top: [30, 70] },
      focusedPane: 'a',
    })
    expect(layoutOfTab([tab(row(0.5, pane('a'), column(0.3, pane('b'), pane('c'))), 'a')], noShell)).toEqual({
      panes: ['a', 'b', 'c'],
      splitSizes: { columns: [50, 50], right: [30, 70] },
      focusedPane: 'a',
    })
  })

  it('takes the nearest layout for any other tree: by its root, in tree order, with equal shares', () => {
    expect(layoutOfTab([tab(row(0.3, row(0.5, pane('a'), pane('b')), pane('c')), 'a')], noShell)).toEqual({
      panes: ['a', 'b', 'c'],
      focusedPane: 'a',
    })
    expect(
      layoutOfTab([tab(column(0.3, pane('a'), column(0.5, pane('b'), row(0.5, pane('c'), pane('d')))), 'a')], noShell),
    ).toEqual({ panes: ['a', 'b', 'd', 'c'], split: 'rows', focusedPane: 'a' })
  })

  it('keeps the first four panes in tree order, and a split that loses a part becomes the other', () => {
    const six = row(
      0.5,
      column(0.5, pane('a'), pane('b')),
      row(0.5, pane('c'), row(0.5, pane('d'), row(0.5, pane('e'), pane('f')))),
    )
    expect(layoutOfTab([tab(six, 'a')], noShell).panes.toSorted()).toEqual(['a', 'b', 'c', 'd'])
    // With e past four, column(d, e) is d alone: the tree left is row(column(a, b), column(c, d)), the columns-first 2×2.
    const lost = row(0.5, column(0.4, pane('a'), pane('b')), column(0.5, pane('c'), column(0.5, pane('d'), pane('e'))))
    expect(layoutOfTab([tab(lost, 'a')], noShell)).toEqual({
      panes: ['a', 'c', 'd', 'b'],
      splitSizes: { columns: [50, 50], left: [40, 60], right: [50, 50] },
      focusedPane: 'a',
    })
  })

  it('focuses the first drawn chat that is not a shell when the focused chat is past four', () => {
    const five = row(0.5, row(0.5, pane('s'), pane('a')), row(0.5, pane('b'), row(0.5, pane('c'), pane('e'))))
    expect(layoutOfTab([tab(five, 'e')], (id) => id === 's').focusedPane).toBe('a')
  })

  it("draws the active tab's tree only", () => {
    const tabs = [tab(row(0.5, pane('a'), pane('b')), 'a', false), tab(pane('c'), 'c')]
    expect(layoutOfTab(tabs, noShell)).toEqual({ panes: ['c'], focusedPane: 'c' })
  })
})
