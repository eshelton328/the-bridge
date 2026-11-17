// The Toolkit route's loader: the state to show, `?state=` in development.
import { notFound } from '@tanstack/react-router'
import { parseState } from '../../errors/parseState.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { toolkitStates } from './states/index.ts'
import { ToolkitState, type ToolkitData, type ToolkitUi } from './types.ts'

type ToolkitStateKey = keyof typeof toolkitStates

const isToolkitStateKey = (key: string): key is ToolkitStateKey => Object.hasOwn(toolkitStates, key)

export function loadToolkitState(requested: string | undefined): ScreenState<ToolkitData, ToolkitUi> {
  const key = import.meta.env.DEV && requested !== undefined ? requested : Object.keys(toolkitStates)[0]
  if (key === undefined || !isToolkitStateKey(key)) throw notFound()
  return parseState(ToolkitState, toolkitStates[key], `toolkit/${key}`)
}
