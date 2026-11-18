// /inbox: the Inbox page. A thin route: search params, the loader and the
// page entry all come from pages/inbox.
import { createFileRoute } from '@tanstack/react-router'
import { InboxPage, inboxSearch, loadInboxState } from '../pages/inbox/index.ts'

export const Route = createFileRoute('/inbox')({
  validateSearch: inboxSearch,
  loaderDeps: ({ search }) => ({ state: search.state, source: search.source }),
  loader: ({ deps }) => loadInboxState(deps.state, deps.source),
  component: InboxPage,
})
