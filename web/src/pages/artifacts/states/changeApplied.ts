// Figma Artifacts D9 "D9 · The artifact after Apply": D8 after Apply. Apply
// republishes the artifact to the same link, so the link and the library
// entry stay. The artifact shows Updated, and the proposal turns to
// Applied with the lines it put in, as the Inbox's applied update (Inbox
// D16). What Apply shows is in changeProposed.ts, so D8's Apply shows this
// state; copy word for word from references/artifacts/D09/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { changeProposed } from './changeProposed.ts'

export const changeApplied = {
  title: 'The artifact after Apply',
  frames: [{ id: 'D9', node: '452:3086', viewport: 'desktop' }],
  data: {
    ...changeProposed.data,
    // This frame's node ids of its two "button · Open in workspace" layers.
    discussion: { ...changeProposed.data.discussion, layers: { header: '452:3644', madeIn: '452:3634' } },
  },
  ui: { ...changeProposed.ui, discussProposal: 'applied' },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
