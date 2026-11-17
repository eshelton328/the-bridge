// Figma Artifacts D8 "D8 · A proposed update": the D7 discussion after Erik
// asked for a change. The discussion answers and proposes it with what
// changes, as the Inbox's proposed update (Inbox D15): Apply, Discard or Edit
// first. Nothing changes until Apply. Copy word for word from
// references/artifacts/D08/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactDiscussion, ArtifactsData, ArtifactsUi } from '../types.ts'
import { discussOpen } from './discussOpen.ts'

/** D7's discussion with one question, the reply and, after it, the proposed change to the chart. */
const discussion = (base: ArtifactDiscussion): ArtifactDiscussion => ({
  ...base,
  context: 48,
  entries: [
    { type: 'user', text: 'Add a dashed line at the median pass rate, and sort the bars from lowest to highest.' },
    {
      type: 'reply',
      name: 'Discussion',
      text: 'The pass rates come from the method log, so I can do both. This changes the chart only. The title and description stay.',
    },
    {
      type: 'proposal',
      proposal: {
        label: 'Proposed · Update this artifact',
        section: 'Chart',
        lines: [
          { change: 'removed', text: 'Bars in the order of the method log' },
          { change: 'added', text: 'Bars sorted from the lowest pass rate to the highest' },
          { change: 'added', text: 'A dashed line at the median pass rate, 71%' },
        ],
      },
    },
  ],
  layers: { header: '452:3082', madeIn: '452:3016' },
})

export const changeProposed = {
  title: 'A proposed update to the artifact in its discussion',
  frames: [{ id: 'D8', node: '452:2468', viewport: 'desktop' }],
  data: { ...discussOpen.data, discussion: discussion(discussOpen.data.discussion) },
  ui: { ...discussOpen.ui },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
