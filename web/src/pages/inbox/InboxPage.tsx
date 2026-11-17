// The Inbox's connected entry: the only component of the page that reads
// the router and the page store. It merges the loaded state with the URL
// and the store and passes everything to the props-only screen.
import { getRouteApi } from '@tanstack/react-router'
import { useInboxActions, useInboxGroupsOpen } from './inboxStore.ts'
import { InboxScreen } from './screens/InboxScreen.tsx'

const route = getRouteApi('/inbox')

export function InboxPage() {
  const state = route.useLoaderData()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const groupsOpen = useInboxGroupsOpen()
  const { setGroupOpen } = useInboxActions()
  const ui = {
    ...state.ui,
    filter: search.filter ?? state.ui.filter,
    groupsOpen: { ...state.ui.groupsOpen, ...groupsOpen },
  }
  return (
    <InboxScreen
      data={state.data}
      ui={ui}
      viewport="desktop"
      onGroupOpenChange={setGroupOpen}
      onFilterChange={(filter) => {
        void navigate({ search: (prev) => ({ ...prev, filter }) })
      }}
    />
  )
}
