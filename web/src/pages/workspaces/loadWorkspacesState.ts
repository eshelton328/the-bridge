// The Workspaces route's loader: the state to show, `?state=` in development,
// read through the data source (`?source=`, lib/dataSource.ts). With no
// `?state=` it is the page's home (home.ts), laid out for the window. In
// development the home reads the live source unless `?source=fixtures` names
// the sample data (d-117); a `?state=` reads its fixture state. The
// router's `signal` ends a live read when the owner leaves the page.
import { notFound } from '@tanstack/react-router'
import { parseState } from '../../errors/parseState.ts'
import { type DataSourceOptions, readState } from '../../lib/dataSource.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { workspacesHome } from './home.ts'
import { workspacesStates } from './states/index.ts'
import { WorkspacesState, type WorkspacesData, type WorkspacesUi } from './types.ts'

/** The page built live, and its home reads live in development (d-117). */
export const workspacesSources = { built: ['live'], default: 'live' } as const satisfies DataSourceOptions

export function loadWorkspacesState(
  requested: string | undefined,
  source: string | undefined,
  signal?: AbortSignal,
): ScreenState<WorkspacesData, WorkspacesUi> | Promise<ScreenState<WorkspacesData, WorkspacesUi>> {
  const read = readState<ScreenState<WorkspacesData, WorkspacesUi>>(
    workspacesStates,
    { state: requested, source },
    { key: 'home', state: workspacesHome },
    workspacesSources,
  )
  if (!read.ok) throw notFound({ data: read.error })
  const name = `workspaces/${read.value.key}`
  // The live source merges the server's workspaces into the state first, so the page schema checks what shows.
  if (import.meta.env.DEV && read.value.live)
    return import('./liveWorkspaces.ts')
      .then((live) => live.withLiveWorkspaces(read.value.state, { signal }))
      .then((merged) => parseState(WorkspacesState, merged, `${name} (live)`))
  return parseState(WorkspacesState, read.value.state, name)
}
