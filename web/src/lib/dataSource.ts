// The data source layer: where a page loader gets its state. `fixtures`
// reads the page's state files and is the default; `mock-api` and `live`
// are not built yet, so a loader turns their miss into the not-built
// screen (errors/NotFound.tsx). In development `?source=` and `?state=`
// pick the source and the state; a production build always reads the
// fixtures' default state.
import { err, ok, type Result } from '@bridge/shared'

const dataSourceKinds = ['fixtures', 'mock-api', 'live'] as const

type DataSourceKind = (typeof dataSourceKinds)[number]

/** Why a source has no state. A loader throws it as `notFound({ data })`. */
export type DataSourceMiss =
  | { readonly reason: 'notBuilt'; readonly source: DataSourceKind }
  | { readonly reason: 'unknownSource'; readonly source: string }
  | { readonly reason: 'unknownState'; readonly state: string }

export type DataSourceRequest = {
  /** `?state=`: a state file's key; the first state when not set. */
  readonly state: string | undefined
  /** `?source=`: one of `dataSourceKinds`; `fixtures` when not set. */
  readonly source: string | undefined
}

const isKind = (value: string): value is DataSourceKind => dataSourceKinds.some((kind) => kind === value)

/** A miss that the not-found screen shows as "not built yet". */
export function isNotBuilt(data: unknown): data is Extract<DataSourceMiss, { reason: 'notBuilt' }> {
  return typeof data === 'object' && data !== null && 'reason' in data && data.reason === 'notBuilt'
}

/**
 * One state of a page from the source the request names. An unknown
 * source or state is a miss that shows as "Page not found", as an
 * unknown `?state=` always has.
 */
export function readState<S>(
  states: Readonly<Record<string, S>>,
  request: DataSourceRequest,
  fallback: string | undefined = Object.keys(states)[0],
): Result<{ key: string; state: S }, DataSourceMiss> {
  const dev = import.meta.env.DEV
  const source = dev && request.source !== undefined ? request.source : 'fixtures'
  if (!isKind(source)) return err({ reason: 'unknownSource', source })
  if (source !== 'fixtures') return err({ reason: 'notBuilt', source })
  const key = dev && request.state !== undefined ? request.state : fallback
  const state = key !== undefined && Object.hasOwn(states, key) ? states[key] : undefined
  return key === undefined || state === undefined
    ? err({ reason: 'unknownState', state: key ?? '' })
    : ok({ key, state })
}
