// The Projects route's loader: the state to show, `?state=` in development,
// read through the data source (`?source=`, lib/dataSource.ts). With no
// `?state=` it is the page's home (home.ts), laid out for the window. In
// development the home reads the server's projects unless `?source=fixtures`
// names the sample data, as the Artifacts home does (d-117); a `?state=`
// reads its fixture state. The router's `signal` ends a live read when the
// owner leaves the page.
import { notFound } from '@tanstack/react-router'
import { parseState } from '../../errors/parseState.ts'
import { type DataSourceOptions, readsLiveServer, readState } from '../../lib/dataSource.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { projectsHome } from './home.ts'
import { projectsStates } from './states/index.ts'
import { ProjectsState, type ProjectsData, type ProjectsUi } from './types.ts'

/** The page built live, and its home reads live in development. */
const projectsSources = { built: ['live'], default: 'live' } as const satisfies DataSourceOptions

export function loadProjectsState(
  requested: string | undefined,
  source: string | undefined,
  signal?: AbortSignal,
): ScreenState<ProjectsData, ProjectsUi> | Promise<ScreenState<ProjectsData, ProjectsUi>> {
  const read = readState<ScreenState<ProjectsData, ProjectsUi>>(
    projectsStates,
    { state: requested, source },
    { key: 'home', state: projectsHome },
    projectsSources,
  )
  if (!read.ok) throw notFound({ data: read.error })
  const name = `projects/${read.value.key}`
  // The live source puts the server's projects on the state first, so the page schema checks what shows.
  if (readsLiveServer() && read.value.live)
    return import('./liveProjects.ts')
      .then((live) => live.withLiveProjects(read.value.state, { signal }))
      .then((merged) => parseState(ProjectsState, merged, `${name} (live)`))
  return parseState(ProjectsState, read.value.state, name)
}
