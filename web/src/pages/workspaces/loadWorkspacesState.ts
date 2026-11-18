// The Workspaces route's loader: the state to show, `?state=` in development,
// read through the data source (`?source=`, lib/dataSource.ts).
import { notFound } from '@tanstack/react-router'
import { parseState } from '../../errors/parseState.ts'
import { readState } from '../../lib/dataSource.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { workspacesStates } from './states/index.ts'
import { WorkspacesState, type WorkspacesData, type WorkspacesUi } from './types.ts'

export function loadWorkspacesState(
  requested: string | undefined,
  source: string | undefined,
): ScreenState<WorkspacesData, WorkspacesUi> {
  const read = readState(workspacesStates, { state: requested, source })
  if (!read.ok) throw notFound({ data: read.error })
  return parseState(WorkspacesState, read.value.state, `workspaces/${read.value.key}`)
}
