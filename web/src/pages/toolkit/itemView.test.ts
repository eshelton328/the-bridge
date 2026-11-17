import { describe, expect, it } from 'vitest'
import { openItem } from './screens/itemView.ts'
import { toolkitStates } from './states/index.ts'

const { skillOpen, toolkitList } = toolkitStates

describe('openItem', () => {
  it('opens nothing without ui.open, or for a path the list does not have', () => {
    expect(openItem(toolkitList.data, { open: null })).toBeNull()
    expect(openItem(toolkitList.data, {})).toBeNull()
    expect(openItem(toolkitList.data, { open: 'skills/nothing/' })).toBeNull()
  })

  it('opens the item with its details on the first tab', () => {
    const open = openItem(skillOpen.data, skillOpen.ui)
    expect(open?.item.name).toBe('writer')
    expect(open?.item.kind).toBe('skill')
    expect(open?.detail.location).toBe('toolkit/skills/writer/')
    expect(open?.tab).toBe('overview')
  })

  it('shows the tab in ui.itemTab when the item has it', () => {
    expect(openItem(skillOpen.data, { ...skillOpen.ui, itemTab: 'evals' })?.tab).toBe('evals')
    expect(openItem(skillOpen.data, { ...skillOpen.ui, itemTab: 'nothing' })?.tab).toBe('overview')
  })

  it('opens an item with no details from what the list knows', () => {
    const open = openItem(skillOpen.data, { open: 'agents/writer.md' })
    expect(open?.item.kind).toBe('agent')
    expect(open?.detail.location).toBe('toolkit/agents/writer.md')
    expect(open?.detail.description).toBe('Drafts one doc, ticket or PRD in its own context')
    expect(open?.detail.tabs.map((t) => t.value)).toEqual(['overview'])
  })
})
