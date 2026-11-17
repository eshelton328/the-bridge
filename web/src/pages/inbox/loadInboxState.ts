// The Inbox route's loader: the state to show. Today it is a state file,
// `nextStep` unless `?state=` names another in development; later this
// file maps the API into the view model and nothing below it changes.
import { notFound } from '@tanstack/react-router'
import { parseState } from '../../errors/parseState.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import { inboxStates } from './states/index.ts'
import { InboxState, type InboxData, type InboxUi } from './types.ts'

type InboxStateKey = keyof typeof inboxStates

const isInboxStateKey = (key: string): key is InboxStateKey => Object.hasOwn(inboxStates, key)

export function loadInboxState(requested: string | undefined): ScreenState<InboxData, InboxUi> {
  const key = import.meta.env.DEV && requested !== undefined ? requested : 'nextStep'
  if (!isInboxStateKey(key)) throw notFound()
  return parseState(InboxState, inboxStates[key], `inbox/${key}`)
}
