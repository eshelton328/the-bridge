// /inbox: the Inbox page. A thin route: search params, the loader and the
// page entry all come from pages/inbox.
import { createFileRoute } from '@tanstack/react-router'
import { InboxPage, inboxSearch, loadInboxState } from '../pages/inbox/index.ts'

export const Route = createFileRoute('/inbox')({
  validateSearch: inboxSearch,
  loaderDeps: ({ search }) => ({ state: search.state }),
  loader: ({ deps }) => loadInboxState(deps.state),
  component: InboxPage,
})
