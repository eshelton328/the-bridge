// The graph of the Links tab (Figma `links graph`, D19 493:6): the library's
// MapGraph with the open item in the middle, 150 × 40 with its name in the
// label style and selected, the items that link to it on the left and the
// items it links to on the right, each with its line, in muted kind borders
// and with no dot at a line's end (`linksGraph` in linksView.ts places them).
// On the phone the graph stands upright and its lines run between the rows
// (M17 493:152, MapGraph `orientation="vertical"`). One tap on an item at a
// side opens it, on every layout, as the hint says (`tapNode`). On the
// desktop and tablet the pointer over a side item, or the keyboard focus on
// it, selects it, so only its line stays lit (`litNode`); MapGraph has no
// hover of its own, so the block reads the pointer and the focus from the
// events that bubble out of its node buttons. On the phone the open item
// stays selected. The open item is Figma's 150 × 40; when the library's
// label style cuts its name (writing-reviewer, T29 and M32), the block
// measures the cut after render and once the fonts load, and draws the open
// item as wide as the side items, centred on the same point (`widenFocus`).
// A side with no links says why in its column (D29 493:895). Props only:
// the pointer, the focus and the wider open item are the block's own state.
import { MapGraph } from '@eshelton328/component-library-1701'
import { type SyntheticEvent, useRef, useState } from 'react'
import { BlockBoundary } from '../../../errors/BlockBoundary.tsx'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitKind, ToolkitLinks } from '../types.ts'
import { type LinksGraph, linksGraph, litNode, tapNode, widenFocus } from './linksView.ts'
import { useWideFocus } from './useWideFocus.ts'

const root = css({ position: 'relative' })
// D29 493:895: the reason sits in the left column, 16 in, centred on the open item. The graph's columns start 46 down
// and end 12 over the foot, so a box from 32 down to the foot has the same middle.
const emptyBox = css({
  position: 'absolute',
  inset: '0',
  display: 'flex',
  alignItems: 'center',
  pt: '32',
  ps: '16',
  pointerEvents: 'none',
})
// M31 493:5682: on the phone the reason stands in the side over the rule, where its first row would be: 16 in and 42
// down from the graph's top (the box's 40 and the text's own leading).
const emptyBoxPhone = css({
  position: 'absolute',
  inset: '0',
  display: 'flex',
  alignItems: 'flex-start',
  pt: '40',
  ps: '16',
  pointerEvents: 'none',
})
const emptyText = css({ textStyle: 'mono', color: 'fg.muted', whiteSpace: 'pre-line' })

/** The id of the node whose button an event came from: MapGraph draws one button per node, in `nodes` order. */
function nodeOf(graph: LinksGraph, event: SyntheticEvent<HTMLElement>): string | null {
  const target = event.target
  if (!(target instanceof Element)) return null
  const button = target.closest('button')
  if (button === null) return null
  const index = [...event.currentTarget.querySelectorAll('button')].indexOf(button)
  return graph.nodes[index]?.id ?? null
}

/** A node id kept for the item it was set on; another item opens with nothing under the pointer or the focus. */
type Marked = { item: string; id: string | null }

export type ToolkitLinksGraphProps = {
  links: ToolkitLinks
  item: { path: string; name: string; kind: ToolkitKind }
  /** A tablet draws the graph narrower (T15 487:6), and the phone upright (M17 493:152). */
  layout?: Viewport | undefined
  onOpenItem?: ((path: string) => void) | undefined
}

export function ToolkitLinksGraph({ links, item, layout = 'desktop', onOpenItem }: ToolkitLinksGraphProps) {
  const ref = useRef<HTMLDivElement>(null)
  // The item whose open node is drawn wider, as its name does not fit at 150 px.
  const [wideItem, setWideItem] = useState<string | null>(null)
  const wide = wideItem === item.path
  const base = linksGraph(links, item, layout)
  const graph = wide ? widenFocus(base) : base
  useWideFocus(ref, graph, item.path, wide, setWideItem)
  const [pointer, setPointer] = useState<Marked | null>(null)
  const [focus, setFocus] = useState<Marked | null>(null)
  const on = (m: Marked | null) => (m !== null && m.item === item.path ? m.id : null)
  const selected = litNode(graph, layout, on(pointer), on(focus))
  const empty = links.from.links.length === 0 ? links.from.empty?.graph : undefined
  return (
    <div
      ref={ref}
      className={root}
      data-figma="links graph"
      onPointerOver={(e) => {
        setPointer({ item: item.path, id: nodeOf(graph, e) })
      }}
      onPointerLeave={() => {
        setPointer(null)
      }}
      onFocus={(e) => {
        setFocus({ item: item.path, id: nodeOf(graph, e) })
      }}
      onBlur={() => {
        setFocus(null)
      }}
    >
      <BlockBoundary contentKey={`${item.path}:links`}>
        <MapGraph
          label={`${item.name} links`}
          width={graph.width}
          height={graph.height}
          nodeSize={graph.nodeSize}
          nodeTone={graph.nodeTone}
          edgeEnd={graph.edgeEnd}
          orientation={graph.orientation}
          nodes={graph.nodes.map((n) => ({
            id: n.id,
            label: n.label,
            kind: n.kind,
            x: n.x,
            y: n.y,
            size: n.size,
            labelStyle: n.labelStyle,
          }))}
          edges={graph.edges}
          columns={graph.columns}
          selectedId={selected}
          onSelect={(id) => {
            const open = tapNode(graph, id)
            if (open !== null) onOpenItem?.(open)
            // Escape puts the selection back on the open item.
            else if (id === null) setFocus(null)
          }}
        />
      </BlockBoundary>
      {empty === undefined ? null : (
        <div className={layout === 'phone' ? emptyBoxPhone : emptyBox}>
          <p className={emptyText}>{empty}</p>
        </div>
      )}
    </div>
  )
}
