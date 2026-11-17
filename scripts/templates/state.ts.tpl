// Figma {{Title}} {{frame}}: TODO the frame's name. Copy word for word from Figma.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { {{Page}}Data, {{Page}}Ui } from '../types.ts'

export const {{id}} = {
  title: 'TODO: what this state shows',
  frames: [{ id: '{{frame}}', node: 'TODO: Figma node id', viewport: 'desktop' }],
  data: {{data}},
  ui: {{ui}},
} satisfies ScreenState<{{Page}}Data, {{Page}}Ui>
