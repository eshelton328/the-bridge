// The rows-first split of Figma's D14 (402:6991): the first two panes side by
// side in the top row (402:6992) and the third and fourth in the bottom row,
// a handle between the rows and one between each row's columns. The library's
// `SplitPanes` splits the columns first (LIBRARY_GAPS.md, Rows-first split),
// so this nests the library's `Splitter` as `SplitPanes` does, rows outside
// and columns inside. With `stack` each pane is a row of its own, one above
// the other, as herdr's `column` split (slice 3a). Props only; `sizes`
// controls a handle's panels.
import { Splitter, type SplitterPanel } from '@eshelton328/component-library-1701'
import type { ResizePart } from '../types.ts'

export type RowsSplitProps = {
  /** One to four panes, clockwise from the top left as in `SplitPanes`: the fourth is the bottom row's first. */
  panes: readonly SplitterPanel[]
  /** The sizes of each handle's panels, in percent; equal shares when not set. */
  sizes?: Partial<Record<ResizePart, readonly number[]>> | undefined
  /** Called with the part and its new sizes while the owner drags a handle. */
  onSizeChange?: ((part: ResizePart, size: number[]) => void) | undefined
  /** Each pane a row of its own, in order from the top, with the `rows` handle's sizes. */
  stack?: boolean | undefined
}

export function RowsSplit({ panes, sizes, onSizeChange, stack }: RowsSplitProps) {
  const [a, b, c, d] = panes
  if (a === undefined) return null
  const props = (part: ResizePart) => ({
    size: sizes?.[part],
    onSizeChange: (size: number[]) => onSizeChange?.(part, size),
  })
  if (stack === true)
    return <Splitter orientation="vertical" handleLabel="Resize rows" panels={panes.slice(0, 4)} {...props('rows')} />
  const row = (id: 'top' | 'bottom', shown: readonly (SplitterPanel | undefined)[]): SplitterPanel => ({
    id,
    content: <Splitter handleLabel="Resize columns" panels={shown.filter((p) => p !== undefined)} {...props(id)} />,
  })
  const rows = c === undefined ? [row('top', [a, b])] : [row('top', [a, b]), row('bottom', [d, c])]
  return <Splitter orientation="vertical" handleLabel="Resize rows" panels={rows} {...props('rows')} />
}
