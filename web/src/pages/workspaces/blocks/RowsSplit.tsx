// The rows-first split of Figma's D14 (402:6991): the first two panes side by
// side in the top row (402:6992) and the third and fourth in the bottom row,
// a handle between the rows and one between each row's columns. The library's
// `SplitPanes` splits the columns first (LIBRARY_GAPS.md, Rows-first split),
// so this nests the library's `Splitter` as `SplitPanes` does, rows outside
// and columns inside. With `stack` each pane is a row of its own, one above
// the other, as herdr's `column` split (slice 3a), each at least as high as
// its header and composer (`paneFloors.ts`). Props only; `sizes` controls a
// handle's panels.
import { Splitter, type SplitterPanel } from '@eshelton328/component-library-1701'
import { type RefObject, useLayoutEffect, useRef, useState } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ResizePart } from '../types.ts'
import { floorOf, withFloors } from './paneFloors.ts'

// The stack's box draws no box of its own, so the splitter's root sizes to the pane area as it does with no box.
const stackBox = css({ display: 'contents' })

/**
 * The floor of each panel of the splitter in `box`, in percent of the panels' height, measured after each render and
 * each resize; none until the first measure.
 */
function useFloors(box: RefObject<HTMLDivElement | null>, count: number): number[] {
  const [floors, setFloors] = useState<number[]>([])
  useLayoutEffect(() => {
    const root = box.current?.firstElementChild
    if (root == null) return undefined
    const measure = () => {
      const parts = [...root.children]
      const panels = parts.filter((part) => part.getAttribute('data-part') === 'panel')
      const handles = parts.filter((part) => part.getAttribute('data-part') !== 'panel')
      const room =
        root.getBoundingClientRect().height - handles.reduce((sum, h) => sum + h.getBoundingClientRect().height, 0)
      if (room <= 0) return
      const next = panels.map((panel) => Math.ceil((floorOf(panel) / room) * 10_000) / 100)
      setFloors((now) => (now.length === next.length && now.every((f, i) => f === next[i]) ? now : next))
    }
    measure()
    // After a resize, measure a frame later: Ark's splitter takes the root's new size in the same observer round, and
    // keeps its own sizes over a `size` that changes before it has (zag splitter's syncSize).
    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    })
    observer.observe(root)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  })
  return floors.length === count ? floors : []
}

export type RowsSplitProps = {
  /** One to four panes, clockwise from the top left as in `SplitPanes`: the fourth is the bottom row's first. */
  panes: readonly SplitterPanel[]
  /** The sizes of each handle's panels, in percent; equal shares when not set. */
  sizes?: Partial<Record<ResizePart, readonly number[]>> | undefined
  /**
   * Called with the part and its new sizes while the owner drags a handle; a stack gives the sizes it drew before too,
   * as its floors may have moved them from `sizes`.
   */
  onSizeChange?: ((part: ResizePart, size: number[], drawn?: readonly number[]) => void) | undefined
  /** Each pane a row of its own, in order from the top, with the `rows` handle's sizes. */
  stack?: boolean | undefined
}

export function RowsSplit({ panes, sizes, onSizeChange, stack }: RowsSplitProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const stacked = panes.slice(0, 4)
  const floors = useFloors(boxRef, stack === true ? stacked.length : 0)
  const [a, b, c, d] = panes
  if (a === undefined) return null
  const props = (part: ResizePart) => ({
    size: sizes?.[part],
    onSizeChange: (size: number[]) => onSizeChange?.(part, size),
  })
  if (stack === true) {
    const shares = sizes?.rows ?? stacked.map(() => 100 / stacked.length)
    // A drag under a floor comes back to it on the next render, as the shown sizes are always withFloors'.
    const shown = floors.length === 0 ? shares : withFloors(shares, floors)
    return (
      <div ref={boxRef} className={stackBox}>
        <Splitter
          orientation="vertical"
          handleLabel="Resize rows"
          panels={stacked}
          size={shown}
          // The splitter tells back the sizes it was given; only a drag's sizes are the owner's.
          onSizeChange={(size: number[]) => {
            if (size.some((v, i) => Math.abs(v - (shown[i] ?? 0)) >= 0.01)) onSizeChange?.('rows', size, shown)
          }}
        />
      </div>
    )
  }
  const row = (id: 'top' | 'bottom', shown: readonly (SplitterPanel | undefined)[]): SplitterPanel => ({
    id,
    content: <Splitter handleLabel="Resize columns" panels={shown.filter((p) => p !== undefined)} {...props(id)} />,
  })
  const rows = c === undefined ? [row('top', [a, b])] : [row('top', [a, b]), row('bottom', [d, c])]
  return <Splitter orientation="vertical" handleLabel="Resize rows" panels={rows} {...props('rows')} />
}
