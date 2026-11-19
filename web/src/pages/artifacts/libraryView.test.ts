import { describe, expect, it } from 'vitest'
import { libraryView, matchLine, matchPlace, searchMatches } from './screens/libraryView.ts'
import { artifactsStates } from './states/index.ts'
import type { ArtifactCard, ArtifactsUi } from './types.ts'

const { library, searchList } = artifactsStates
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

  it('lists the D4 matches in group order, each with the first place it matches', () => {
    expect(searchMatches(searchList.data, searchList.ui).map((m) => [m.card.title, m.place])).toEqual([
      ['Skill eval pass rates', 'title'],
      ['readme cold-reader run', 'description'],
      ['Writer cross-family round x1', 'link'],
    ])
  })

  it('reads the project last and matches nothing for a blank search', () => {
    const card = {
      id: 'a',
      title: 'Eval notes',
      description: 'An eval',
      preview: 'doc',
      source: 'claude',
      sourceLabel: 'Claude',
      project: 'skill-evals',
      age: '1d',
      isNew: false,
      link: 'claude.ai/artifact/a-notes',
    } satisfies ArtifactCard
    expect(matchPlace(card, 'evals')).toBe('project')
    expect(matchPlace(card, 'EVAL')).toBe('title')
    expect(matchPlace(card, '  ')).toBeUndefined()
  })

  it('keeps only the matches that pass the source chip', () => {
    expect(searchMatches(searchList.data, { ...searchList.ui, filter: 'codex' }).map((m) => m.card.title)).toEqual([
      'readme cold-reader run',
    ])
  })
})

describe('the sort (D6)', () => {
  it('keeps Found since you last looked first in every sort', () => {
    for (const sort of ['newest', 'oldest', 'title', 'project']) {
      expect(titles({ sort }).map(([id]) => id)).toEqual(['found', 'earlier'])
    }
  })

  it('keeps the state’s order for Newest first and turns it round for Oldest first', () => {
    expect(titles({ sort: 'newest' })[0]).toEqual([
      'found',
      ['Skill eval pass rates', 'Hono server spike', 'Inbox task lifecycle', 'Tailscale access check'],
    ])
    expect(titles({ sort: 'oldest' })[0]).toEqual([
      'found',
      ['Tailscale access check', 'Inbox task lifecycle', 'Hono server spike', 'Skill eval pass rates'],
    ])
  })

  it('sorts by title A to Z in any case', () => {
    expect(titles({ sort: 'title' })[1]).toEqual([
      'earlier',
      [
        'Agent factory and session tracking',
        'Application versioning and releases',
        'Brain map prototype',
        'Logo options',
        'Panda tokens playground',
        'readme cold-reader run',
        'the-bridge theme ideas',
        'Type safety in agentic systems',
      ],
    ])
  })

  it('groups by project, each project newest first', () => {
    expect(titles({ sort: 'project' })[0]).toEqual([
      'found',
      ['Hono server spike', 'Inbox task lifecycle', 'Tailscale access check', 'Skill eval pass rates'],
    ])
  })
})

describe('the phone match line (M5)', () => {
  const { searchPhone } = artifactsStates
  const card = searchPhone.data.groups.flatMap((g) => g.cards).find((c) => c.id === 'readme-cold-reader-run')
  if (card === undefined) throw new Error('no readme cold-reader run')
  const excerpts = searchPhone.data.search.excerpts

  it('shows the state’s excerpt of a description match when it holds the query, in any case', () => {
    expect(matchLine(card, 'description', 'EVAL', excerpts)).toBe('…the cold-reader eval of the readme skill…')
  })

  it('shows the whole description when the excerpt does not hold the query', () => {
    expect(matchLine(card, 'description', 'stranger', excerpts)).toBe(card.description)
    expect(card.description).toContain('stranger')
  })

  it('shows the link for a link match and nothing for a title or project match', () => {
    expect(matchLine({ ...card, link: 'example.com/evals' }, 'link', 'evals', excerpts)).toBe('example.com/evals')
    expect(matchLine(card, 'title', 'readme', excerpts)).toBeUndefined()
    expect(matchLine(card, 'project', 'skill', excerpts)).toBeUndefined()
  })
})
