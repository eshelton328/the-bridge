import { describe, expect, it } from 'vitest'
import { openItem } from './screens/itemView.ts'
import { openItem as openItemFromMap, showOnMap as showOnMapChange } from './screens/itemView.ts'
import { toolkitStates } from './states/index.ts'

const { ruleOpen, skillOpen, toolkitList } = toolkitStates
const { workflowOpen } = toolkitStates

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

  it('opens a rule with when it loads and no side column (D4)', () => {
    const open = openItem(ruleOpen.data, ruleOpen.ui)
    expect(open?.item.kind).toBe('rule')
    expect(open?.detail.loads?.when).toBe('a file under toolkit/skills/** or skills/** changes')
    expect(open?.detail.usedIn).toBeUndefined()
    expect(open?.detail.files).toBeUndefined()
  })

  it('opens a workflow with its steps by phase, each step in a row of its phase (D8)', () => {
    const open = openItem(workflowOpen.data, workflowOpen.ui)
    expect(open?.item).toMatchObject({ kind: 'workflow', name: 'skill-eval-round' })
    const phases = open?.detail.flow?.phases ?? []
    expect(phases.map((p) => p.label)).toEqual(['Check', 'Run', 'Grade · in parallel', 'Decide'])
    for (const phase of phases) {
      const rows = phase.steps.map((s) => s.row)
      // The flow draws three rows; a phase's steps are in order and never share a row.
      expect(rows.every((r) => r >= 0 && r <= 2)).toBe(true)
      expect(rows).toEqual([...new Set(rows)].sort((a, b) => a - b))
    }
  })
})

describe('an item on the map', () => {
  it('opens from its map node when the list has no such item, with its link counts', () => {
    const open = openItemFromMap(toolkitList.data, { open: 'rules/writing.md' })
    expect(open?.item).toMatchObject({ kind: 'rule', name: 'writing', path: 'rules/writing.md' })
    expect([open?.item.linksTo, open?.item.linkedFrom]).toEqual([6, 3])
  })

  it('has the same path as the list item of the same kind and name, in every state', () => {
    for (const state of Object.values(toolkitStates)) {
      const nodes = new Map(state.data.map.nodes.map((n) => [`${n.kind} ${n.name}`, n.path]))
      for (const item of state.data.groups.flatMap((g) => g.items)) {
        const node = nodes.get(`${item.kind} ${item.name}`)
        if (node !== undefined) expect(node).toBe(item.path)
      }
    }
  })
})

describe('showOnMap', () => {
  it('closes the item, shows it selected on the map and clears the chip and the search', () => {
    expect(showOnMapChange('skills/writer/')).toEqual({
      open: null,
      view: 'map',
      mapSelected: 'skills/writer/',
      filter: 'all',
      query: '',
    })
  })
})
