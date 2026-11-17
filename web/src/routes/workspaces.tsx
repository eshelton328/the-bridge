// /workspaces: the Workspaces page. A thin route; everything comes from pages/workspaces.
import { createFileRoute } from '@tanstack/react-router'
import { WorkspacesPage, workspacesSearch, loadWorkspacesState } from '../pages/workspaces/index.ts'

export const Route = createFileRoute('/workspaces')({
  validateSearch: workspacesSearch,
  loaderDeps: ({ search }) => ({ state: search.state }),
  loader: ({ deps }) => loadWorkspacesState(deps.state),
  component: WorkspacesPage,
})
