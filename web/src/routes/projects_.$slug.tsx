// /projects/<slug>: a project's page (R4). A thin route; everything comes from pages/projects.
import { createFileRoute } from '@tanstack/react-router'
import { ProjectPage, loadProjectState, projectsSearch } from '../pages/projects/index.ts'

export const Route = createFileRoute('/projects_/$slug')({
  validateSearch: projectsSearch,
  loaderDeps: ({ search }) => ({ state: search.state, source: search.source }),
  loader: ({ params, deps, abortController }) =>
    loadProjectState(params.slug, deps.state, deps.source, abortController.signal),
  component: ProjectPage,
})
