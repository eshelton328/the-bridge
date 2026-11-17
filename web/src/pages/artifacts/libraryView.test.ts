import { describe, expect, it } from 'vitest'
import { libraryView } from './screens/libraryView.ts'
import { artifactsStates } from './states/index.ts'
import type { ArtifactsUi } from './types.ts'

const { library } = artifactsStates
const titles = (ui: Partial<ArtifactsUi>) =>
  libraryView(library.data, { ...library.ui, ...ui }).map((g) => [g.id, g.cards.map((c) => c.title)])

describe('libraryView', () => {
  it('shows both groups with every card under All', () => {
    const groups = libraryView(library.data, library.ui)
    expect(groups.map((g) => [g.id, g.cards.length])).toEqual([
      ['found', 4],
      ['earlier', 8],
    ])
  })

  it('keeps only the Codex sites under the Codex chip', () => {
    expect(titles({ filter: 'codex' })).toEqual([
      ['found', ['Hono server spike', 'Tailscale access check']],
      ['earlier', ['Panda tokens playground', 'readme cold-reader run']],
    ])
  })

  it('leaves out a group with no card left, as Earlier under New', () => {
    expect(titles({ filter: 'new' }).map(([id]) => id)).toEqual(['found'])
  })

  it('matches a search in titles, descriptions and projects, in any case', () => {
    expect(titles({ query: 'RESEARCH report' })).toEqual([
      [
        'earlier',
        ['Application versioning and releases', 'Agent factory and session tracking', 'Type safety in agentic systems'],
      ],
    ])
    expect(titles({ query: 'omni-brain' })).toEqual([['earlier', ['Brain map prototype']]])
  })
})
