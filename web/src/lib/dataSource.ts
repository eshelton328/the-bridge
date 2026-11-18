// The data source layer: where a page loader gets its state. `fixtures`
// reads the page's state files and is the default; `mock-api` and `live`
// are not built yet, so a loader turns their miss into the not-built
// screen (errors/NotFound.tsx). In development `?source=` and `?state=`
// pick the source and the state; with no `?state=`, and always in a
// production build, a loader reads the page's home.
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'

const dataSourceKinds = ['fixtures', 'mock-api', 'live'] as const

/**
 * The `?source=` search param of every page. The router parses a value such
 * as `123` into a number, so it is coerced to a string here; `readState`
 * then turns any value it does not know into the unknown-source miss, and
 * ignores it in a production build.
 */
export const dataSourceParam = z.coerce.string().optional()

type DataSourceKind = (typeof dataSourceKinds)[number]

/** Why a source has no state. A loader throws it as `notFound({ data })`. */
export type DataSourceMiss =
  | { readonly reason: 'notBuilt'; readonly source: DataSourceKind }
  | { readonly reason: 'unknownSource'; readonly source: string }
  | { readonly reason: 'unknownState'; readonly state: string }

export type DataSourceRequest = {
  /** `?state=`: a state file's key; the page's home when not set. */
  readonly state: string | undefined
  /** `?source=`: one of `dataSourceKinds`; `fixtures` when not set. */
  readonly source: string | undefined
}

const isKind = (value: string): value is DataSourceKind => dataSourceKinds.some((kind) => kind === value)

/** A miss that the not-found screen shows as "not built yet". */
export function isNotBuilt(data: unknown): data is Extract<DataSourceMiss, { reason: 'notBuilt' }> {
  return typeof data === 'object' && data !== null && 'reason' in data && data.reason === 'notBuilt'
}

/** A page's home: what it shows with no `?state=`, as a state file's key or a state of its own. */
export type PageHome<S> = string | { readonly key: string; readonly state: S }

/**
 * One state of a page from the source the request names. With no
 * `?state=` (and always in a production build) it is the page's `home`:
 * a state of its own with every overlay closed, or a state file's key,
 * the first one when not set. An unknown source or state is a miss that
 * shows as "Page not found", as an unknown `?state=` always has.
 */
export function readState<S>(
  states: Readonly<Record<string, S>>,
  request: DataSourceRequest,
  home: PageHome<S> | undefined = Object.keys(states)[0],
): Result<{ key: string; state: S }, DataSourceMiss> {
  const dev = import.meta.env.DEV
  const source = dev && request.source !== undefined ? request.source : 'fixtures'
  if (!isKind(source)) return err({ reason: 'unknownSource', source })
  if (source !== 'fixtures') return err({ reason: 'notBuilt', source })
  const requested = dev ? request.state : undefined
  if (requested === undefined && typeof home === 'object') return ok({ key: home.key, state: home.state })
  const key = requested ?? (typeof home === 'string' ? home : undefined)
  const state = key !== undefined && Object.hasOwn(states, key) ? states[key] : undefined
  return key === undefined || state === undefined
    ? err({ reason: 'unknownState', state: key ?? '' })
    : ok({ key, state })
}
