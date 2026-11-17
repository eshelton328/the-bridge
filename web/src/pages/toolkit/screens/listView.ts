// What the Toolkit list shows: the state's groups narrowed by the kind chip
// and the search, which matches an item's name, path and description,
// ignoring case. A group with no item left is not shown. `mapView` narrows
// the map the same way: the nodes of the chip's kind that match the search
// (by name or path), and the links between two shown nodes. Pure, so
// listView.test.ts checks both without rendering.
import type { ToolkitData, ToolkitGroupView, ToolkitItemView, ToolkitMapView, ToolkitUi } from '../types.ts'

export type ToolkitListView = {
  groups: ToolkitGroupView[]
  /**
   * The names that more than one shown item has, such as the skill and the
   * agent called writer. Figma names a card's layer after its item, so
   * those cards have no unique layer name.
   */
  sharedNames: ReadonlySet<string>
}

const matchesText = (texts: readonly string[], query: string) => {
  const q = query.trim().toLowerCase()
  if (q === '') return true
  return texts.some((text) => text.toLowerCase().includes(q))
}
const matches = (item: ToolkitItemView, query: string) => matchesText([item.name, item.path, item.description], query)

export function listView(data: ToolkitData, ui: Pick<ToolkitUi, 'filter' | 'query'>): ToolkitListView {
  const groups = data.groups
    .filter((g) => ui.filter === 'all' || g.kind === ui.filter)
    .map((g) => ({ ...g, items: g.items.filter((item) => matches(item, ui.query)) }))
    .filter((g) => g.items.length > 0)
  const seen = new Set<string>()
  const sharedNames = new Set<string>()
  for (const item of groups.flatMap((g) => g.items)) {
    if (seen.has(item.name)) sharedNames.add(item.name)
    seen.add(item.name)
  }
  return { groups, sharedNames }
}

export function mapView(map: ToolkitMapView, ui: Pick<ToolkitUi, 'filter' | 'query'>): ToolkitMapView {
  const nodes = map.nodes.filter(
    (node) => (ui.filter === 'all' || node.kind === ui.filter) && matchesText([node.name, node.path], ui.query),
  )
  const shown = new Set(nodes.map((node) => node.path))
  return { ...map, nodes, links: map.links.filter((link) => shown.has(link.from) && shown.has(link.to)) }
}
