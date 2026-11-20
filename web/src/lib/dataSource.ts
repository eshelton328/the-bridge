// The data source layer: where a page loader gets its state. `fixtures`
// reads the page's state files and is the default. A page that has built
// `live` names it in `built`; for every other page, and for `mock-api`,
// the source is not built yet, so a loader turns its miss into the
// not-built screen (errors/NotFound.tsx). In development `?source=` and `?state=`
// pick the source and the state; with no `?state=`, and always in a
// production build, a loader reads the page's home. A page can name its own
// `default` source for its home in development (d-117: live on Workspaces);
// a `?state=` still reads its fixture state, so the stories and the
// fidelity checks do not change.
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

/**
 * What a page built besides its fixtures, such as `{ built: ['live'] }`, and the source its home reads in
 * development when the URL names none, such as `default: 'live'` for the Workspaces page (d-117); `fixtures` when not
 * set.
 */
export type DataSourceOptions = {
  readonly built?: readonly Exclude<DataSourceKind, 'fixtures'>[]
  readonly default?: Exclude<DataSourceKind, 'fixtures'>
}

const NotBuiltMiss = z.object({ reason: z.literal('notBuilt'), source: z.enum(dataSourceKinds) }).readonly()

/**
 * Why a source has no state. A loader throws it as `notFound({ data })`, and the not-found screen parses it back
 * (`isNotBuilt`), so the schema is the one source of the type.
 */
const DataSourceMiss = z.discriminatedUnion('reason', [
  NotBuiltMiss,
  z.object({ reason: z.literal('unknownSource'), source: z.string() }).readonly(),
  z.object({ reason: z.literal('unknownState'), state: z.string() }).readonly(),
])
export type DataSourceMiss = z.infer<typeof DataSourceMiss>

export type DataSourceRequest = {
  /** `?state=`: a state file's key; the page's home when not set. */
  readonly state: string | undefined
  /** `?source=`: one of `dataSourceKinds`; when not set, the page's `default` with no `?state=`, else `fixtures`. */
  readonly source: string | undefined
}

const isKind = (value: string): value is DataSourceKind => dataSourceKinds.some((kind) => kind === value)

/**
 * A miss that the not-found screen shows as "not built yet": `notFound()`'s data, parsed, so a `notBuilt` reason
 * with no source or an unknown one is not one (audit W-8).
 */
export function isNotBuilt(data: unknown): data is z.infer<typeof NotBuiltMiss> {
  const miss = DataSourceMiss.safeParse(data)
  return miss.success && miss.data.reason === 'notBuilt'
}

/** A page's home: what it shows with no `?state=`, as a state file's key or a state of its own. */
export type PageHome<S> = string | { readonly key: string; readonly state: S }

/**
 * Whether this build can read the live server: a development build. A production build reads every page from its
 * fixtures until the server ships with the build (d-117), so it reads no server and sends it nothing, not even an
 * error report (errors/clientErrorSender.ts).
 */
export const readsLiveServer = (): boolean => import.meta.env.DEV

/**
 * The source a request reads: `fixtures` in a production build; in development the one `?source=` names, else the
 * page's `default` when no `?state=` is named, else `fixtures`. A value that is not a source comes back as it is.
 */
function requestedSource(request: DataSourceRequest, options: DataSourceOptions = {}): string {
  if (!readsLiveServer()) return 'fixtures'
  if (request.source !== undefined) return request.source
  return request.state === undefined ? (options.default ?? 'fixtures') : 'fixtures'
}

/** The request reads the live source of a page that built it, as `readState` gives `live: true` for it. */
export const readsLive = (request: DataSourceRequest, options: DataSourceOptions = {}): boolean =>
  requestedSource(request, options) === 'live' && (options.built ?? []).includes('live')

/**
 * One state of a page from the source the request names. With no
 * `?state=` (and always in a production build) it is the page's `home`:
 * a state of its own with every overlay closed, or a state file's key,
 * the first one when not set. An unknown source or state is a miss that
 * shows as "Page not found", as an unknown `?state=` always has. A source
 * the page built (`options.built`) reads the same state with `live: true`:
 * the loader then puts the source's data on it. With no `?source=` and no `?state=`, the page's `default` source
 * reads its home (`requestedSource`).
 */
export function readState<S>(
  states: Readonly<Record<string, S>>,
  request: DataSourceRequest,
  home: PageHome<S> | undefined = Object.keys(states)[0],
  options: DataSourceOptions = {},
): Result<{ key: string; state: S; live?: true }, DataSourceMiss> {
  const dev = import.meta.env.DEV
  const source = requestedSource(request, options)
  if (!isKind(source)) return err({ reason: 'unknownSource', source })
  const live = readsLive(request, options)
  if (source !== 'fixtures' && !live) return err({ reason: 'notBuilt', source })
  const mark = live ? { live: true as const } : {}
  const requested = dev ? request.state : undefined
  if (requested === undefined && typeof home === 'object') return ok({ key: home.key, state: home.state, ...mark })
  const key = requested ?? (typeof home === 'string' ? home : undefined)
  const state = key !== undefined && Object.hasOwn(states, key) ? states[key] : undefined
  return key === undefined || state === undefined
    ? err({ reason: 'unknownState', state: key ?? '' })
    : ok({ key, state, ...mark })
}
