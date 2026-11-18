// The item open beside the list (D3): the list's item with the path in
// `ui.open`, and what the state knows of it in `data.details`. An item with
// no details opens with what the list knows: its name, kind, path and
// description, the Overview tab, and no files. An item that is on the map
// but not in the list (the Rules items of the D1 list) opens from its map
// node, with its link counts from the map. `showOnMap` is the ui change of
// the item's Show on map button. Pure, so itemView.test.ts checks both
// without rendering. `openFrom`, `backTo` and `openedFrom` are the way into an
// item from another item's links and back (T7). An item a link names that
// the list does not show opens from `data.linkTargets`, with its Files tab
// (D19).
import type {
  ToolkitData,
  ToolkitFileBrowser,
  ToolkitItemDetailView,
  ToolkitItemView,
  ToolkitMapView,
  ToolkitOpenItem,
  ToolkitUi,
} from '../types.ts'

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

const filesTab = { value: 'files', label: 'Files' }

/**
 * An item's details with the browser of a link target (`data.linkTargets`, D19): a detail with no browser of its own
 * takes it, and the Files tab when it has none, so a tap on a link's file and line opens a real tree with the file.
 */
function withLinkBrowser(
  detail: ToolkitItemDetailView,
  browser: ToolkitFileBrowser | undefined,
): ToolkitItemDetailView {
  if (browser === undefined || detail.browser !== undefined) return detail
  const tabs = detail.tabs.some((t) => t.value === filesTab.value) ? detail.tabs : [...detail.tabs, filesTab]
  return { ...detail, browser, tabs }
}

/** The map node with this path as a list item: no description, its link counts from the map, and one file. */
function fromMap(map: ToolkitMapView | undefined, path: string): ToolkitItemView | undefined {
  const node = map?.nodes.find((n) => n.path === path)
  if (node === undefined || map === undefined) return undefined
  return {
    kind: node.kind,
    name: node.name,
    path: node.path,
    description: '',
    linksTo: map.links.filter((l) => l.from === path).length,
    linkedFrom: map.links.filter((l) => l.to === path).length,
    files: 1,
  }
}

/** The ui change of Show on map: close the item, show the map with it selected, and clear the chip and the search, which could hide it. */
export function showOnMap(path: string): Partial<ToolkitUi> {
  return { open: null, view: 'map', mapSelected: path, filter: 'all', query: '' }
}

/**
 * The ui change that opens an item: from the list or the map (`from` null), or from the links of the open item (`from`
 * its path, T7), so the back row can show the way back to it.
 */
export function openFrom(path: string, from: string | null = null): Partial<ToolkitUi> {
  return { open: path, from }
}

/**
 * The ui change that opens a file of an item on its Files tab (D19, a tap on a link's file and line): another item
 * opens from the open item (`openFrom`); the open item stays as it was opened. The file opens in its own default view,
 * on a page of its own when `page` is set (`filePage`, as `selectFile` sets it for a tablet or phone).
 */
export function openFile(path: string, file: string, from: string, page = false): Partial<ToolkitUi> {
  const files = { itemTab: 'files', file, fileView: undefined, filePage: page ? true : undefined }
  return path === from ? files : { ...openFrom(path, from), ...files }
}

/** The ui change of a crumb in the back row: Toolkit (`null`) shows the list, an item's crumb opens that item. */
export function backTo(path: string | null): Partial<ToolkitUi> {
  return { open: path, from: null }
}

/**
 * The item the open item was opened from (T7), for the back row's breadcrumb: the list item at `ui.from`, or null when
 * nothing is open, the list opened it, the path is the open item's own or no list item has it.
 */
export function openedFrom(data: ToolkitData, ui: Pick<ToolkitUi, 'open' | 'from'>): ToolkitItemView | null {
  if (ui.open === undefined || ui.open === null || ui.from === undefined || ui.from === null) return null
  if (ui.from === ui.open) return null
  return data.groups.flatMap((g) => g.items).find((i) => i.path === ui.from) ?? null
}

export function openItem(data: ToolkitData, ui: Pick<ToolkitUi, 'open' | 'itemTab'>): ToolkitOpenItem | null {
  if (ui.open === undefined || ui.open === null) return null
  const path = ui.open
  const target = data.linkTargets?.find((t) => t.item.path === path)
  const item =
    data.groups.flatMap((g) => g.items).find((i) => i.path === path) ?? fromMap(data.map, path) ?? target?.item
  if (item === undefined) return null
  const detail = withLinkBrowser(data.details?.find((d) => d.path === path) ?? fallback(item), target?.browser)
  const first = detail.tabs[0]?.value ?? overview.value
  const tab = detail.tabs.some((t) => t.value === ui.itemTab) ? (ui.itemTab ?? first) : first
  return { item, detail, tab }
}
