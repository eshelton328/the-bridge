// The Artifacts page as the canvas and the state checks see it.
import { createElement } from 'react'
import type { PageDefinition } from '../../lib/screenState.ts'
import { ArtifactsScreen } from './screens/ArtifactsScreen.tsx'
import { artifactsStates } from './states/index.ts'
import { ArtifactsState, type ArtifactsData, type ArtifactsUi } from './types.ts'

export const artifactsPage = {
  id: 'artifacts',
  title: 'Artifacts',
  schema: ArtifactsState,
  states: artifactsStates,
  render: (state, viewport) => createElement(ArtifactsScreen, { data: state.data, ui: state.ui, viewport }),
} satisfies PageDefinition<ArtifactsData, ArtifactsUi, keyof typeof artifactsStates>
