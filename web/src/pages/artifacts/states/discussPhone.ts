// Figma Artifacts M9 "M9 · Discuss the artifact": on the phone Discuss on
// the artifact's page (M2) opens its discussion as a page of its own, as the
// Inbox does (Inbox M18), and the tab bar hides, as in a chat. Back and the
// artifact's card at the top return to the artifact (M2); Open in workspace
// opens the chat. The model and context sit in the card, under its meta
// line, as the Inbox's phone discussion has them. The discussion has no
// message yet. It is M2's data, whose discussion is D7's
// (references/artifacts/M09/frame.json has the same copy), with the
// discussion open.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { artifactPhone } from './artifactPhone.ts'

export const discussPhone = {
  title: 'The open artifact’s discussion on its own page on a phone',
  frames: [{ id: 'M9', node: '452:3982', viewport: 'phone' }],
  data: { ...artifactPhone.data },
  ui: { ...artifactPhone.ui, discussOpen: true },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
