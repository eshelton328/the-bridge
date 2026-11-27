// The project route's loader (`/projects/<slug>`, R4): the state to show,
// `?state=` in development, read through the data source (lib/dataSource.ts),
// as the home's loader does. With no `?state=` it is the home's state with the
// page of `slug` open. In development it reads the project from the server
// (`GET /api/projects/:slug`, liveProjects.ts) unless `?source=fixtures` names
// the sample data. A slug with no project is not found.
import { notFound } from '@tanstack/react-router'
import { parseState } from '../../errors/parseState.ts'
import { type DataSourceOptions, readState } from '../../lib/dataSource.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { projectsHome } from './home.ts'
import { projectsStates } from './states/index.ts'
import { ProjectsState, type ProjectsData, type ProjectsUi } from './types.ts'

type State = ScreenState<ProjectsData, ProjectsUi>

/** The page built live, and it reads live in development, as the home does. */
const projectSources = { built: ['live'], default: 'live' } as const satisfies DataSourceOptions

/** The parsed state, or not found when no card has the open slug. */
function shown(state: State, name: string): State {
  const parsed = parseState(ProjectsState, state, name)
  if (parsed.data.notice === undefined && !parsed.data.projects.some((p) => p.slug === parsed.ui.open))
    throw notFound({ data: `no project ${String(parsed.ui.open)}` })
  return parsed
}

export function loadProjectState(
  slug: string,
  requested: string | undefined,
  source: string | undefined,
  signal?: AbortSignal,
): State | Promise<State> {
  const read = readState<State>(
    projectsStates,
    { state: requested, source },
    { key: 'project', state: { ...projectsHome, ui: { open: slug } } },
    projectSources,
  )
  if (!read.ok) throw notFound({ data: read.error })
  const name = `projects/${read.value.key}`
  if (import.meta.env.DEV && read.value.live)
    return import('./liveProjects.ts')
      .then((live) => live.withLiveProject(read.value.state, slug, { signal }))
      .then((merged) => shown(merged, `${name} (live)`))
  return shown(read.value.state, name)
}
