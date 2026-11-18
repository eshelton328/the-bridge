// /workspaces: the Workspaces page. A thin route; everything comes from pages/workspaces.
import { createFileRoute } from '@tanstack/react-router'
import { WorkspacesPage, workspacesSearch, loadWorkspacesState } from '../pages/workspaces/index.ts'

export const Route = createFileRoute('/workspaces')({
  validateSearch: workspacesSearch,
  loaderDeps: ({ search }) => ({ state: search.state, source: search.source }),
  loader: ({ deps }) => loadWorkspacesState(deps.state, deps.source),
  component: WorkspacesPage,
})
