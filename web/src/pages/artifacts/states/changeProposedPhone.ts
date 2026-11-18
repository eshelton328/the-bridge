// Figma Artifacts M10 "M10 · A proposed update": M9's discussion page on the
// phone after Erik asked for a change, with D8's question, reply and proposed
// update to the chart: Apply, Discard or Edit first. Apply republishes the
// artifact to the same link and, as on the tablet (T5), returns to the
// artifact's page (M2), which shows Updated; reopened, the discussion shows
// the applied proposal. It is M9's data with D8's entries, context and what
// Apply shows (references/artifacts/M10/frame.json has the same copy); the
// Back label, the card's source and the "Try" label stay M9's, and the node
// id of its one Open in workspace is M10's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { changeProposed } from './changeProposed.ts'
import { discussPhone } from './discussPhone.ts'

const proposed = changeProposed.data

export const changeProposedPhone = {
  title: 'A proposed update to the artifact in its discussion page on a phone',
  frames: [{ id: 'M10', node: '452:4080', viewport: 'phone' }],
  data: {
    ...discussPhone.data,
    open: { ...discussPhone.data.open, applied: proposed.open.applied },
    discussion: {
      ...discussPhone.data.discussion,
      context: proposed.discussion.context,
      entries: proposed.discussion.entries,
      layers: { header: '452:4181' },
    },
  },
  ui: { ...discussPhone.ui },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
