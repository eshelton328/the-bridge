// The Artifacts route's loader: the state to show, `?state=` in development,
// read through the data source (`?source=`, lib/dataSource.ts). With no
// `?state=` it is the page's home (home.ts), laid out for the window.
import { notFound } from '@tanstack/react-router'
import { parseState } from '../../errors/parseState.ts'
import { readState } from '../../lib/dataSource.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { artifactsHome } from './home.ts'
import { artifactsStates } from './states/index.ts'
import { ArtifactsState, type ArtifactsData, type ArtifactsUi } from './types.ts'

export function loadArtifactsState(
  requested: string | undefined,
  source: string | undefined,
): ScreenState<ArtifactsData, ArtifactsUi> {
  const read = readState(artifactsStates, { state: requested, source }, { key: 'home', state: artifactsHome })
  if (!read.ok) throw notFound({ data: read.error })
  return parseState(ArtifactsState, read.value.state, `artifacts/${read.value.key}`)
}
