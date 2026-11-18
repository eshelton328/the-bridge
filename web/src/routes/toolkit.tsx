// /toolkit: the Toolkit page. A thin route; everything comes from pages/toolkit.
import { createFileRoute } from '@tanstack/react-router'
import { ToolkitPage, toolkitSearch, loadToolkitState } from '../pages/toolkit/index.ts'

export const Route = createFileRoute('/toolkit')({
  validateSearch: toolkitSearch,
  loaderDeps: ({ search }) => ({ state: search.state, source: search.source }),
  loader: ({ deps }) => loadToolkitState(deps.state, deps.source),
  component: ToolkitPage,
})
