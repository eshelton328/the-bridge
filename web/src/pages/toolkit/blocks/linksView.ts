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

/** One node of the links graph, at its place inside the graph's border. */
type LinksGraphNode = { id: string; path: string; label: string; kind: ToolkitKind; x: number; y: number }

export type LinksGraph = {
  width: number
  height: number
  /** The width and height of every node: the library's MapGraph takes one size for all. */
  nodeSize: { width: number; height: number }
  /** The open item's node, in the middle; its id is `focusId`. */
  nodes: LinksGraphNode[]
  edges: { from: string; to: string }[]
  columns: { label: string; x: number; y: number }[]
}

export const focusId = 'item'

// D19 `links graph` 493:6, measured inside its 1 px border: 946 wide. The column labels 15 in and 13 down; each side's
// nodes 180 × 32 and 38 apart (493:84, 493:90), the left ones 15 in and the right ones 15 from the right edge. The
// tallest column starts 46 down (493:108) and ends 12 over the foot (493:142); a shorter column is centred on it, as
// is the open item. With one or two items the graph is 148 high inside its border (D29 493:695, D31 493:2163): the
// columns centre on a box 90 high.
// T15 to T31 draw the graph on a tablet 712 wide (710 inside its border), with the desktop's places in height: the
// tallest column 46 down and 12 over the foot (T29 493:3850), and one or two items centred on a box 90 high (T28
// 493:3385, T30 493:4506). T15 (487:6) alone starts its column 43 down and ends it 11 over the foot, 4 px shorter. The
// tablet's Container pads the item 24 at the sides against Figma's 22 (LIBRARY_GAPS.md, Tablet item spacing), so the
// graph is 706 wide inside its border: MapGraph draws a canvas of a fixed width, and a wider one would scroll sideways.
const sizes = {
  desktop: { width: 946, top: 46, foot: 12, minHeight: 90 },
  tablet: { width: 706, top: 46, foot: 12, minHeight: 90 },
}
const node = { width: 180, height: 32 }
const inset = 15
const labelTop = 13
const step = 38

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

/**
 * The graph of the Links tab: the open item in the middle, the items that link to it on the left with a line into it,
 * and the items it links to on the right with a line out to each.
 */
export function linksGraph(
  links: ToolkitLinks,
  item: { path: string; name: string; kind: ToolkitKind },
  size: keyof typeof sizes = 'desktop',
): LinksGraph {
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
  const from = column(left, 'from', inset)
  const to = column(right, 'to', width - inset - node.width)
  const focus: LinksGraphNode = {
    id: focusId,
    path: item.path,
    label: item.name,
    kind: item.kind,
    x: width / 2 - node.width / 2,
    y: centre - node.height / 2,
  }
  return {
    width,
    height: top + content + foot,
    nodeSize: node,
    nodes: [...from, focus, ...to],
    edges: [...from.map((n) => ({ from: n.id, to: focusId })), ...to.map((n) => ({ from: focusId, to: n.id }))],
    columns: [
      { label: sideLabel(links.from), x: inset, y: labelTop },
      { label: sideLabel(links.to), x: width - inset - node.width, y: labelTop },
    ],
  }
}

/** The file of the place a link is written at: "rules/writing.md" of "rules/writing.md:77". */
function fileOf(at: string): string {
  const colon = at.lastIndexOf(':')
  return colon === -1 ? at : at.slice(0, colon)
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
