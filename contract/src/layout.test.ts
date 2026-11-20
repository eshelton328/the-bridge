import { describe, expect, it } from 'vitest'
import { chatsOf, LayoutNode, TabLayout, WorkspaceLayout } from './layout.ts'

const chat = (local: string, kind: 'claude' | 'shell' = 'claude') => ({
  id: `mac-mini/${local}`,
  kind,
  title: local,
  model: kind === 'shell' ? 'pnpm dev' : 'claude-opus-5-5',
  contextUsed: null,
  status: 'idle',
  parent: null,
})

const root = {
  kind: 'split',
  direction: 'row',
  ratio: 0.5,
  first: { kind: 'pane', chat: 'mac-mini/a' },
  second: {
    kind: 'split',
    direction: 'column',
    ratio: 0.25,
    first: { kind: 'pane', chat: 'mac-mini/b' },
    second: { kind: 'pane', chat: 'mac-mini/term_1' },
  },
}

const tab = {
  id: 'mac-mini/w17:t1',
  label: '1',
  active: true,
  root,
  focusedChat: 'mac-mini/b',
  chats: [chat('a'), chat('b'), chat('term_1', 'shell')],
}

describe('layout', () => {
  it('parses a split tree and gives its chats first part before second part', () => {
    const node = LayoutNode.parse(root)
    expect(node).toEqual(root)
    expect(chatsOf(node)).toEqual(['mac-mini/a', 'mac-mini/b', 'mac-mini/term_1'])
  })

  it('refuses a ratio of 0 or 1, an unknown direction and a pane with no chat ID', () => {
    expect(LayoutNode.safeParse({ ...root, ratio: 0 }).success).toBe(false)
    expect(LayoutNode.safeParse({ ...root, ratio: 1 }).success).toBe(false)
    expect(LayoutNode.safeParse({ ...root, direction: 'right' }).success).toBe(false)
    expect(LayoutNode.safeParse({ kind: 'pane', chat: 'w17:p1' }).success).toBe(false)
  })

  it('parses a tab whose chats are its panes in tree order', () => {
    expect(TabLayout.parse(tab)).toEqual(tab)
  })

  it('refuses a tab whose focused chat is not in its tree', () => {
    expect(TabLayout.safeParse({ ...tab, focusedChat: 'mac-mini/z' }).success).toBe(false)
  })

  it('refuses a tab whose chats are not its panes in tree order', () => {
    expect(TabLayout.safeParse({ ...tab, chats: [chat('b'), chat('a'), chat('term_1', 'shell')] }).success).toBe(false)
    expect(TabLayout.safeParse({ ...tab, chats: [chat('a'), chat('b')] }).success).toBe(false)
  })

  it('refuses a tab with one chat in two panes', () => {
    const twice = { ...root, second: { kind: 'pane', chat: 'mac-mini/a' } }
    expect(
      TabLayout.safeParse({ ...tab, root: twice, focusedChat: 'mac-mini/a', chats: [chat('a'), chat('a')] }).success,
    ).toBe(false)
  })

  it('parses a workspace layout with one active tab', () => {
    const second = { ...tab, id: 'mac-mini/w17:t2', label: '2', active: false }
    const layout = { workspace: 'mac-mini/w17', tabs: [tab, second] }
    expect(WorkspaceLayout.parse(layout)).toEqual(layout)
  })

  it("refuses a tab or a pane's chat on another machine than the workspace", () => {
    const workspace = 'mac-mini/w17'
    expect(WorkspaceLayout.safeParse({ workspace, tabs: [{ ...tab, id: 'laptop/w17:t1' }] }).success).toBe(false)
    const elsewhere = { kind: 'pane', chat: 'laptop/a' }
    const other = { ...tab, root: elsewhere, focusedChat: 'laptop/a', chats: [{ ...chat('a'), id: 'laptop/a' }] }
    expect(WorkspaceLayout.safeParse({ workspace, tabs: [other] }).success).toBe(false)
  })

  it('refuses a workspace layout with no tab, no active tab, two active tabs or two tabs with one ID', () => {
    const workspace = 'mac-mini/w17'
    expect(WorkspaceLayout.safeParse({ workspace, tabs: [] }).success).toBe(false)
    expect(WorkspaceLayout.safeParse({ workspace, tabs: [{ ...tab, active: false }] }).success).toBe(false)
    expect(WorkspaceLayout.safeParse({ workspace, tabs: [tab, { ...tab, id: 'mac-mini/w17:t2' }] }).success).toBe(false)
    expect(WorkspaceLayout.safeParse({ workspace, tabs: [tab, { ...tab, active: false }] }).success).toBe(false)
  })
})
