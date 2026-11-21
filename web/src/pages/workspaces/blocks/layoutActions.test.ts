import { describe, expect, it } from 'vitest'
import type { PaneAction, WorkspacesData } from '../types.ts'
import { herdrFocuses, swapTargets, withLayoutActions, zoomedTab } from './layoutActions.ts'

// W2: which layout actions a pane's menu and a chat's actions offer, from the herdr tabs the page read.
const data: Pick<WorkspacesData, 'liveTabs'> = {
  liveTabs: {
    w1: [
      { active: true, chats: ['a', 'b', 'c'], focused: 'b', zoomed: true },
      { active: false, chats: ['d'], focused: 'd', zoomed: false },
    ],
    w2: [{ active: true, chats: ['e'], focused: 'e', zoomed: false }],
  },
}
const sample: PaneAction[] = [
  { value: 'rename', label: 'Rename chat' },
  { value: 'close', label: 'Close pane' },
]
const values = (actions: PaneAction[]) => actions.map((a) => `${a.value}:${a.label}`)

describe('withLayoutActions (W2)', () => {
  it("gives a pane of a tab of several Zoom, Swap with… and Close pane…, Unzoom for the tab's zoomed pane", () => {
    expect(values(withLayoutActions(sample, data, 'a', 'pane'))).toEqual([
      'rename:Rename chat',
      'focus:Focus in terminal',
      'zoom:Zoom pane',
      'swap:Swap with…',
      'close:Close pane…',
    ])
    expect(values(withLayoutActions(sample, data, 'b', 'pane'))).toContain('unzoom:Unzoom pane')
  })

  it("offers Focus in terminal for a chat herdr does not focus, in the workbench and beside the desktop's sidebar only", () => {
    expect(values(withLayoutActions(sample, data, 'b', 'pane'))).not.toContain('focus:Focus in terminal')
    expect(values(withLayoutActions(sample, data, 'a', 'desktopChat'))).toEqual([
      'rename:Rename chat',
      'focus:Focus in terminal',
      'close:Close pane…',
    ])
    expect(values(withLayoutActions(sample, data, 'a', 'chat'))).not.toContain('focus:Focus in terminal')
  })

  it("gives a tab's only pane Close pane… alone, and a chat's actions Close pane… last", () => {
    // herdr focuses e, its tab's only pane.
    expect(values(withLayoutActions(sample, data, 'e', 'pane'))).toEqual(['rename:Rename chat', 'close:Close pane…'])
    expect(values(withLayoutActions([{ value: 'fork', label: 'Fork' }], data, 'a', 'chat'))).toEqual([
      'fork:Fork',
      'close:Close pane…',
    ])
  })

  it('keeps the actions of a chat with no live tab and of a fixture as they are', () => {
    expect(withLayoutActions(sample, data, 'x', 'pane')).toEqual(sample)
    expect(withLayoutActions(sample, {}, 'a', 'pane')).toEqual(sample)
    expect(withLayoutActions(sample, data, undefined, 'pane')).toEqual(sample)
  })
})

describe('the live tab helpers (W2)', () => {
  it("lists only the other chats of the chat's tab to swap with", () => {
    expect(swapTargets(data, 'a')).toEqual(['b', 'c'])
    expect(swapTargets(data, 'd')).toEqual([])
    expect(swapTargets(data, 'x')).toEqual([])
  })

  it("knows herdr's focus only in the active tab, and the zoom of the shown tab", () => {
    expect(herdrFocuses(data, 'b')).toBe(true)
    expect(herdrFocuses(data, 'a')).toBe(false)
    expect(herdrFocuses(data, 'd')).toBe(false)
    expect(zoomedTab(data, 'w1')?.focused).toBe('b')
    expect(zoomedTab(data, 'w2')).toBeUndefined()
    expect(zoomedTab(data, null)).toBeUndefined()
  })
})
