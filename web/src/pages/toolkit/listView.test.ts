import { describe, expect, it } from 'vitest'
import { listView } from './screens/listView.ts'
import { toolkitStates } from './states/index.ts'

const { toolkitList } = toolkitStates
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
