// Figma Artifacts T2 "T2 · An artifact": on the iPad mini an artifact opens
// as its own page under Back, and the tab bar stays. Copy word for word from
// references/artifacts/T02/frame.json. It is T1's library with D2's open
// artifact, Skill eval pass rates, whose copy T2 repeats; Back closes it and
// shows T1's library. The discussion that Discuss opens comes with T4.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { artifactOpen } from './artifactOpen.ts'
import { libraryTablet } from './libraryTablet.ts'

export const artifactTablet = {
  title: 'An artifact on its own page on a tablet',
  frames: [{ id: 'T2', node: '405:310', viewport: 'tablet' }],
  data: { ...libraryTablet.data, open: artifactOpen.data.open },
  ui: { ...libraryTablet.ui },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
