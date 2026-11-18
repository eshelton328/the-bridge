// The Links tab's view (D19 `links` 482:539): how many links the header and
// each side count, where the graph puts each item, and what a tap on a link's
// line opens. Pure, so linksView.test.ts checks it without rendering.
import type { ToolkitKind, ToolkitLinks } from '../types.ts'

type Side = ToolkitLinks['from']
type Link = Side['links'][number]

/** All the links of the tab: the header's count (D19 `LINKS 11`, 493:3), the links in and the links out. */
export function linkCount(links: ToolkitLinks): number {
  return links.from.links.length + links.to.links.length
}

/** A side's label with its count, such as "Linked from 4" (shown in capitals). */
export function sideLabel(side: Side): string {
  return `${side.label} ${String(side.links.length)}`
}

/** One node of the links graph, at its place inside the graph's border; the open item has its own size and label style. */
type LinksGraphNode = {
  id: string
  path: string
  label: string
  kind: ToolkitKind
  x: number
  y: number
  size?: { width: number; height: number } | undefined
  labelStyle?: 'label' | undefined
}

export type LinksGraph = {
  width: number
  height: number
  /** The width and height of each node at a side; the open item's node has its own `size`. */
  nodeSize: { width: number; height: number }
  /** The open item's node, in the middle; its id is `focusId`. */
  nodes: LinksGraphNode[]
  /** The node selected as the tab opens: the open item, whose lines all light up. */
  selected: string
  edges: { from: string; to: string }[]
  columns: { label: string; x: number; y: number }[]
  /** `horizontal` for the columns of the desktop and tablet, `vertical` for the phone's rows (M17 493:152). */
  orientation: 'horizontal' | 'vertical'
  /** The nodes at the sides have a muted kind border (D19 493:84). */
  nodeTone: 'muted'
  /** Each line ends at the node's edge, with no dot (D19 493:89). */
  edgeEnd: 'none'
}

export const focusId = 'item'

// D19 `links graph` 493:6, measured inside its 1 px border: 946 wide. The column labels 15 in and 13 down; each side's
// nodes 180 × 32 and 38 apart (493:84, 493:90), the left ones 15 in and the right ones 15 from the right edge. The
// tallest column starts 46 down (493:108) and ends 12 over the foot (493:142); a shorter column is centred on it, as
// is the open item, 150 × 40 with its name in the label style (`node · writer (focus)` 493:78, 398 in and 156 down).
// With one or two items the graph is 148 high inside its border (D29 493:695, D31 493:2163): the columns centre on a
// box 90 high.
// T15 to T31 draw the graph on a tablet 712 wide (710 inside its border), with the desktop's places in height: the
// tallest column 46 down and 12 over the foot (T29 493:3850), and one or two items centred on a box 90 high (T28
// 493:3385, T30 493:4506); the open item is 150 × 40 there too (T15 487:21, T28 493:3577). T15 (487:6) alone starts
// its column 43 down and ends it 11 over the foot, 4 px shorter. The tablet's Container pads the item 24 at the sides
// against Figma's 22 (LIBRARY_GAPS.md, Tablet item spacing), so the graph is 706 wide inside its border: MapGraph
// draws a canvas of a fixed width, and a wider one would scroll sideways.
const sizes = {
  desktop: { width: 946, top: 46, foot: 12, minHeight: 90 },
  tablet: { width: 706, top: 46, foot: 12, minHeight: 90 },
}
const node = { width: 180, height: 32 }
const focusSize = { width: 150, height: 40 }
const inset = 15
const labelTop = 13
const step = 38
const looks = { nodeTone: 'muted', edgeEnd: 'none' } as const

/** The items of a side in the graph's order, each once: the paths of `graph` first, then any other item it links. */
function graphItems(side: Side): Link[] {
  const byPath = new Map(side.links.map((l) => [l.path, l]))
  const order = [...side.graph, ...side.links.map((l) => l.path)]
  const seen = new Set<string>()
  return order.flatMap((path) => {
    const link = byPath.get(path)
    if (link === undefined || seen.has(path)) return []
    seen.add(path)
    return [link]
  })
}

const span = (n: number) => (n === 0 ? 0 : n * step - (step - node.height))

/** The open item's node, 150 × 40 with its name in the label style, centred on the point it is given. */
function focusNode(item: { path: string; name: string; kind: ToolkitKind }, cx: number, cy: number): LinksGraphNode {
  return {
    id: focusId,
    path: item.path,
    label: item.name,
    kind: item.kind,
    x: cx - focusSize.width / 2,
    y: cy - focusSize.height / 2,
    size: focusSize,
    labelStyle: 'label',
  }
}

/** A line from each item that names the open item into it, and from the open item out to each item it names. */
function graphEdges(nodes: LinksGraphNode[]): LinksGraph['edges'] {
  return nodes.flatMap((n) => {
    if (n.id.startsWith('from:')) return [{ from: n.id, to: focusId }]
    if (n.id.startsWith('to:')) return [{ from: focusId, to: n.id }]
    return []
  })
}

/**
 * The graph of the Links tab: the open item in the middle, the items that link to it on the left with a line into it,
 * and the items it links to on the right with a line out to each.
 */
export function linksGraph(
  links: ToolkitLinks,
  item: { path: string; name: string; kind: ToolkitKind },
  size: keyof typeof sizes | 'phone' = 'desktop',
): LinksGraph {
  if (size === 'phone') return phoneGraph(links, item)
  const { width, top, foot, minHeight } = sizes[size]
  const left = graphItems(links.from)
  const right = graphItems(links.to)
  const content = Math.max(span(left.length), span(right.length), minHeight)
  const centre = top + content / 2
  const column = (items: Link[], side: 'from' | 'to', x: number): LinksGraphNode[] =>
    items.map((l, i) => ({
      id: `${side}:${l.path}`,
      path: l.path,
      label: l.name,
      kind: l.kind,
      x,
      y: centre - span(items.length) / 2 + i * step,
    }))
  const nodes = [
    ...column(left, 'from', inset),
    focusNode(item, width / 2, centre),
    ...column(right, 'to', width - inset - node.width),
  ]
  return {
    width,
    height: top + content + foot,
    nodeSize: node,
    nodes,
    selected: focusId,
    edges: graphEdges(nodes),
    columns: [
      { label: sideLabel(links.from), x: inset, y: labelTop },
      { label: sideLabel(links.to), x: width - inset - node.width, y: labelTop },
    ],
    orientation: 'horizontal',
    ...looks,
  }
}

// M17 `links graph` 493:152 draws the graph upright on the phone, 366 wide (364 inside its 1 px border): the items that
// name the open item over it and the items it names under it, each side two to a row in its graph order (493:229,
// 493:235), 162 × 32, 15 in from each edge and 38 apart. The side's label is 13 down (493:228) and its first row 28
// under that; the open item (493:224, 150 × 40, 107 in) starts 40 under the last row over it, the label of the side
// under it 8 under it (493:253) and that side's first row 26 under the label; the graph ends 17 under its last row. A
// side with no links keeps the room of one row for its reason (M31 493:5682). M31 to M34 have the same places, and
// the same 150 × 40 open item (M31 493:5674).
const phone = {
  width: 364,
  node: { width: 162, height: 32 },
  labelTop: 13,
  rows: 28,
  focusGap: 40,
  underFocus: 8,
  underLabel: 26,
  foot: 17,
}

/**
 * The graph of the Links tab on the phone (M17): upright, the open item between the side that names it and the side it
 * names, with the same lines as the desktop's. MapGraph's `vertical` orientation runs each line from the foot of an
 * item over the open item into its top, and from its foot into each item under it (493:234).
 */
function phoneGraph(links: ToolkitLinks, item: { path: string; name: string; kind: ToolkitKind }): LinksGraph {
  const { width, node: size } = phone
  const second = width - inset - size.width
  const rows = (n: number) => Math.max(1, Math.ceil(n / 2))
  const place = (items: Link[], side: 'from' | 'to', top: number): LinksGraphNode[] =>
    items.map((l, i) => ({
      id: `${side}:${l.path}`,
      path: l.path,
      label: l.name,
      kind: l.kind,
      x: i % 2 === 0 ? inset : second,
      y: top + Math.floor(i / 2) * step,
    }))
  const fromItems = graphItems(links.from)
  const toItems = graphItems(links.to)
  const fromTop = phone.labelTop + phone.rows
  const focusTop = fromTop + rows(fromItems.length) * step - (step - size.height) + phone.focusGap
  const toLabel = focusTop + focusSize.height + phone.underFocus
  const toTop = toLabel + phone.underLabel
  const nodes = [
    ...place(fromItems, 'from', fromTop),
    focusNode(item, width / 2, focusTop + focusSize.height / 2),
    ...place(toItems, 'to', toTop),
  ]
  return {
    width,
    height: toTop + rows(toItems.length) * step - (step - size.height) + phone.foot,
    nodeSize: size,
    nodes,
    selected: focusId,
    edges: graphEdges(nodes),
    columns: [
      { label: sideLabel(links.from), x: inset, y: phone.labelTop },
      { label: sideLabel(links.to), x: inset, y: toLabel },
    ],
    orientation: 'vertical',
    ...looks,
  }
}

/**
 * The graph with its open item as wide as the side items (`nodeSize`) and still Figma's 40 high, centred on the same
 * point: for an open item whose name the 150 px node cuts. MapNode's label style leaves a name 104 px of Figma's 150
 * (its 16 px icon and 8 px gap, where Figma's 15 px icon and 6 px gap leave 108), so `writing-reviewer` (D30 493:1502,
 * T29 493:4045, M32 493:6090) would end in an ellipsis (LIBRARY_GAPS.md, Links graph). `ToolkitLinksGraph` measures
 * the name and calls this when it is cut.
 */
export function widenFocus(graph: LinksGraph): LinksGraph {
  const width = graph.nodeSize.width
  return {
    ...graph,
    nodes: graph.nodes.map((n) =>
      n.id === focusId
        ? { ...n, x: n.x + focusSize.width / 2 - width / 2, size: { width, height: focusSize.height } }
        : n,
    ),
  }
}

/**
 * The item a tap on `id` in the graph opens (D19 hint "Tap an item to open it"): one tap on an item at a side opens
 * it, on every layout. A tap on the open item, or Escape (`null`), opens nothing.
 */
export function tapNode(graph: LinksGraph, id: string | null): string | null {
  if (id === null || id === focusId) return null
  return graph.nodes.find((n) => n.id === id)?.path ?? null
}

/**
 * The node to select, so its lines light up and the items it does not touch dim. On the desktop and tablet a side
 * item under the pointer, else the one with the keyboard focus, lights its own line; else the open item is selected
 * and all its lines are lit. On the phone the open item is always the selected one: a touch has no hover.
 */
export function litNode(
  graph: LinksGraph,
  layout: 'desktop' | 'tablet' | 'phone',
  pointer: string | null,
  focus: string | null,
): string {
  if (layout === 'phone') return graph.selected
  const side = (id: string | null) => id !== null && id !== focusId && graph.nodes.some((n) => n.id === id)
  if (side(pointer) && pointer !== null) return pointer
  if (side(focus) && focus !== null) return focus
  return graph.selected
}

/** The file of the place a link is written at: "rules/writing.md" of "rules/writing.md:77". */
function fileOf(at: string): string {
  const colon = at.lastIndexOf(':')
  return colon === -1 ? at : at.slice(0, colon)
}

/** The line of the place a link is written at: 77 of "rules/writing.md:77"; none when the place names no line. */
export function linkLine(link: Link): number | undefined {
  const colon = link.at.lastIndexOf(':')
  const line = colon === -1 ? Number.NaN : Number(link.at.slice(colon + 1))
  return Number.isInteger(line) && line > 0 ? line : undefined
}

/**
 * What a tap on a link's line opens (D19 482:660, "a line to open the file there"): the Files tab of the item whose file
 * it is, with that file selected. A link in is written in the other item's file: its path in toolkit/ starts with that
 * item's folder (skills/writer/SKILL.md) or is the item's own file (rules/writing.md, whose tree shows writing.md). A
 * link out is written in the open item's own files, by their path in it (SKILL.md).
 */
export function linkFile(side: 'from' | 'to', link: Link, open: string): { item: string; file: string } {
  const file = fileOf(link.at)
  if (side === 'to') return { item: open, file }
  if (file.startsWith(link.path) && file !== link.path) return { item: link.path, file: file.slice(link.path.length) }
  return { item: link.path, file: file.slice(file.lastIndexOf('/') + 1) }
}
