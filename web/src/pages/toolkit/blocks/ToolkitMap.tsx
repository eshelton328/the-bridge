// The Map view of the Toolkit (Figma `map canvas`, D2 426:362): one column
// for each kind and a line where one file links to another, drawn by the
// library's MapGraph. The selected item's lines light up and the items it
// does not touch go dim; its card (`selection · <name>`) shows at the bottom
// right, and the legend of the kinds at the bottom left. The map does no
// layout of its own: this block places each node by its column and row.
// On a tablet (T2 428:348) the map is narrower, with smaller nodes and no
// legend, and the selected item shows without its description. On the phone
// (M11 461:683) the map is a window onto the tablet's drawing that scrolls
// sideways, with the hint at its foot, and the selected item's card comes
// under the window. The phone's window pinch zooms and drags its drawing
// (MapGraph `zoom`, which marks the window `data-allow-pinch`, so the app's
// page zoom block lets the gesture through); the desktop's and tablet's
// maps do not zoom, as Figma's D2 and T2 notes say nothing of it. The tablet's and the phone's nodes are the
// library's compact nodes (MapGraph `nodeDensity="compact"`: a 12 px icon and the name 27 px in, so a 140 px node
// shows `pr-description` whole), and their links end at the node's edge with no dot (`edgeEnd="none"`), as Figma's
// T2 and M11 links do. The phone's window adds the minimap in its top right corner (MapGraph `minimap`, M11
// 461:1255), and its card is the compact one (M11 461:1259): the counts as arrows at the title row's end, Show links
// and Open side by side, and no close button. Props only.
import { Badge, MapGraph, MapLegend, MapSelectionCard } from '@eshelton328/component-library-1701'
import { type RefObject, useEffect, useRef, useState } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitItemView, ToolkitMapView } from '../types.ts'

// D2 426:362: the canvas is 1384 × 742 with a 1 px border, so the drawing inside it is 1382 × 740, and every
// place below is Figma's less that border. The columns start 40 in and are 360 apart (node · writing 426:464 at
// 136, node · writer 426:512 at 496); the rows start 70 down and are 52 apart (34 high, 18 between). A column
// heading (426:363) is 4 px right of its nodes and 30 down; its text hangs from y, and Figma's 17 px line box
// puts the capitals 4 px under the box's top, so y is 33.
// T2 428:348: the tablet's canvas is 712 × 900, so the drawing is 710 × 898. Its nodes are 140 × 30 (node · writing
// 428:402); the columns start 14 in and are 178 apart, the rows start 60 down and are 58 apart. A heading (428:349)
// is 2 px right of its nodes and 24 down, so its capitals start at y 27. The tablet page is 24 px in (no space
// token has Figma's 22), so the canvas is 708 wide and the drawing 706.
// M11 461:683: the phone's window (map viewport 461:866) is 366 × 500 with a 1 px border, so 364 × 498 inside,
// and the tablet's drawing (map canvas 461:867, 712 × 900) sits 6 px left of it and 8 px above. Its nodes start
// 7 px in and 51 down (node · writing 461:921 at 20, 145), 178 and 58 apart; a heading (461:868) is 2 px right of
// its nodes and 36 above them, so its capitals start at y 19. The drawing is 705 wide, to the right edge of the
// last column; it is 498 high, the window's height, so the window scrolls sideways only (no size token has 500).
// The phone's map zooms from the whole drawing fitted to the window up to MapGraph's default 3 times; it opens at 1,
// the drawing at its own size, as before. The window's inside is measured (useInside), since a phone narrower than
// Figma's has a narrower window; Figma's 364 × 498 is only the first value, before the first measure.
const GEOMETRY = {
  desktop: {
    canvas: { width: 1382, height: 740 },
    nodes: { x: 39, y: 69, column: 360, row: 52 },
    heading: { x: 43, y: 33 },
    nodeSize: undefined,
    compact: false,
    legend: true,
    description: true,
    inside: undefined,
  },
  tablet: {
    canvas: { width: 706, height: 898 },
    nodes: { x: 13, y: 59, column: 178, row: 58 },
    heading: { x: 15, y: 27 },
    nodeSize: { width: 140, height: 30 },
    compact: true,
    legend: false,
    description: false,
    inside: undefined,
  },
  phone: {
    canvas: { width: 705, height: 498 },
    nodes: { x: 7, y: 51, column: 178, row: 58 },
    heading: { x: 9, y: 19 },
    nodeSize: { width: 140, height: 30 },
    compact: true,
    legend: false,
    description: false,
    inside: { width: 364, height: 498 },
  },
}
// The selection card names its item in an h3; this heading, for screen readers only, comes between it and the
// page's h1. Figma draws no title over the map.
const srOnly = css({ srOnly: true })
// M11: the phone's window holds the hint over the map's bottom left corner.
const mapWindow = css({ position: 'relative' })

type Size = { width: number; height: number }

/**
 * The inside of the map's window (MapGraph's scroller, the element it marks `data-allow-pinch`), read each time the
 * page's own wrapper changes size. It reads sizes only. Until the first measure, and with no `first`, it is `first`.
 */
function useInside(wrapperRef: RefObject<HTMLDivElement | null>, first: Size | undefined): Size | undefined {
  const [inside, setInside] = useState(first)
  const measure = first !== undefined
  useEffect(() => {
    const el = wrapperRef.current
    if (!measure || el === null) return
    const read = () => {
      const scroller = el.querySelector('[data-allow-pinch]')
      if (scroller === null || scroller.clientWidth === 0 || scroller.clientHeight === 0) return
      const next = { width: scroller.clientWidth, height: scroller.clientHeight }
      setInside((now) => (now?.width === next.width && now.height === next.height ? now : next))
    }
    read()
    const observer = new ResizeObserver(read)
    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [wrapperRef, measure])
  return first === undefined ? undefined : inside
}
const hint = css({ position: 'absolute', left: '10', bottom: '10' })

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
  /** Called by the phone card's Show links button with the item's path (M11 461:1268). */
  onLinks?: ((path: string) => void) | undefined
  /**
   * The tablet's map is narrower, with no legend and no description on the selected item; the phone's is a window
   * onto it, with the card under the window. The desktop's when not set.
   */
  layout?: Viewport | undefined
}

export function ToolkitMap({
  map,
  selected,
  selectedItem,
  onSelect,
  onOpen,
  onLinks,
  layout = 'desktop',
}: ToolkitMapProps) {
  const { canvas, nodes, heading, nodeSize, compact, legend, description } = GEOMETRY[layout]
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inside = useInside(wrapperRef, GEOMETRY[layout].inside)
  const phone = layout === 'phone'
  // The smallest scale fits the whole drawing in the window, and never goes over 1 when the drawing already fits.
  const zoom =
    inside === undefined ? undefined : { min: Math.min(1, inside.width / canvas.width, inside.height / canvas.height) }
  const node = map.nodes.find((n) => n.path === selected)
  const card =
    node === undefined ? null : (
      <div data-figma={`selection · ${node.name}`}>
        <MapSelectionCard
          name={node.name}
          kind={node.kind}
          // The card says what the item does as a sentence; the list's cards show the same text without the stop.
          description={selectedItem === undefined || !description ? undefined : `${selectedItem.description}.`}
          linksTo={selectedItem?.linksTo}
          linkedFrom={selectedItem?.linkedFrom}
          actionLabel={`Open ${node.name}`}
          onAction={() => {
            onOpen?.(node.path)
          }}
          density={phone ? 'compact' : 'default'}
          // Show links only when the screen passes onLinks: an item with no Links tab has none (M11).
          linksLabel={phone && onLinks !== undefined ? 'Show links' : undefined}
          onLinks={
            phone && onLinks !== undefined
              ? () => {
                  onLinks(node.path)
                }
              : undefined
          }
          // M11 461:1259: the phone's card has no close button; Escape or a tap on another node changes the selection.
          onClose={
            phone
              ? undefined
              : () => {
                  onSelect?.(null)
                }
          }
        />
      </div>
    )
  const legendSlot = legend ? (
    <div data-figma="legend">
      <MapLegend hint="Select an item to light its links" />
    </div>
  ) : null
  const graph = (
    <div ref={wrapperRef} className={phone ? mapWindow : undefined} data-figma={phone ? 'map viewport' : 'map canvas'}>
      <h2 className={srOnly}>Toolkit map</h2>
      <MapGraph
        label="Toolkit map"
        width={canvas.width}
        height={canvas.height}
        columns={map.columns.map((label, i) => ({ label, x: heading.x + nodes.column * i, y: heading.y }))}
        nodes={map.nodes.map((n) => ({
          id: n.path,
          label: n.name,
          kind: n.kind,
          meta: n.meta,
          x: nodes.x + nodes.column * n.column,
          y: nodes.y + nodes.row * n.row,
        }))}
        nodeSize={nodeSize}
        nodeDensity={compact ? 'compact' : 'default'}
        edgeEnd={compact ? 'none' : 'dot'}
        edges={map.links}
        selectedId={selected}
        onSelect={onSelect}
        legend={legendSlot}
        card={phone ? null : card}
        zoom={zoom}
        minimap={phone}
      />
      {phone ? (
        // M11 461:1257: the hint is a pill 10 px in from the window's left and bottom edges; the MapGraph legend
        // slot sits 24 px in, so the pill goes over the map here.
        <div className={hint} data-figma="hint">
          <Badge variant="quiet" label="Pinch to zoom · drag to move" />
        </div>
      ) : null}
    </div>
  )
  if (!phone) return graph
  // M11: the card (selection · writer 461:1259) comes under the window, 10 px below it, as the page's next row.
  return (
    <>
      {graph}
      {card}
    </>
  )
}
