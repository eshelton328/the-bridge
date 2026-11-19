// Figma Artifacts D2 "D2 · An artifact open": Skill eval pass rates open
// beside the library list, as the Inbox opens a task beside its list. Copy
// taken word for word from references/artifacts/D02/frame.json. The list
// keeps D1's chips, groups and cards; its search has a shorter placeholder.
// It carries the artifact's discussion, which Discuss opens (D7); its copy
// is from references/artifacts/D07/frame.json.
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
    discussion: {
      title: 'Discuss this artifact',
      openInWorkspace: 'Open in workspace',
      model: 'Opus 5.5',
      context: 46,
      contextLabel: 'context',
      guard:
        'Continues chat quiet-nebula, which made this artifact. Changes the artifact only when you apply, and Apply republishes it to the same link.',
      empty: {
        title: 'Talk this artifact through',
        text: 'Ask about the artifact, its data or how it was made. When you ask for a change, it shows here as a proposal. Nothing changes until you apply it.',
        canLabel: 'It can',
        can: [
          { icon: 'edit', text: 'Update this artifact: its page, title or description' },
          { icon: 'plus', text: 'Make a new artifact from it' },
          { icon: 'trash', text: 'Remove it from the library, with a reason' },
        ],
        suggestions: ['Add a median line', 'Sort the bars by pass rate', 'Why did readme drop?'],
      },
      placeholder: 'Ask about this artifact',
      entries: [],
      layers: { header: '452:2464', madeIn: '452:2406' },
    },
    // The project menu, in M7's words (references/artifacts/M07/frame.json): the project chip opens it on a desktop
    // or tablet, and the phone's ⋯ opens it as File in a project. D2 draws it closed.
    fileMenu: {
      title: 'File in a project',
      done: 'Done',
      none: { label: 'Not in a project', count: '1' },
      projects: [
        { value: 'ncc-1701', count: '9 artifacts' },
        { value: 'omni', count: '6 artifacts' },
        { value: 'omni-brain', count: '3 artifacts' },
        { value: 'skill-evals', count: '5 artifacts' },
      ],
      remove: 'Remove from the library',
      note: 'Removing takes the link out of the library only; the artifact stays where it was published.',
    },
  },
  ui: { ...library.ui },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
