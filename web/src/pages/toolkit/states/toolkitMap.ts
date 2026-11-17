// Figma Toolkit D2 "D2 · Map": the map of the toolkit (R36), one column for
// each kind and a line where one file links to another. writer (the skill)
// is selected: its 11 lines light up, the items it does not touch go dim,
// and its card shows at the bottom right. Copy word for word from
// references/toolkit/D02/frame.json; each node's column and row and each
// link (`link · <from> → <to>`, with its end dot at `to`) come from the
// frame's layers. It starts from the T1 list (toolkitListTablet), which has
// the Rules items, so the selection card finds writer's description and
// counts there.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { toolkitListTablet } from './toolkitListTablet.ts'

export const toolkitMap = {
  title: 'the map, with writer selected and its links lit',
  frames: [{ id: 'D2', node: '424:1166', viewport: 'desktop' }],
  // The map itself is in every state's data, from toolkitList.
  data: { ...toolkitListTablet.data },
  ui: { ...toolkitListTablet.ui, view: 'map', mapSelected: 'skills/writer/' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
