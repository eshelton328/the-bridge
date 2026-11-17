// Figma Artifacts D2 "D2 · An artifact open": Skill eval pass rates open
// beside the library list, as the Inbox opens a task beside its list. Copy
// taken word for word from references/artifacts/D02/frame.json. The list
// keeps D1's chips, groups and cards; its search has a shorter placeholder.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { library } from './library.ts'

export const artifactOpen = {
  title: 'An artifact open beside the list',
  frames: [{ id: 'D2', node: '403:2', viewport: 'desktop' }],
  data: {
    ...library.data,
    searchPlaceholder: 'Search artifacts',
    open: {
      id: 'skill-eval-pass-rates',
      isNew: true,
      found: 'found 12m ago by the Artifact hook',
      title: 'Skill eval pass rates',
      description:
        'Pass rates per round for every skill in the toolkit, with and without the skill, from the skill-evals method log.',
      source: 'claude',
      sourceLabel: 'Claude artifact',
      project: 'skill-evals',
      updated: 'updated 12m ago',
      preview: 'chart',
      link: 'claude.ai/artifact/8f3c2a91-skill-evals',
      madeIn: {
        label: 'Made in',
        source: 'claude',
        title: 'Published from chat quiet-nebula',
        meta: 'workspace skill-evals · Opus 5.5 · 12m ago',
      },
    },
  },
  ui: { ...library.ui },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
