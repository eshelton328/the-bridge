// /workspaces: the Workspaces page. A thin route; everything comes from pages/workspaces.
import { createFileRoute } from '@tanstack/react-router'
import { WorkspacesPage, WorkspacesPending, workspacesSearch, loadWorkspacesState } from '../pages/workspaces/index.ts'

export const Route = createFileRoute('/workspaces')({
  validateSearch: workspacesSearch,
  loaderDeps: ({ search }) => ({ state: search.state, source: search.source }),
  loader: ({ deps, abortController }) => loadWorkspacesState(deps.state, deps.source, abortController.signal),
  component: WorkspacesPage,
  pendingComponent: WorkspacesPending,
})
