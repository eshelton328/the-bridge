// Checks a state file against its page schema in development and tests,
// and throws FixtureError with Zod's report when it does not match, so the
// boundary names the wrong field. Production and canvas builds skip the
// parse: the types already hold, and the tests parse every state.
import type { z } from 'zod'
import { checkState, type ScreenState } from '../lib/screenState.ts'
import { FixtureError } from './appError.ts'

export function parseState<Data, Ui>(
  schema: z.ZodType<{ data: Data; ui: Ui }>,
  state: ScreenState<Data, Ui>,
  name: string,
): ScreenState<Data, Ui> {
  if (!import.meta.env.DEV && import.meta.env.MODE !== 'test') return state
  const result = checkState(schema, state)
  if (!result.ok) throw new FixtureError(name, result.error)
  return { ...state, data: result.value.data, ui: result.value.ui }
}
