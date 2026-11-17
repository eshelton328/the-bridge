// The Inbox's connected entry: the only component of the page that reads
// the router and the page store. It merges the loaded state with the URL
// and the store and passes everything to the props-only screen.
import { getRouteApi } from '@tanstack/react-router'
import { useEffect } from 'react'
import {
  useInboxActions,
  useInboxGroupsOpen,
  useInboxPromptOpen,
  useInboxQuery,
  useInboxRemoveOpen,
} from './inboxStore.ts'
import { InboxScreen } from './screens/InboxScreen.tsx'

const route = getRouteApi('/inbox')

export function InboxPage() {
  const state = route.useLoaderData()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const groupsOpen = useInboxGroupsOpen()
  const promptOpen = useInboxPromptOpen(search.state)
  const removeOpen = useInboxRemoveOpen(search.state)
  const query = useInboxQuery(search.state)
  const { setGroupOpen, setPromptOpen, setRemoveOpen, setQuery, showState } = useInboxActions()
  useEffect(() => {
    showState(search.state)
  }, [showState, search.state])
  const ui = {
    ...state.ui,
    filter: search.filter ?? state.ui.filter,
    groupsOpen: { ...state.ui.groupsOpen, ...groupsOpen },
    promptOpen: promptOpen ?? state.ui.promptOpen,
    removeOpen: removeOpen ?? state.ui.removeOpen,
  }
  return (
    <InboxScreen
      data={state.data}
      ui={ui}
      viewport="desktop"
      query={query}
      onGroupOpenChange={setGroupOpen}
      onPromptOpenChange={(open) => {
        setPromptOpen(search.state, open)
      }}
      onRemoveOpenChange={(open) => {
        setRemoveOpen(search.state, open)
      }}
      onQueryChange={(next) => {
        setQuery(search.state, next)
      }}
      onFilterChange={(filter) => {
        void navigate({ search: (prev) => ({ ...prev, filter }) })
      }}
    />
  )
}
