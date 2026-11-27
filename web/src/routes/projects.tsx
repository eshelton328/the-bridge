// /projects: the Projects page. A thin route; everything comes from pages/projects.
import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage, projectsSearch, loadProjectsState } from '../pages/projects/index.ts'

export const Route = createFileRoute('/projects')({
  validateSearch: projectsSearch,
  loaderDeps: ({ search }) => ({ state: search.state, source: search.source }),
  loader: ({ deps, abortController }) => loadProjectsState(deps.state, deps.source, abortController.signal),
  component: ProjectsPage,
})
