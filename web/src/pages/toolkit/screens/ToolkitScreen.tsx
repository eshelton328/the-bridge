// ToolkitScreen: props only. Data comes in as props; changes go out through callbacks.
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'

export type ToolkitScreenProps = {
  data: ToolkitData
  ui: ToolkitUi
  viewport: Viewport
}

export function ToolkitScreen({ data, viewport }: ToolkitScreenProps) {
  return (
    <section data-viewport={viewport}>
      <h1>{data.title}</h1>
    </section>
  )
}
