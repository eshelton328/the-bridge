// The Projects page as the canvas and the state checks see it.
import { createElement } from 'react'
import type { PageDefinition } from '../../lib/screenState.ts'
import { ProjectsScreen } from './screens/ProjectsScreen.tsx'
import { projectsStates } from './states/index.ts'
import { ProjectsState, type ProjectsData, type ProjectsUi } from './types.ts'

export const projectsPage = {
  id: 'projects',
  title: 'Projects',
  schema: ProjectsState,
  states: projectsStates,
  render: (state, viewport) => createElement(ProjectsScreen, { data: state.data, ui: state.ui, viewport }),
} satisfies PageDefinition<ProjectsData, ProjectsUi, keyof typeof projectsStates>
