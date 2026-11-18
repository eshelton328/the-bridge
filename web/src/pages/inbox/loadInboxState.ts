// The Inbox route's loader: the state to show. Today it is a state file,
// `nextStep` unless `?state=` names another in development, read
// through the data source (`?source=`, lib/dataSource.ts); later this
// file maps the API into the view model and nothing below it changes.
import { notFound } from '@tanstack/react-router'
import { parseState } from '../../errors/parseState.ts'
import { readState } from '../../lib/dataSource.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { inboxStates } from './states/index.ts'
import { InboxState, type InboxData, type InboxUi } from './types.ts'

export function loadInboxState(
  requested: string | undefined,
  source: string | undefined,
): ScreenState<InboxData, InboxUi> {
  const read = readState(inboxStates, { state: requested, source }, 'nextStep')
  if (!read.ok) throw notFound({ data: read.error })
  return parseState(InboxState, read.value.state, `inbox/${read.value.key}`)
}
