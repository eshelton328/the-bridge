// The Toolkit route's loader: the state to show, `?state=` in development,
// read through the data source (`?source=`, lib/dataSource.ts). With no
// `?state=` it is the page's home (home.ts), laid out for the window.
import { notFound } from '@tanstack/react-router'
import { parseState } from '../../errors/parseState.ts'
import { readState } from '../../lib/dataSource.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { toolkitHome } from './home.ts'
import { toolkitStates } from './states/index.ts'
import { ToolkitState, type ToolkitData, type ToolkitUi } from './types.ts'

export function loadToolkitState(
  requested: string | undefined,
  source: string | undefined,
): ScreenState<ToolkitData, ToolkitUi> {
  const read = readState(toolkitStates, { state: requested, source }, { key: 'home', state: toolkitHome })
  if (!read.ok) throw notFound({ data: read.error })
  return parseState(ToolkitState, read.value.state, `toolkit/${read.value.key}`)
}
