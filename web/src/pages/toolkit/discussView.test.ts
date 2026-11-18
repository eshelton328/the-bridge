import { describe, expect, it } from 'vitest'
import {
  closeDiscuss,
  discussEntries,
  discussionOf,
  openDiscussion,
  sendDiscuss,
  toggleDiscuss,
  withDiscussReset,
} from './screens/discussView.ts'
import { openItem, openFrom, showOnMap } from './screens/itemView.ts'
import { toolkitStates } from './states/index.ts'

const { skillDiscuss, skillDiscussPhone, skillDiscussTablet, skillOpen, ruleOpen } = toolkitStates

describe('discussionOf', () => {
  it('gives each layout its own discussion of writer: D5, T5 and M7', () => {
    const open = openItem(skillOpen.data, skillOpen.ui)
    expect(discussionOf(open, 'desktop')?.model).toBe('Opus 5.5')
    expect(discussionOf(open, 'desktop')?.entries).toHaveLength(2)
    expect(discussionOf(open, 'tablet')?.model).toBe('Sonnet 5.5')
    expect(discussionOf(open, 'tablet')?.entries).toHaveLength(0)
    expect(discussionOf(open, 'phone')?.openInWorkbench).toBe('Workbench')
    expect(discussionOf(open, 'phone')?.empty.tryLabel).toBe('Try')
  })

  it('takes the desktop discussion for a layout with none, and none for an item with none or nothing open', () => {
    const open = openItem(skillOpen.data, skillOpen.ui)
    if (open === null) throw new Error('no writer')
    const desktopOnly = { ...open, detail: { ...open.detail, discuss: { desktop: discussionOf(open, 'desktop') } } }
    expect(discussionOf(desktopOnly, 'phone')?.model).toBe('Opus 5.5')
    expect(discussionOf(openItem(ruleOpen.data, ruleOpen.ui), 'desktop')).toBeUndefined()
    expect(discussionOf(null, 'desktop')).toBeUndefined()
  })
})

describe('openDiscussion', () => {
  it('shows the discussion only while ui.discussOpen is set (D5, T5, M7)', () => {
    for (const [state, layout] of [
      [skillDiscuss, 'desktop'],
      [skillDiscussTablet, 'tablet'],
      [skillDiscussPhone, 'phone'],
    ] as const) {
      expect(openDiscussion(openItem(state.data, state.ui), state.ui, layout)).toBeDefined()
    }
    expect(openDiscussion(openItem(skillOpen.data, skillOpen.ui), skillOpen.ui, 'desktop')).toBeUndefined()
  })

  it('opens D5 on the item D5 draws: writer with no Used in workflows', () => {
    const open = openItem(skillDiscuss.data, skillDiscuss.ui)
    expect(open?.detail.usedIn).toBeUndefined()
    expect(open?.detail.files?.count).toBe(11)
  })
})

describe('the discussion taps', () => {
  it('Discuss toggles the desktop panel and opens the page on a tablet or phone', () => {
    expect(toggleDiscuss({}, 'desktop')).toEqual({ discussOpen: true })
    expect(toggleDiscuss({ discussOpen: true }, 'desktop')).toEqual({ discussOpen: false })
    expect(toggleDiscuss({ discussOpen: true }, 'tablet')).toEqual({ discussOpen: true })
    expect(toggleDiscuss({}, 'phone')).toEqual({ discussOpen: true })
  })

  it('close and Back close it and keep the draft', () => {
    expect(closeDiscuss()).toEqual({ discussOpen: false })
  })

  it('a sent message follows the entries, and the reply box empties', () => {
    const discussion = discussionOf(openItem(skillOpen.data, skillOpen.ui), 'desktop')
    if (discussion === undefined) throw new Error('no discussion')
    const change = sendDiscuss({ discussSent: ['first'] }, 'second')
    expect(change).toEqual({ discussSent: ['first', 'second'], discussDraft: '' })
    const entries = discussEntries(discussion, change)
    expect(entries).toHaveLength(4)
    expect(entries.at(-1)).toEqual({ type: 'user', text: 'second' })
  })

  it('opening another item, or none, closes and empties the discussion; other changes keep it', () => {
    const ui = { open: 'skills/writer/' }
    expect(withDiscussReset(ui, openFrom('agents/writing-reviewer.md', 'skills/writer/'))).toMatchObject({
      discussOpen: undefined,
      discussDraft: undefined,
      discussSent: undefined,
    })
    expect(withDiscussReset(ui, showOnMap('skills/writer/'))).toMatchObject({ discussOpen: undefined })
    expect(withDiscussReset(ui, { discussDraft: 'Why?' })).toEqual({ discussDraft: 'Why?' })
    expect(withDiscussReset(ui, { open: 'skills/writer/', itemTab: 'files' })).toEqual({
      open: 'skills/writer/',
      itemTab: 'files',
    })
  })
})
