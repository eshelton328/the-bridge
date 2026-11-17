// The Workspaces page as the canvas and the state checks see it.
import { createElement } from 'react'
import type { PageDefinition } from '../../lib/screenState.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'
import { WorkspacesState, type WorkspacesData, type WorkspacesUi } from './types.ts'

export const workspacesPage = {
  id: 'workspaces',
  title: 'Workspaces',
  schema: WorkspacesState,
  states: workspacesStates,
  render: (state, viewport) => createElement(WorkspacesScreen, { data: state.data, ui: state.ui, viewport }),
} satisfies PageDefinition<WorkspacesData, WorkspacesUi, keyof typeof workspacesStates>
