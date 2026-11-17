// Figma Toolkit T2 "T2 · Map": the D2 map on the iPad mini, with writer
// selected. The items, their columns and rows and the links are D2's
// (toolkitMap); the tablet differs in its data in two places: the first
// column's heading is "Rules, hooks" (428:349), and writing shows no
// "every session" (428:402). Copy word for word from
// references/toolkit/T02/frame.json.
// Figma Toolkit M11 "M11 · Map" shows the same data on the phone
// (references/toolkit/M11/frame.json): the same items, rows, links and
// headings in a 366 × 500 map window, with writer's card under it.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitMapView, ToolkitUi } from '../types.ts'
import { toolkitMap } from './toolkitMap.ts'

const map: ToolkitMapView = toolkitMap.data.map

export const toolkitMapTablet = {
  title: 'the map on a tablet, with writer selected in the bar at its foot',
  frames: [
    { id: 'T2', node: '424:3909', viewport: 'tablet' },
    { id: 'M11', node: '461:683', viewport: 'phone' },
  ],
  data: {
    ...toolkitMap.data,
    map: {
      ...map,
      columns: ['Rules, hooks', 'Skills', 'Agents', 'Workflows'],
      nodes: map.nodes.map(({ path, name, kind, column, row }) => ({ path, name, kind, column, row })),
    },
  },
  ui: { ...toolkitMap.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
