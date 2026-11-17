// Figma Artifacts D7 "D7 · Discuss, beside the artifact": Discuss on the open
// artifact (D2) opens its discussion in a panel on the right, as the Inbox
// does (D14), and the library list closes. The discussion has no message
// yet, so it shows what it can do and three questions to start with. Its
// copy is in artifactOpen.ts, from references/artifacts/D07/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { artifactOpen } from './artifactOpen.ts'

export const discussOpen = {
  title: 'The open artifact’s discussion beside it',
  frames: [{ id: 'D7', node: '452:1858', viewport: 'desktop' }],
  data: { ...artifactOpen.data },
  ui: { ...artifactOpen.ui, discussOpen: true },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
