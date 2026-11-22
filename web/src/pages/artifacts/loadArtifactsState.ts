// The Artifacts route's loader: the state to show, `?state=` in development,
// read through the data source (`?source=`, lib/dataSource.ts). With no
// `?state=` it is the page's home (home.ts), laid out for the window. In
// development the home reads the live library unless `?source=fixtures`
// names the sample data, as the Workspaces home does (d-117); a `?state=`
// reads its fixture state. The router's `signal` ends a live read when the
// owner leaves the page.
import { notFound } from '@tanstack/react-router'
import { parseState } from '../../errors/parseState.ts'
import { type DataSourceOptions, readState } from '../../lib/dataSource.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { artifactsHome } from './home.ts'
import { artifactsStates } from './states/index.ts'
import { ArtifactsState, type ArtifactsData, type ArtifactsUi } from './types.ts'

/** The page built live, and its home reads live in development. */
const artifactsSources = { built: ['live'], default: 'live' } as const satisfies DataSourceOptions

export function loadArtifactsState(
  requested: string | undefined,
  source: string | undefined,
  signal?: AbortSignal,
): ScreenState<ArtifactsData, ArtifactsUi> | Promise<ScreenState<ArtifactsData, ArtifactsUi>> {
  const read = readState<ScreenState<ArtifactsData, ArtifactsUi>>(
    artifactsStates,
    { state: requested, source },
    { key: 'home', state: artifactsHome },
    artifactsSources,
  )
  if (!read.ok) throw notFound({ data: read.error })
  const name = `artifacts/${read.value.key}`
  // The live source puts the server's library on the state first, so the page schema checks what shows.
  if (import.meta.env.DEV && read.value.live)
    return import('./liveArtifacts.ts')
      .then((live) => live.withLiveArtifacts(read.value.state, { signal }))
      .then((merged) => parseState(ArtifactsState, merged, `${name} (live)`))
  return parseState(ArtifactsState, read.value.state, name)
}
