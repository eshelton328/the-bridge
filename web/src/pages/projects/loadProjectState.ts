// The project route's loader (`/projects/<slug>`, R4): the state to show,
// `?state=` in development, read through the data source (lib/dataSource.ts),
// as the home's loader does. With no `?state=` it is the home's state with the
// page of `slug` open. In development it reads the project from the server
// (`GET /api/projects/:slug`, liveProjects.ts) unless `?source=fixtures` names
// the sample data. A slug with no project, or one ProjectSlug refuses (no read), is not found.
// `?tab=ideas` reads the live Ideas tab and `?idea=` the live idea's page
// (R10, R11; an idea the server does not know is not found),
// `?tab=repositories` the live Repositories tab (increment two).
import { ProjectSlug } from '@bridge/contract'
import { notFound } from '@tanstack/react-router'
import { parseState } from '../../errors/parseState.ts'
import { type DataSourceOptions, readsLiveServer, readState } from '../../lib/dataSource.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { projectsHome } from './home.ts'
import { projectsStates } from './states/index.ts'
import { type ProjectTab, ProjectsState, type ProjectsData, type ProjectsUi } from './types.ts'

type State = ScreenState<ProjectsData, ProjectsUi>

/** The page built live, and it reads live in development, as the home does. */
const projectSources = { built: ['live'], default: 'live' } as const satisfies DataSourceOptions

/** The parsed state, or not found when no card has the open slug. */
function shown(state: State, name: string): State {
  const parsed = parseState(ProjectsState, state, name)
  if (parsed.data.notice === undefined && !parsed.data.projects.some((p) => p.slug === parsed.ui.open))
    throw notFound({ data: `no project ${String(parsed.ui.open)}` })
  if (parsed.ui.idea !== undefined && parsed.data.idea === undefined) throw notFound({ data: 'no such idea' })
  return parsed
}

export function loadProjectState(
  slug: string,
  requested: string | undefined,
  source: string | undefined,
  signal?: AbortSignal,
  view: { readonly tab?: ProjectTab | undefined; readonly idea?: string | undefined } = {},
): State | Promise<State> {
  if (!ProjectSlug.safeParse(slug).success) throw notFound({ data: 'not a project slug' })
  const read = readState<State>(
    projectsStates,
    { state: requested, source },
    { key: 'project', state: { ...projectsHome, ui: { open: slug } } },
    projectSources,
  )
  if (!read.ok) throw notFound({ data: read.error })
  const name = `projects/${read.value.key}`
  if (readsLiveServer() && read.value.live)
    return import('./liveProjects.ts')
      .then(async (live) => {
        // An idea's page shows on the Ideas tab, whatever `?tab=` says.
        const tab = view.idea === undefined ? view.tab : 'ideas'
        const project = await live.withLiveProject(read.value.state, slug, {
          signal,
          chats: tab !== 'ideas' && tab !== 'repositories',
        })
        if (tab === undefined || tab === 'overview' || project.data.projects.length === 0) return project
        const shownTab = { ...project, ui: { ...project.ui, tab } }
        return tab === 'ideas'
          ? live.withLiveIdeas(shownTab, slug, view.idea, { signal })
          : live.withLiveRepositories(shownTab, slug, { signal })
      })
      .then((merged) => shown(merged, `${name} (live)`))
  return shown(read.value.state, name)
}
