// /artifacts: the Artifacts page. A thin route; everything comes from pages/artifacts.
import { createFileRoute } from '@tanstack/react-router'
import { ArtifactsPage, artifactsSearch, loadArtifactsState } from '../pages/artifacts/index.ts'

export const Route = createFileRoute('/artifacts')({
  validateSearch: artifactsSearch,
  loaderDeps: ({ search }) => ({ state: search.state, source: search.source }),
  loader: ({ deps }) => loadArtifactsState(deps.state, deps.source),
  component: ArtifactsPage,
})
