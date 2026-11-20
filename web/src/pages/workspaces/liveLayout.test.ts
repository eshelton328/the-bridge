// The layout mapper (slice 3a): a herdr tab's split tree in, the page's own
// layout out, for each shape the rule names and for the nearest layout.
import { ChatSummary, LayoutNode, TabLayout, chatsOf } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { layoutsSeenOf, withLoadedLayouts } from './blocks/workspaceLayout.ts'
import { workspacesHome } from './home.ts'
import { layoutOfTab } from './liveLayout.ts'
import type { WorkspacesUi } from './types.ts'

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

describe('layoutOfTab', () => {
  it('fills the space with one pane', () => {
    expect(layoutOfTab([tab(pane('a'), 'a')])).toEqual({ panes: ['a'], focusedPane: 'a' })
  })

  it('puts a row side by side and a column one above the other, each at its ratio', () => {
    expect(layoutOfTab([tab(row(0.3, pane('a'), pane('b')), 'b')])).toEqual({
      panes: ['a', 'b'],
      splitSizes: { columns: [30, 70] },
      focusedPane: 'b',
    })
    expect(layoutOfTab([tab(column(0.65, pane('a'), pane('b')), 'a')])).toEqual({
      panes: ['a', 'b'],
      split: 'stack',
      splitSizes: { rows: [65, 35] },
      focusedPane: 'a',
    })
  })

  it('places the rows-first and the columns-first 2×2 clockwise, each handle at its ratio', () => {
    expect(
      layoutOfTab([tab(column(0.5, row(0.6, pane('a'), pane('b')), row(0.25, pane('c'), pane('d'))), 'd')]),
    ).toEqual({
      panes: ['a', 'b', 'd', 'c'],
      split: 'rows',
      splitSizes: { rows: [50, 50], top: [60, 40], bottom: [25, 75] },
      focusedPane: 'd',
    })
    expect(
      layoutOfTab([tab(row(0.4, column(0.7, pane('a'), pane('c')), column(0.2, pane('b'), pane('d'))), 'a')]),
    ).toEqual({
      panes: ['a', 'b', 'd', 'c'],
      splitSizes: { columns: [40, 60], left: [70, 30], right: [20, 80] },
      focusedPane: 'a',
    })
  })

  it('maps the three-pane forms of both splits', () => {
    expect(layoutOfTab([tab(column(0.5, row(0.3, pane('a'), pane('b')), pane('c')), 'a')])).toEqual({
      panes: ['a', 'b', 'c'],
      split: 'rows',
      splitSizes: { rows: [50, 50], top: [30, 70] },
      focusedPane: 'a',
    })
    expect(layoutOfTab([tab(row(0.5, pane('a'), column(0.3, pane('b'), pane('c'))), 'a')])).toEqual({
      panes: ['a', 'b', 'c'],
      splitSizes: { columns: [50, 50], right: [30, 70] },
      focusedPane: 'a',
    })
  })

  it('takes the nearest layout for any other tree: by its root, in tree order, with equal shares', () => {
    expect(layoutOfTab([tab(row(0.3, row(0.5, pane('a'), pane('b')), pane('c')), 'a')])).toEqual({
      panes: ['a', 'b', 'c'],
      focusedPane: 'a',
    })
    expect(
      layoutOfTab([tab(column(0.3, pane('a'), column(0.5, pane('b'), row(0.5, pane('c'), pane('d')))), 'a')]),
    ).toEqual({ panes: ['a', 'b', 'd', 'c'], split: 'rows', focusedPane: 'a' })
  })

  it('puts a tree of columns only one above the other, each pane at its share of the space', () => {
    expect(
      layoutOfTab([tab(column(0.5, column(0.5, column(0.5, pane('a'), pane('b')), pane('c')), pane('d')), 'c')]),
    ).toEqual({
      panes: ['a', 'b', 'c', 'd'],
      split: 'stack',
      splitSizes: { rows: [12.5, 12.5, 25, 50] },
      focusedPane: 'c',
    })
    // herdr's tab of ten panes in a column beside two: the first four in tree order are the column's top four.
    const ten = ['a', 'b', 'c', 'd', 'e', 'f'].reduce<Raw>((above, id) => column(0.5, above, pane(id)), pane('top'))
    expect(layoutOfTab([tab(row(0.5, ten, column(0.5, pane('x'), pane('y'))), 'top')])).toEqual({
      panes: ['top', 'a', 'b', 'c'],
      split: 'stack',
      splitSizes: { rows: [12.5, 12.5, 25, 50] },
      focusedPane: 'top',
    })
  })

  it('keeps the first four panes in tree order, and a split that loses a part becomes the other', () => {
    const six = row(
      0.5,
      column(0.5, pane('a'), pane('b')),
      row(0.5, pane('c'), row(0.5, pane('d'), row(0.5, pane('e'), pane('f')))),
    )
    expect(layoutOfTab([tab(six, 'a')]).panes.toSorted()).toEqual(['a', 'b', 'c', 'd'])
    // With e past four, column(d, e) is d alone: the tree left is row(column(a, b), column(c, d)), the columns-first 2×2.
    // c is half of herdr's right column and d a quarter, so the right handle keeps them at 2 : 1.
    const lost = row(0.5, column(0.4, pane('a'), pane('b')), column(0.5, pane('c'), column(0.5, pane('d'), pane('e'))))
    expect(layoutOfTab([tab(lost, 'a')])).toEqual({
      panes: ['a', 'c', 'd', 'b'],
      splitSizes: { columns: [50, 50], left: [40, 60], right: [66.67, 33.33] },
      focusedPane: 'a',
    })
  })

  it('draws the focused pane and its nearest neighbours in tree order when the tree has more than four', () => {
    const six = ['b', 'c', 'd', 'e', 'f'].reduce<Raw>((above, id) => column(0.5, above, pane(id)), pane('a'))
    // The focus on pane 5 of 6: the panes before it and the one after it, four in all.
    expect(layoutOfTab([tab(six, 'e')])).toMatchObject({ panes: ['c', 'd', 'e', 'f'], focusedPane: 'e' })
    // The focus on pane 1: the first four, as before the rule.
    expect(layoutOfTab([tab(six, 'a')])).toMatchObject({ panes: ['a', 'b', 'c', 'd'], focusedPane: 'a' })
    // The focus on the last pane: the last four.
    expect(layoutOfTab([tab(six, 'f')]).panes).toEqual(['c', 'd', 'e', 'f'])
  })

  it("draws the owner's pane of a ten-pane column beside a two-pane column (herdr w17)", () => {
    const ten = ['b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].reduce<Raw>(
      (above, id) => column(0.5, above, pane(id)),
      pane('a'),
    )
    const w17 = row(0.5, ten, column(0.5, pane('x'), pane('y')))
    // The left column's last two panes beside the right column: the columns-first 2×2, clockwise.
    expect(layoutOfTab([tab(w17, 'y')])).toMatchObject({ panes: ['i', 'x', 'y', 'j'], focusedPane: 'y' })
  })

  it("scales the drawn panes' shares of the whole tree to fill the space, keeping their relative sizes", () => {
    // Four panes of a ten-pane column at 5, 5, 10 and 20 % of herdr's tab: 12.5, 12.5, 25 and 50 % of the page's.
    const ten = ['b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].reduce<Raw>(
      (above, id) => column(0.5, above, pane(id)),
      pane('a'),
    )
    const shares = (layout: ReturnType<typeof layoutOfTab>) => layout.splitSizes?.rows ?? []
    expect(shares(layoutOfTab([tab(ten, 'a')]))).toEqual([12.5, 12.5, 25, 50])
    expect(shares(layoutOfTab([tab(ten, 'a')])).reduce((sum, s) => sum + s, 0)).toBe(100)
    // A two-pane column cut from a longer one: each pane's share of the tab, not the cut split's ratio.
    const three = column(0.2, pane('a'), column(0.5, pane('b'), pane('c')))
    const five = column(0.5, three, column(0.5, pane('d'), pane('e')))
    expect(shares(layoutOfTab([tab(five, 'e')]))).toEqual([22.22, 22.22, 27.78, 27.78])
  })

  it("draws the active tab's tree only", () => {
    const tabs = [tab(row(0.5, pane('a'), pane('b')), 'a', false), tab(pane('c'), 'c')]
    expect(layoutOfTab(tabs)).toEqual({ panes: ['c'], focusedPane: 'c' })
  })
})

describe('withLoadedLayouts', () => {
  const ui = (layouts: WorkspacesUi['layouts'], focusedPane = 'a'): WorkspacesUi => ({
    ...workspacesHome.ui,
    focusedPane,
    layouts,
  })
  const one = { panes: ['a', 'b'], focusedPane: 'a' }
  const two = { panes: ['a', 'c'], split: 'stack' as const, focusedPane: 'c' }
  const mine = { panes: ['b'], focusedPane: 'b' }

  it("keeps the owner's layout while the loaded one is the one he saw, as a fixture's always is", () => {
    const changed = { layouts: { w: mine }, focusedPane: 'b', layoutsSeen: layoutsSeenOf({ w: one }) }
    expect(withLoadedLayouts(ui({ w: one }), changed, 'w').layouts?.w).toEqual(mine)
    expect(withLoadedLayouts(ui({ w: one }), changed, 'w').focusedPane).toBe('b')
  })

  it('takes a newer loaded layout over his, with its focus when that workspace is shown, and keeps the others', () => {
    const changed = { layouts: { w: mine, v: mine }, focusedPane: 'b', layoutsSeen: layoutsSeenOf({ w: one, v: one }) }
    const merged = withLoadedLayouts(ui({ w: two, v: one, n: one }), changed, 'w')
    expect(merged.layouts).toEqual({ w: two, v: mine, n: one })
    expect(merged.focusedPane).toBe('c')
    expect(withLoadedLayouts(ui({ w: two, v: one }), { ...changed, workspace: 'v' }, 'w').focusedPane).toBe('b')
  })

  it('keeps the chat the owner opened on the phone or the tablet, and a focus outside the shown workspace', () => {
    const changed = { layouts: { w: one }, focusedPane: 'b', layoutsSeen: layoutsSeenOf({ w: one }) }
    expect(withLoadedLayouts(ui({ w: two }), { ...changed, phoneView: 'chat' }, 'w').focusedPane).toBe('b')
    expect(withLoadedLayouts(ui({ w: two }), { ...changed, focusedPane: 'z' }, 'w').focusedPane).toBe('z')
    expect(withLoadedLayouts(ui({ w: two }), { ...changed, phoneView: 'list' }, 'w').focusedPane).toBe('c')
  })

  it("ends a handle drag's sizes when a newer layout replaces the shown workspace's, and keeps them otherwise", () => {
    const resize = { part: 'rows' as const, sizes: [70, 30] }
    const changed = { layouts: { w: mine }, focusedPane: 'b', resize, layoutsSeen: layoutsSeenOf({ w: one }) }
    expect(withLoadedLayouts(ui({ w: two }), changed, 'w').resize).toBeNull()
    expect(withLoadedLayouts(ui({ w: one }), changed, 'w').resize).toEqual(resize)
  })
})
