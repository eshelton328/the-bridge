// /inbox: the Inbox page. A thin route: search params, the loader and the
// page entry all come from pages/inbox.
import { createFileRoute } from '@tanstack/react-router'
import { InboxPage, InboxPending, inboxSearch, loadInboxState } from '../pages/inbox/index.ts'

export const Route = createFileRoute('/inbox')({
  validateSearch: inboxSearch,
  loaderDeps: ({ search }) => ({ state: search.state, source: search.source }),
  loader: ({ deps, abortController }) => loadInboxState(deps.state, deps.source, abortController.signal),
  component: InboxPage,
  pendingComponent: InboxPending,
})
