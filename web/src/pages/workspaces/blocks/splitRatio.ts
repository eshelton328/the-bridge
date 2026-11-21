// The ratio write of a dragged handle of a live split (W2c, backend #334):
// which herdr split the handle stands for, and the ratio that puts it where
// the owner let go.
//
// Each handle of the page's split has two panels beside it, and each panel
// holds one or more panes (`panelsOf`). The handle stands for the split of the
// herdr tree whose first part holds the panel before it and whose second part
// the panel after it; its path is the parts from the tree's root to it. That
// split must place its parts along the handle's axis (`row` for a handle
// between columns), else the handle has no write.
//
// The page draws each pane's share of the whole tab scaled to fill the space
// (liveLayout.ts), so a handle's sizes are not always the split's ratio: with
// panes past four left out, a panel holds only the drawn panes of a part. Along
// the split's axis every pane of its first part grows with the ratio `r` and
// every pane of its second part with `1 - r`, so the drawn sizes of the two
// parts, F and G, keep `F / G = k · r / (1 - r)`. The new ratio keeps that `k`:
// `r' / (1 - r') = r / (1 - r) · (F' / G') / (F / G)`. When the panels are the
// split's two parts, as in each of liveLayout's pair layouts, that is the
// handle's new share. The ratio is clamped to the contract's 0.1 to 0.9.
import { type LayoutNode, maxSplitRatio, minSplitRatio, type SetSplitRatioRequest, splitId } from '@bridge/contract'
import type { LiveTab, SplitSizes, WorkspacesData } from '../types.ts'

/** A handle of the page's split: a rows-first split's, a stack's (`rows`) or the columns-first split's. */
export type SplitPart = keyof SplitSizes

/** The axis of `part`'s panels: `row` for a handle between columns, `column` for one between rows. */
const axisOf = (part: SplitPart): 'row' | 'column' =>
  part === 'columns' || part === 'top' || part === 'bottom' ? 'row' : 'column'

/**
 * The panes of each panel of `part`, by their place in the drawn panes (clockwise from the top left), for `count` drawn
 * panes: as `SplitPanes` and `RowsSplit` place them.
 */
export function panelsOf(split: WorkspacesData['split'], count: number, part: SplitPart): number[][] {
  const places: Partial<Record<SplitPart, number[][]>> =
    split === 'stack'
      ? { rows: Array.from({ length: count }, (_, i) => [i]) }
      : split === 'rows'
        ? {
            rows: [
              [0, 1],
              [3, 2],
            ],
            top: [[0], [1]],
            bottom: [[3], [2]],
          }
        : {
            columns: [
              [0, 3],
              [1, 2],
            ],
            left: [[0], [3]],
            right: [[1], [2]],
          }
  return (places[part] ?? []).map((panel) => panel.filter((at) => at < count)).filter((panel) => panel.length > 0)
}

type Split = Extract<LayoutNode, { kind: 'split' }>

const localsOf = (node: LayoutNode): Set<string> =>
  node.kind === 'pane'
    ? new Set([splitId(node.chat).local])
    : new Set([...localsOf(node.first), ...localsOf(node.second)])

/** The split whose first part holds every chat of `before` and whose second part every chat of `after`, with its path. */
function splitBetween(
  node: LayoutNode,
  before: readonly string[],
  after: readonly string[],
  path: SetSplitRatioRequest['path'] = [],
): { split: Split; path: SetSplitRatioRequest['path'] } | undefined {
  if (node.kind === 'pane') return undefined
  const first = localsOf(node.first)
  const second = localsOf(node.second)
  if (before.every((c) => first.has(c)) && after.every((c) => second.has(c))) return { split: node, path }
  const both = [...before, ...after]
  if (both.every((c) => first.has(c))) return splitBetween(node.first, before, after, [...path, 'first'])
  if (both.every((c) => second.has(c))) return splitBetween(node.second, before, after, [...path, 'second'])
  return undefined
}

/**
 * The ratio write of a handle of `part`'s splitter dragged from `from` to `to` (its panels' sizes, in percent), in
 * `tab`, with `panels` the local chat IDs of each panel: none when no panel moved, when the tab has no tree, or when no
 * split along the handle's axis stands between its panels.
 */
export function ratioWrite(
  tab: LiveTab,
  part: SplitPart,
  panels: readonly (readonly string[])[],
  from: readonly number[],
  to: readonly number[],
): SetSplitRatioRequest | undefined {
  if (tab.id === undefined || tab.root === undefined) return undefined
  const moved = to.findIndex((size, i) => Math.abs(size - (from[i] ?? size)) >= 0.01)
  const before = panels[moved]
  const after = panels[moved + 1]
  if (moved === -1 || before === undefined || after === undefined) return undefined
  const found = splitBetween(tab.root, before, after)
  if (found?.split.direction !== axisOf(part)) return undefined
  const first = localsOf(found.split.first)
  const second = localsOf(found.split.second)
  const sum = (sizes: readonly number[], part: Set<string>) =>
    panels.reduce((total, panel, i) => (panel.every((c) => part.has(c)) ? total + (sizes[i] ?? 0) : total), 0)
  const [f, g, f2, g2] = [sum(from, first), sum(from, second), sum(to, first), sum(to, second)]
  if (f <= 0 || g <= 0 || f2 <= 0 || g2 <= 0) return undefined
  const { ratio } = found.split
  const odds = (ratio / (1 - ratio)) * (f2 / g2) * (g / f)
  const next = Math.min(Math.max(odds / (1 + odds), minSplitRatio), maxSplitRatio)
  return { tab: tab.id, path: found.path, ratio: Math.round(next * 1000) / 1000 }
}
