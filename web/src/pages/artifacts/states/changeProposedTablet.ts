// Figma Artifacts T5 "T5 · A proposed update": T4's discussion page on the
// iPad mini after the owner asked for a change, with D8's question, reply and
// proposed update to the chart: Apply, Discard or Edit first. Apply returns
// to the artifact's page (T2), which shows Updated, as D9 does on the
// desktop; reopened, the discussion shows the applied proposal. It is T4's
// data with D8's discussion and open artifact (references/artifacts/T05/frame.json
// has the same copy); the Back label is T4's and the node id of its one
// Open in workspace is T5's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { changeProposed } from './changeProposed.ts'
import { discussTablet } from './discussTablet.ts'

export const changeProposedTablet = {
  title: 'A proposed update to the artifact in its discussion page on a tablet',
  frames: [{ id: 'T5', node: '452:3841', viewport: 'tablet' }],
  data: {
    ...discussTablet.data,
    open: changeProposed.data.open,
    discussion: { ...changeProposed.data.discussion, back: 'Artifact', layers: { header: '452:3978' } },
  },
  ui: { ...discussTablet.ui },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
