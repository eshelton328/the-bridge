// The {{Title}} page as the canvas and the state checks see it.
import { createElement } from 'react'
import type { PageDefinition } from '../../lib/screenState.ts'
import { {{Page}}Screen } from './screens/{{Page}}Screen.tsx'
import { {{page}}States } from './states/index.ts'
import { {{Page}}State, type {{Page}}Data, type {{Page}}Ui } from './types.ts'

export const {{page}}Page = {
  id: '{{page}}',
  title: '{{Title}}',
  schema: {{Page}}State,
  states: {{page}}States,
  render: (state, viewport) => createElement({{Page}}Screen, { data: state.data, ui: state.ui, viewport }),
} satisfies PageDefinition<{{Page}}Data, {{Page}}Ui, keyof typeof {{page}}States>
