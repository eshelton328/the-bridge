import { describe, expect, it } from 'vitest'
import { nextSeen, paneMoves, withMovedChats } from './paneFollow.ts'

const map = (entries: Record<string, string>) => new Map(Object.entries(entries))

describe('paneMoves', () => {
  it('moves a chat that left the list to the new chat on its pane', () => {
    const before = map({ c1: 'p1', c2: 'p2' })
    const now = map({ 'c1-c1': 'p1', c2: 'p2' })
    expect(paneMoves(before, now)).toEqual(map({ c1: 'c1-c1' }))
  })

  it('moves nothing for a chat that left with no chat on its pane, or a new chat on a new pane', () => {
    expect(paneMoves(map({ c1: 'p1', c2: 'p2' }), map({ c2: 'p2', c3: 'p3' })).size).toBe(0)
  })

  it('moves nothing to a chat that was listed before', () => {
    expect(paneMoves(map({ c1: 'p1', c2: 'p2' }), map({ c2: 'p1' })).size).toBe(0)
  })
})

describe('nextSeen', () => {
  it('keeps a chat that left until a chat comes on its pane, so a list in two steps still moves it', () => {
    const first = nextSeen(map({ c1: 'p1', c2: 'p2' }), map({ c2: 'p2' }))
    expect(first).toEqual(map({ c2: 'p2', c1: 'p1' }))
    expect(paneMoves(first, map({ c2: 'p2', n1: 'p1' }))).toEqual(map({ c1: 'n1' }))
    expect(nextSeen(first, map({ c2: 'p2', n1: 'p1' }))).toEqual(map({ c2: 'p2', n1: 'p1' }))
  })

  it('keeps the panes it saw when a list is empty, as a read that missed gives', () => {
    const before = map({ c1: 'p1' })
    expect(nextSeen(before, new Map())).toBe(before)
  })
})

describe('withMovedChats', () => {
  const moves = map({ c1: 'n1' })

  it('moves the open chat, the saved panes, their focus, the seen layouts, the names and the menus', () => {
    const layout = { panes: ['c1', 'c2'], focusedPane: 'c1', splitSizes: { columns: [50, 50] } }
    const moved = withMovedChats(
      {
        focusedPane: 'c1',
        phoneView: 'chat',
        menuFor: 'c1',
        skillsFor: 'c2',
        layouts: { w1: layout },
        layoutsSeen: { w1: JSON.stringify(layout) },
        names: { c1: 'my plan' },
        renamingChats: { c1: 'my pl' },
        paneDrag: { chat: 'c1', edge: 'left', pane: 'c1' },
        drafts: { c1: 'old draft' },
      },
      moves,
    )
    const next = { panes: ['n1', 'c2'], focusedPane: 'n1', splitSizes: { columns: [50, 50] } }
    expect(moved).toEqual({
      focusedPane: 'n1',
      phoneView: 'chat',
      menuFor: 'n1',
      skillsFor: 'c2',
      layouts: { w1: next },
      layoutsSeen: { w1: JSON.stringify(next) },
      names: { n1: 'my plan' },
      renamingChats: { n1: 'my pl' },
      paneDrag: { chat: 'n1', edge: 'left', pane: 'n1' },
      // The draft was for the old context: it is not moved.
      drafts: { c1: 'old draft' },
    })
  })

  it('gives back the same changes when nothing moved', () => {
    const ui = { focusedPane: 'c1' }
    expect(withMovedChats(ui, new Map())).toBe(ui)
  })
})
