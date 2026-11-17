// Figma Artifacts D4 "D4 · Search, in the list view": the library in its
// list view with "eval" in the search. Search reads titles, descriptions,
// projects and links; each match says where it is, and the list shows the
// description and meta line of each artifact. Copy word for word from
// references/artifacts/D04/frame.json. It starts from D1's data: the chips
// count the matches, the readme cold-reader run has its D4 description and
// Earlier gains the Writer cross-family round, whose link holds the match.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactCard, ArtifactsData, ArtifactsUi } from '../types.ts'
import { library } from './library.ts'

/** 403:8279: the third match, found by its link. */
const writerRound = {
  id: 'writer-cross-family-x1',
  title: 'Writer cross-family round x1',
  description: 'Grades for the writer skill against the writing rules',
  preview: 'doc',
  source: 'claude',
  sourceLabel: 'Claude',
  project: 'skill-evals',
  age: '2w',
  isNew: false,
  link: 'claude.ai/artifact/c71e…/writer-eval-x1',
} satisfies ArtifactCard

/** 403:8264: D4 gives the readme cold-reader run its own description; D1's repeats the pass rates one. */
const readmeDescription =
  'The cold-reader eval of the readme skill: what a stranger understood, and each command’s result'

export const searchList = {
  title: 'A search in the list view, each match with where it is',
  frames: [{ id: 'D4', node: '403:7630', viewport: 'desktop' }],
  data: {
    ...library.data,
    chips: [
      { value: 'all', label: 'All', count: 3 },
      { value: 'claude', label: 'Claude', count: 2 },
      { value: 'codex', label: 'Codex', count: 1 },
      { value: 'new', label: 'New', count: 1 },
    ],
    groups: library.data.groups.map((group) =>
      group.id === 'earlier'
        ? {
            ...group,
            cards: [
              ...group.cards.map((card) =>
                card.id === 'readme-cold-reader-run' ? { ...card, description: readmeDescription } : card,
              ),
              writerRound,
            ],
          }
        : group,
    ),
    search: {
      places: { title: 'in title', description: 'in description', link: 'in link', project: 'in project' },
      hint: 'Search reads titles, descriptions, projects and links. Filters and the source chips still apply.',
    },
  },
  ui: { ...library.ui, view: 'list', query: 'eval' },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
