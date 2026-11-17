// {{Name}}: props only. Data comes in as props; changes go out through callbacks.
import type { Viewport } from '{{up}}lib/screenState.ts'
import type { {{Page}}Data, {{Page}}Ui } from '../types.ts'

export type {{Name}}Props = {
  data: {{Page}}Data
  ui: {{Page}}Ui
  viewport: Viewport
}

export function {{Name}}({ viewport }: {{Name}}Props) {
  return <section data-viewport={viewport}>TODO: build {{Name}} from its Figma frame</section>
}
