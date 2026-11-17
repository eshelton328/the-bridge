// WorkspacesScreen: props only. Data comes in as props; changes go out through callbacks.
import type { Viewport } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'

export type WorkspacesScreenProps = {
  data: WorkspacesData
  ui: WorkspacesUi
  viewport: Viewport
}

export function WorkspacesScreen({ data, viewport }: WorkspacesScreenProps) {
  return (
    <section data-viewport={viewport}>
      <h1>{data.title}</h1>
    </section>
  )
}
