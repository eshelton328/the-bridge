import { describe, expect, it } from 'vitest'
import {
  chatsOf,
  LayoutNode,
  TabLayout,
  WorkspaceLayout,
  CloseChatRequest,
  FocusChatRequest,
  MoveChatRequest,
  SwapChatsRequest,
  ZoomChatRequest,
  SetSplitRatioRequest,
  SplitChatRequest,
} from './layout.ts'

const chat = (local: string, kind: 'claude' | 'shell' = 'claude') => ({
  id: `mac-mini/${local}`,
  kind,
  title: local,
  model: kind === 'shell' ? 'pnpm dev' : 'claude-opus-5-5',
  modelId: kind === 'shell' ? null : 'opus',
  effort: null,
  contextUsed: null,
  status: 'idle',
  parent: null,
  pane: `mac-mini/pane-${local}`,
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
  zoomed: false,
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

  it('needs to know whether a tab is zoomed', () => {
    expect(TabLayout.safeParse({ ...tab, zoomed: true }).success).toBe(true)
    expect(TabLayout.safeParse({ ...tab, zoomed: undefined }).success).toBe(false)
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

describe('the layout write requests (W2)', () => {
  it('takes a move to a tab with a direction, and a beside chat only as a chat ID', () => {
    const tab = 'mac-mini/w1:t2'
    expect(MoveChatRequest.parse({ tab, direction: 'column' })).toEqual({ tab, direction: 'column' })
    expect(MoveChatRequest.safeParse({ tab, direction: 'row', beside: 'mac-mini/claude-1' }).success).toBe(true)
    for (const body of [
      { tab },
      { tab, direction: 'left' },
      { tab: 'w1:t2', direction: 'row' },
      { tab, direction: 'row', beside: 'claude-1' },
      { tab, direction: 'row', pane: 'w1:p1' },
    ])
      expect(MoveChatRequest.safeParse(body).success).toBe(false)
  })

  it('takes only their own fields, and a close only with a chat ID as its confirm', () => {
    expect(FocusChatRequest.safeParse({}).success).toBe(true)
    expect(FocusChatRequest.safeParse({ chat: 'mac-mini/c1' }).success).toBe(false)
    expect(ZoomChatRequest.safeParse({ zoomed: true }).success).toBe(true)
    expect(ZoomChatRequest.safeParse({}).success).toBe(false)
    expect(SwapChatsRequest.safeParse({ with: 'mac-mini/c2' }).success).toBe(true)
    expect(SwapChatsRequest.safeParse({ with: 'c2' }).success).toBe(false)
    expect(CloseChatRequest.safeParse({ confirm: 'mac-mini/c1' }).success).toBe(true)
    expect(CloseChatRequest.safeParse({}).success).toBe(false)
    expect(CloseChatRequest.safeParse({ confirm: 'mac-mini/c1', force: true }).success).toBe(false)
  })
})

describe('the split and ratio requests (W2)', () => {
  it('takes a split direction, and a ratio from 0.1 to 0.9 at a path of first and second parts', () => {
    expect(SplitChatRequest.safeParse({ direction: 'row' }).success).toBe(true)
    expect(SplitChatRequest.safeParse({ direction: 'right' }).success).toBe(false)
    const ratio = { tab: 'mac-mini/w1:t1', path: ['second', 'first'], ratio: 0.5 }
    expect(SetSplitRatioRequest.safeParse(ratio).success).toBe(true)
    for (const bad of [
      { ...ratio, ratio: 0.05 },
      { ...ratio, ratio: 0.95 },
      { ...ratio, path: ['left'] },
      { ...ratio, path: Array.from({ length: 33 }, () => 'second') },
      { ...ratio, tab: 'w1:t1' },
      { ...ratio, extra: true },
    ])
      expect(SetSplitRatioRequest.safeParse(bad).success).toBe(false)
  })
})
