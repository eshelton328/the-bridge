// Checks a state against its page schema in development, tests and a
// served build (d-134), and throws FixtureError with Zod's report when it
// does not match, so the boundary names the wrong field. A loader passes
// the state merged with the live server's data here, so every build that
// reads the server checks what shows. Other production and canvas builds
// read only fixtures and skip the parse: the types already hold, and the
// tests parse every state.
import type { z } from 'zod'
import { readsLiveServer } from '../lib/dataSource.ts'
import { checkState, type ScreenState } from '../lib/screenState.ts'
import { FixtureError } from './appError.ts'

export function parseState<Data, Ui>(
  schema: z.ZodType<{ data: Data; ui: Ui }>,
  state: ScreenState<Data, Ui>,
  name: string,
): ScreenState<Data, Ui> {
  if (!readsLiveServer() && import.meta.env.MODE !== 'test') return state
  const result = checkState(schema, state)
  if (!result.ok) throw new FixtureError(name, result.error)
  return { ...state, data: result.value.data, ui: result.value.ui }
}
