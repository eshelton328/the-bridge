// The Inbox as the canvas and the state checks see it: its states, their
// schema, and how one state renders as the props-only screen.
import { createElement } from 'react'
import type { PageDefinition } from '../../lib/screenState.ts'
import { InboxScreen } from './screens/InboxScreen.tsx'
import { inboxStates } from './states/index.ts'
import { InboxState, type InboxData, type InboxUi } from './types.ts'

export const inboxPage = {
  id: 'inbox',
  title: 'Inbox',
  schema: InboxState,
  states: inboxStates,
  render: (state, viewport) => createElement(InboxScreen, { data: state.data, ui: state.ui, viewport }),
} satisfies PageDefinition<InboxData, InboxUi, keyof typeof inboxStates>
