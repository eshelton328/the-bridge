// Figma Artifacts D1: D1 · Library. An empty page: only the page title (d-105); the artifacts loop builds the frame.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'

export const library = {
  title: 'The Artifacts page before it is built',
  frames: [{ id: 'D1', node: '402:15229', viewport: 'desktop' }],
  data: { title: 'Artifacts' },
  ui: {},
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
