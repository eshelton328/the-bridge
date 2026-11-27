// The Projects route's loader: the state to show, `?state=` in development,
// read through the data source (`?source=`, lib/dataSource.ts). With no
// `?state=` it is the page's home (home.ts), laid out for the window. The page
// reads its fixtures only; a live source comes with the server's projects.
import { notFound } from '@tanstack/react-router'
import { parseState } from '../../errors/parseState.ts'
import { readState } from '../../lib/dataSource.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { projectsHome } from './home.ts'
import { projectsStates } from './states/index.ts'
import { ProjectsState, type ProjectsData, type ProjectsUi } from './types.ts'

export function loadProjectsState(
  requested: string | undefined,
  source: string | undefined,
): ScreenState<ProjectsData, ProjectsUi> {
  const read = readState<ScreenState<ProjectsData, ProjectsUi>>(
    projectsStates,
    { state: requested, source },
    { key: 'home', state: projectsHome },
  )
  if (!read.ok) throw notFound({ data: read.error })
  return parseState(ProjectsState, read.value.state, `projects/${read.value.key}`)
}
