import { describe, expect, it } from 'vitest'
import { listView } from './screens/listView.ts'
import { mapView } from './screens/listView.ts'
import { toolkitStates } from './states/index.ts'

const { toolkitList } = toolkitStates
const { toolkitMap } = toolkitStates
const names = (view: ReturnType<typeof listView>) => view.groups.map((g) => [g.kind, g.items.map((i) => i.name)])

describe('listView', () => {
  it('shows every group under All with no search', () => {
    const view = listView(toolkitList.data, { filter: 'all', query: '' })
    expect(view.groups.map((g) => [g.kind, g.items.length])).toEqual([
      ['skill', 9],
      ['agent', 7],
    ])
  })

  it('keeps only the chip kind', () => {
    const view = listView(toolkitList.data, { filter: 'agent', query: '' })
    expect(view.groups.map((g) => g.kind)).toEqual(['agent'])
  })

  it('matches the name, path and description, ignoring case, and drops empty groups', () => {
    expect(names(listView(toolkitList.data, { filter: 'all', query: 'MERMAID' }))).toEqual([
      ['skill', ['mermaid-diagrams']],
      ['agent', ['diagram-reviewer']],
    ])
    expect(names(listView(toolkitList.data, { filter: 'all', query: 'agents/eval' }))).toEqual([
      ['agent', ['eval-case-writer', 'eval-grader']],
    ])
    expect(listView(toolkitList.data, { filter: 'skill', query: 'nothing like this' }).groups).toEqual([])
  })

  it('names the items that share a name', () => {
    expect([...listView(toolkitList.data, { filter: 'all', query: '' }).sharedNames]).toEqual(['writer'])
    expect(listView(toolkitList.data, { filter: 'skill', query: '' }).sharedNames.size).toBe(0)
  })
})

describe('mapView', () => {
  const map = toolkitMap.data.map
  const paths = (view: ReturnType<typeof mapView>) => view.nodes.map((n) => n.path)

  it('shows every node and link under All with no search', () => {
    const view = mapView(map, { filter: 'all', query: '' })
    expect([view.nodes.length, view.links.length]).toEqual([27, 47])
  })

  it('keeps only the chip kind, and the links between two shown nodes', () => {
    const view = mapView(map, { filter: 'agent', query: '' })
    expect(view.nodes.every((n) => n.kind === 'agent')).toBe(true)
    expect(view.nodes).toHaveLength(7)
    expect(view.links).toEqual([{ from: 'agents/writer.md', to: 'agents/writing-reviewer.md' }])
  })

  it('matches the name and path, ignoring case, and shows nothing for no match', () => {
    expect(paths(mapView(map, { filter: 'all', query: 'MERMAID' }))).toEqual(['skills/mermaid-diagrams/'])
    expect(mapView(map, { filter: 'all', query: 'no-such-tool' })).toMatchObject({ nodes: [], links: [] })
  })
})

describe('every state', () => {
  it('has the map, so the Map view is never empty', () => {
    for (const state of Object.values(toolkitStates)) expect(state.data.map.nodes).toHaveLength(27)
  })
})
