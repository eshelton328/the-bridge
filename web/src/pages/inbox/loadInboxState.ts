// The Inbox route's loader: the state to show, `?state=` in development,
// read through the data source (`?source=`, lib/dataSource.ts). With no
// `?state=` it is the page's home (home.ts), laid out for the window. In
// development the home reads the live Inbox unless `?source=fixtures` names
// the sample data, as the Workspaces and Artifacts homes do (d-117); a
// `?state=` reads its fixture state. The router's `signal` ends a live read
// when the owner leaves the page.
import { notFound } from '@tanstack/react-router'
import { parseState } from '../../errors/parseState.ts'
import { type DataSourceOptions, readsLiveServer, readState } from '../../lib/dataSource.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { inboxHome } from './home.ts'
import { inboxStates } from './states/index.ts'
import { InboxState, type InboxData, type InboxUi } from './types.ts'

/** The page built live, and its home reads live in development. */
export const inboxSources = { built: ['live'], default: 'live' } as const satisfies DataSourceOptions

export function loadInboxState(
  requested: string | undefined,
  source: string | undefined,
  signal?: AbortSignal,
): ScreenState<InboxData, InboxUi> | Promise<ScreenState<InboxData, InboxUi>> {
  const read = readState<ScreenState<InboxData, InboxUi>>(
    inboxStates,
    { state: requested, source },
    { key: 'home', state: inboxHome },
    inboxSources,
  )
  if (!read.ok) throw notFound({ data: read.error })
  const name = `inbox/${read.value.key}`
  // The live source puts the server's items on the state first, so the page schema checks what shows.
  if (readsLiveServer() && read.value.live)
    return import('./liveInbox.ts')
      .then((live) => live.withLiveInbox(read.value.state, { signal }))
      .then((merged) => parseState(InboxState, merged, `${name} (live)`))
  return parseState(InboxState, read.value.state, name)
}
