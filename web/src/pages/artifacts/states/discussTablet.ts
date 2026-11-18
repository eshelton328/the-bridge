// Figma Artifacts T4 "T4 · Discuss the artifact": on the iPad mini Discuss
// on the artifact's page (T2) opens its discussion as a page of its own, as
// the Inbox does (Inbox T17), and the tab bar hides, as in a chat. Back and
// the artifact's card at the top return to the artifact (T2); Open in
// workspace opens the chat. The discussion has no message yet. It is T2's
// data, whose discussion is D7's (references/artifacts/T04/frame.json has the
// same copy), with the discussion open.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { artifactTablet } from './artifactTablet.ts'

export const discussTablet = {
  title: 'The open artifact’s discussion on its own page on a tablet',
  frames: [{ id: 'T4', node: '452:3707', viewport: 'tablet' }],
  data: { ...artifactTablet.data },
  ui: { ...artifactTablet.ui, discussOpen: true },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
