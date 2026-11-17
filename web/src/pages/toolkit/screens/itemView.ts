// The item open beside the list (D3): the list's item with the path in
// `ui.open`, and what the state knows of it in `data.details`. An item with
// no details opens with what the list knows: its name, kind, path and
// description, the Overview tab, and no files. Pure, so itemView.test.ts
// checks it without rendering.
import type { ToolkitData, ToolkitItemDetailView, ToolkitItemView, ToolkitOpenItem, ToolkitUi } from '../types.ts'

const overview = { value: 'overview', label: 'Overview' }

/** What an item with no details shows: the list's description, its path, and nothing that is not known. */
function fallback(item: ToolkitItemView): ToolkitItemDetailView {
  return {
    path: item.path,
    location: `toolkit/${item.path}`,
    changed: '',
    description: item.description,
    tabs: [overview],
    preview: { file: '', blocks: [] },
    usedIn: { label: '', items: [] },
    files: { count: item.files, lines: [] },
  }
}

export function openItem(data: ToolkitData, ui: Pick<ToolkitUi, 'open' | 'itemTab'>): ToolkitOpenItem | null {
  if (ui.open === undefined || ui.open === null) return null
  const path = ui.open
  const item = data.groups.flatMap((g) => g.items).find((i) => i.path === path)
  if (item === undefined) return null
  const detail = data.details?.find((d) => d.path === path) ?? fallback(item)
  const first = detail.tabs[0]?.value ?? overview.value
  const tab = detail.tabs.some((t) => t.value === ui.itemTab) ? (ui.itemTab ?? first) : first
  return { item, detail, tab }
}
