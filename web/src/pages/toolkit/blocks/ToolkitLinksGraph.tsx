// The graph of the Links tab (Figma `links graph`, D19 493:6): the library's
// MapGraph with the open item in the middle, selected, the items that link to
// it on the left and the items it links to on the right, each with its line
// (`linksGraph` in linksView.ts places them). A tap on an item opens it. A
// side with no links says why in its column (D29 493:895). MapGraph takes one
// size for every node and ends each line in a dot (LIBRARY_GAPS.md, Links
// graph). Props only.
import { MapGraph } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitKind, ToolkitLinks } from '../types.ts'
import { focusId, linksGraph } from './linksView.ts'

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
const emptyText = css({ textStyle: 'mono', color: 'fg.muted', whiteSpace: 'pre-line' })

export type ToolkitLinksGraphProps = {
  links: ToolkitLinks
  item: { path: string; name: string; kind: ToolkitKind }
  /** A tablet draws the graph narrower (T15 487:6), and the phone upright (M17 493:152). */
  layout?: Viewport | undefined
  onOpenItem?: ((path: string) => void) | undefined
}

export function ToolkitLinksGraph({ links, item, layout = 'desktop', onOpenItem }: ToolkitLinksGraphProps) {
  const graph = linksGraph(links, item, layout)
  const empty = links.from.links.length === 0 ? links.from.empty?.graph : undefined
  return (
    <div className={root} data-figma="links graph">
      <MapGraph
        label={`${item.name} links`}
        width={graph.width}
        height={graph.height}
        nodeSize={graph.nodeSize}
        nodes={graph.nodes.map((n) => ({ id: n.id, label: n.label, kind: n.kind, x: n.x, y: n.y }))}
        edges={graph.edges}
        columns={graph.columns}
        selectedId={graph.selected}
        onSelect={(id) => {
          const target = graph.nodes.find((n) => n.id === id)
          if (target !== undefined && target.id !== focusId) onOpenItem?.(target.path)
        }}
      />
      {empty === undefined ? null : (
        <div className={emptyBox}>
          <p className={emptyText}>{empty}</p>
        </div>
      )}
    </div>
  )
}
