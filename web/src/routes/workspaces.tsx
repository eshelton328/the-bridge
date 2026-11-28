// /workspaces: the Workspaces page. A thin route; everything comes from pages/workspaces. It has no pendingComponent:
// the page draws its loading layout in its own tree while a slow live read runs (loadWorkspacesRoute, NCC-181).
import { createFileRoute } from '@tanstack/react-router'
import { WorkspacesPage, workspacesSearch, loadWorkspacesRoute } from '../pages/workspaces/index.ts'

export const Route = createFileRoute('/workspaces')({
  validateSearch: workspacesSearch,
  loaderDeps: ({ search }) => ({ state: search.state, source: search.source }),
  loader: ({ deps, abortController }) => loadWorkspacesRoute(deps.state, deps.source, abortController.signal),
  component: WorkspacesPage,
})
