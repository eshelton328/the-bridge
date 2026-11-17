// The Artifacts route's loader: the state to show, `?state=` in development.
import { notFound } from '@tanstack/react-router'
import { parseState } from '../../errors/parseState.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { artifactsStates } from './states/index.ts'
import { ArtifactsState, type ArtifactsData, type ArtifactsUi } from './types.ts'

type ArtifactsStateKey = keyof typeof artifactsStates

const isArtifactsStateKey = (key: string): key is ArtifactsStateKey => Object.hasOwn(artifactsStates, key)

export function loadArtifactsState(requested: string | undefined): ScreenState<ArtifactsData, ArtifactsUi> {
  const key = import.meta.env.DEV && requested !== undefined ? requested : Object.keys(artifactsStates)[0]
  if (key === undefined || !isArtifactsStateKey(key)) throw notFound()
  return parseState(ArtifactsState, artifactsStates[key], `artifacts/${key}`)
}
