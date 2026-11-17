// The Map view of the Toolkit (Figma `map canvas`, D2 426:362): one column
// for each kind and a line where one file links to another, drawn by the
// library's MapGraph. The selected item's lines light up and the items it
// does not touch go dim; its card (`selection · <name>`) shows at the bottom
// right, and the legend of the kinds at the bottom left. The map does no
// layout of its own: this block places each node by its column and row.
// Props only.
import { MapGraph, MapLegend, MapSelectionCard } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitItemView, ToolkitMapView } from '../types.ts'

// D2 426:362: the canvas is 1384 × 742 with a 1 px border, so the drawing inside it is 1382 × 740, and every
// place below is Figma's less that border. The columns start 40 in and are 360 apart (node · writing 426:464 at
// 136, node · writer 426:512 at 496); the rows start 70 down and are 52 apart (34 high, 18 between). A column
// heading (426:363) is 4 px right of its nodes and 30 down; its text hangs from y, and Figma's 17 px line box
// puts the capitals 4 px under the box's top, so y is 33.
const CANVAS = { width: 1382, height: 740 }
const NODES = { x: 39, y: 69, column: 360, row: 52 }
const HEADING = { x: 43, y: 33 }
// The selection card names its item in an h3; this heading, for screen readers only, comes between it and the
// page's h1. Figma draws no title over the map.
const srOnly = css({ srOnly: true })

export type ToolkitMapProps = {
  map: ToolkitMapView
  /** The path of the selected item; none when nothing is selected. */
  selected: string | null
  /** The selected item, for its card: its description and link counts. */
  selectedItem?: ToolkitItemView | undefined
  /** Called with an item's path when it is selected, and with null when the selection is cleared. */
  onSelect?: ((path: string | null) => void) | undefined
  /** Called by the card's open button with the item's path. */
  onOpen?: ((path: string) => void) | undefined
}

export function ToolkitMap({ map, selected, selectedItem, onSelect, onOpen }: ToolkitMapProps) {
  const node = map.nodes.find((n) => n.path === selected)
  return (
    <div data-figma="map canvas">
      <h2 className={srOnly}>Toolkit map</h2>
      <MapGraph
        label="Toolkit map"
        width={CANVAS.width}
        height={CANVAS.height}
        columns={map.columns.map((label, i) => ({ label, x: HEADING.x + NODES.column * i, y: HEADING.y }))}
        nodes={map.nodes.map((n) => ({
          id: n.path,
          label: n.name,
          kind: n.kind,
          meta: n.meta,
          x: NODES.x + NODES.column * n.column,
          y: NODES.y + NODES.row * n.row,
        }))}
        edges={map.links}
        selectedId={selected}
        onSelect={onSelect}
        legend={
          <div data-figma="legend">
            <MapLegend hint="Select an item to light its links" />
          </div>
        }
        card={
          node === undefined ? null : (
            <div data-figma={`selection · ${node.name}`}>
              <MapSelectionCard
                name={node.name}
                kind={node.kind}
                // The card says what the item does as a sentence; the list's cards show the same text without the stop.
                description={selectedItem === undefined ? undefined : `${selectedItem.description}.`}
                linksTo={selectedItem?.linksTo}
                linkedFrom={selectedItem?.linkedFrom}
                actionLabel={`Open ${node.name}`}
                onAction={() => {
                  onOpen?.(node.path)
                }}
                onClose={() => {
                  onSelect?.(null)
                }}
              />
            </div>
          )
        }
      />
    </div>
  )
}
