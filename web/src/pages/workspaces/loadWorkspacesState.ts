// The Workspaces route's loader: the state to show, `?state=` in development,
// read through the data source (`?source=`, lib/dataSource.ts). With no
// `?state=` it is the page's home (home.ts), laid out for the window. In
// development the home reads the live source unless `?source=fixtures` names
// the sample data (d-117); a `?state=` reads its fixture state. The
// router's `signal` ends a live read when the owner leaves the page.
import { notFound } from '@tanstack/react-router'
import { pendingTiming } from '../../lib/pendingTiming.ts'
import { parseState } from '../../errors/parseState.ts'
import { type DataSourceOptions, readsLiveServer, readState } from '../../lib/dataSource.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { workspacesHome } from './home.ts'
import { workspacesStates } from './states/index.ts'
import { WorkspacesState, type WorkspacesData, type WorkspacesUi } from './types.ts'

/** The page built live, and its home reads live in development (d-117). */
export const workspacesSources = { built: ['live'], default: 'live' } as const satisfies DataSourceOptions

function loadWorkspacesState(
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
  if (readsLiveServer() && read.value.live)
    return import('./liveWorkspaces.ts')
      .then((live) => live.withLiveWorkspaces(read.value.state, { signal }))
      .then((merged) => parseState(WorkspacesState, merged, `${name} (live)`))
  return parseState(WorkspacesState, read.value.state, name)
}

type Shown = ScreenState<WorkspacesData, WorkspacesUi>

/** The route's loader data: the state, or the live read that is still on its way (useSettledState.ts). */
export type WorkspacesLoad = { readonly state: Shown | Promise<Shown> }

/**
 * The route's loader (NCC-181). A fixture state, and a live read that answers within pendingMs, come as the state, so
 * a quick load shows no loading layout. A slower live read comes as its promise and the route shows at once: the page
 * draws its loading layout in its own tree and fills it when the read settles, so nothing mounts twice, as it did when
 * the router swapped a pendingComponent for the page. A read that fails within pendingMs fails the route, as before.
 */
export function loadWorkspacesRoute(
  requested: string | undefined,
  source: string | undefined,
  signal?: AbortSignal,
): WorkspacesLoad | Promise<WorkspacesLoad> {
  const state = loadWorkspacesState(requested, source, signal)
  if (!(state instanceof Promise)) return { state }
  // The page takes the read's result; this only marks a read that ends after the page left as handled.
  void state.catch(() => undefined)
  let timer: number | undefined
  const late = new Promise<undefined>((resolve) => {
    timer = window.setTimeout(resolve, pendingTiming.defaultPendingMs)
  })
  return Promise.race([state.then((value) => ({ value })), late])
    .then((quick) => ({ state: quick === undefined ? state : quick.value }))
    .finally(() => {
      window.clearTimeout(timer)
    })
}
