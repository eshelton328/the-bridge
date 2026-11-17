// The Workspaces route's loader: the state to show, `?state=` in development.
import { notFound } from '@tanstack/react-router'
import { parseState } from '../../errors/parseState.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { workspacesStates } from './states/index.ts'
import { WorkspacesState, type WorkspacesData, type WorkspacesUi } from './types.ts'

type WorkspacesStateKey = keyof typeof workspacesStates

const isWorkspacesStateKey = (key: string): key is WorkspacesStateKey => Object.hasOwn(workspacesStates, key)

export function loadWorkspacesState(requested: string | undefined): ScreenState<WorkspacesData, WorkspacesUi> {
  const key = import.meta.env.DEV && requested !== undefined ? requested : Object.keys(workspacesStates)[0]
  if (key === undefined || !isWorkspacesStateKey(key)) throw notFound()
  return parseState(WorkspacesState, workspacesStates[key], `workspaces/${key}`)
}
