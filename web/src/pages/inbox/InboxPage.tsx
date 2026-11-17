// The Inbox's connected entry: the only component of the page that reads
// the router and the page store. It merges the loaded state with the URL
// and the store and passes everything to the props-only screen.
import { getRouteApi } from '@tanstack/react-router'
import { useEffect } from 'react'
import {
  useInboxActions,
  useInboxGroupsOpen,
  useInboxItemOpen,
  useInboxPromptOpen,
  useInboxQuery,
  useInboxRemoveOpen,
  useInboxUi,
} from './inboxStore.ts'
import { InboxScreen } from './screens/InboxScreen.tsx'

const route = getRouteApi('/inbox')

export function InboxPage() {
  const state = route.useLoaderData()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const groupsOpen = useInboxGroupsOpen()
  const itemOpen = useInboxItemOpen(search.state)
  const promptOpen = useInboxPromptOpen(search.state)
  const removeOpen = useInboxRemoveOpen(search.state)
  const query = useInboxQuery(search.state)
  const changed = useInboxUi(search.state)
  const { setGroupOpen, setItemOpen, setPromptOpen, setRemoveOpen, setQuery, setUi, showState } = useInboxActions()
  useEffect(() => {
    showState(search.state)
  }, [showState, search.state])
  const ui = {
    ...state.ui,
    ...changed,
    filter: search.filter ?? state.ui.filter,
    groupsOpen: { ...state.ui.groupsOpen, ...groupsOpen },
    // Back on a tablet or phone closes the open item and shows the list; the desktop always shows the item.
    selectedId: itemOpen === false ? null : state.ui.selectedId,
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
      onBack={() => {
        setItemOpen(search.state, false)
      }}
      onPromptOpenChange={(open) => {
        setPromptOpen(search.state, open)
      }}
      onRemoveOpenChange={(open) => {
        setRemoveOpen(search.state, open)
      }}
      onQueryChange={(next) => {
        setQuery(search.state, next)
      }}
      onUiChange={(change) => {
        setUi(search.state, change)
      }}
      onFilterChange={(filter) => {
        void navigate({ search: (prev) => ({ ...prev, filter }) })
      }}
    />
  )
}
