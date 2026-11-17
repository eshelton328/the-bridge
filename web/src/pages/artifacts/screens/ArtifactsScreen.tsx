// ArtifactsScreen: props only. Data comes in as props; changes go out through callbacks.
import type { Viewport } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'

export type ArtifactsScreenProps = {
  data: ArtifactsData
  ui: ArtifactsUi
  viewport: Viewport
}

export function ArtifactsScreen({ data, viewport }: ArtifactsScreenProps) {
  return (
    <section data-viewport={viewport}>
      <h1>{data.title}</h1>
    </section>
  )
}
