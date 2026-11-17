// The Toolkit page as the canvas and the state checks see it.
import { createElement } from 'react'
import type { PageDefinition } from '../../lib/screenState.ts'
import { ToolkitScreen } from './screens/ToolkitScreen.tsx'
import { toolkitStates } from './states/index.ts'
import { ToolkitState, type ToolkitData, type ToolkitUi } from './types.ts'

export const toolkitPage = {
  id: 'toolkit',
  title: 'Toolkit',
  schema: ToolkitState,
  states: toolkitStates,
  render: (state, viewport) => createElement(ToolkitScreen, { data: state.data, ui: state.ui, viewport }),
} satisfies PageDefinition<ToolkitData, ToolkitUi, keyof typeof toolkitStates>
