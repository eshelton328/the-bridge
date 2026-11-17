// What the Toolkit list shows: the state's groups narrowed by the kind chip
// and the search, which matches an item's name, path and description,
// ignoring case. A group with no item left is not shown. Pure, so
// listView.test.ts checks it without rendering.
import type { ToolkitData, ToolkitGroupView, ToolkitItemView, ToolkitUi } from '../types.ts'

export type ToolkitListView = {
  groups: ToolkitGroupView[]
  /**
   * The names that more than one shown item has, such as the skill and the
   * agent called writer. Figma names a card's layer after its item, so
   * those cards have no unique layer name.
   */
  sharedNames: ReadonlySet<string>
}

const matches = (item: ToolkitItemView, query: string) => {
  const q = query.trim().toLowerCase()
  if (q === '') return true
  return [item.name, item.path, item.description].some((text) => text.toLowerCase().includes(q))
}

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
