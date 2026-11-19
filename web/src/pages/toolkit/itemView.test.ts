import { describe, expect, it } from 'vitest'
import { openItem } from './screens/itemView.ts'
import { openItem as openItemFromMap, showOnMap as showOnMapChange } from './screens/itemView.ts'
import { backTo, openedFrom, openFrom } from './screens/itemView.ts'
import { openLinks } from './screens/itemView.ts'
import { toolkitStates } from './states/index.ts'

const { ruleOpen, skillOpen, toolkitList } = toolkitStates
const { workflowOpen } = toolkitStates
const { agentOpenTablet } = toolkitStates

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

describe('an item opened from another item (T7)', () => {
  it('records the item it came from, and none from the list', () => {
    expect(openFrom('agents/writing-reviewer.md', 'skills/writer/')).toEqual({
      open: 'agents/writing-reviewer.md',
      from: 'skills/writer/',
    })
    expect(openFrom('agents/writing-reviewer.md')).toEqual({ open: 'agents/writing-reviewer.md', from: null })
  })

  it('finds the item it came from for the breadcrumb', () => {
    const from = openedFrom(agentOpenTablet.data, agentOpenTablet.ui)
    expect(from).toMatchObject({ kind: 'skill', name: 'writer', path: 'skills/writer/' })
  })

  it('has no breadcrumb without ui.from, with nothing open, for itself or for a path the list does not have', () => {
    const { data, ui } = agentOpenTablet
    expect(openedFrom(data, { ...ui, from: null })).toBeNull()
    expect(openedFrom(data, { open: ui.open })).toBeNull()
    expect(openedFrom(data, { ...ui, open: null })).toBeNull()
    expect(openedFrom(data, { ...ui, from: 'agents/writing-reviewer.md' })).toBeNull()
    expect(openedFrom(data, { ...ui, from: 'skills/nothing/' })).toBeNull()
  })

  it('goes back to the item it came from, or to the list, and forgets the way back', () => {
    expect(backTo('skills/writer/')).toEqual({ open: 'skills/writer/', from: null })
    expect(backTo(null)).toEqual({ open: null, from: null })
  })
})

describe('openLinks', () => {
  // M11 461:1268: the phone map card's Show links opens the selected item on its Links tab, from the map.
  it('opens the item from the map on its Links tab, with no file of an earlier tab', () => {
    expect(openLinks('skills/writer/')).toEqual({
      open: 'skills/writer/',
      from: null,
      itemTab: 'links',
      file: undefined,
      fileView: undefined,
      filePage: undefined,
      line: undefined,
    })
    const { skillLinks } = toolkitStates
    expect(openItem(skillLinks.data, { ...skillLinks.ui, ...openLinks('skills/writer/') })?.tab).toBe('links')
  })
})
