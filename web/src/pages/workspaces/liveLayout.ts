// A workspace's herdr layout (slice 3a) as the page's own layout: the active
// tab's split tree drawn by the page's splits, with the tab's focused chat
// as the focused pane. The page draws at most `maxPanes` panes, so the tree
// keeps its first four panes in tree order; a split that loses one part
// gives its place to the other part. The chats of the other panes stay
// sidebar rows. Inactive tabs are not drawn.
//
// The rule, from the tree that is left:
// - one pane fills the space;
// - `row(a, b)` puts a and b side by side (the columns-first split), and
//   `column(a, b)` puts a over b (`stack`), each sized by the split's ratio;
// - `column(row(a, b), row(c, d))` is the rows-first 2×2 (`rows`), and
//   `column(row(a, b), c)` its three-pane form; `row(column(a, c),
//   column(b, d))` is the columns-first 2×2, and `row(a, column(b, c))` its
//   three-pane form. Each handle takes the ratio of its split.
// - Any other tree takes the nearest layout: the rows-first split when its
//   root is a `column`, else the columns-first split, its panes in tree
//   order from the top left, row by row, with equal shares.
// A ratio is the share of the split's first part; a handle's sizes are in
// percent, rounded to 0.01.
import { chatsOf, type ChatId, type LayoutNode, splitId, type TabLayout } from '@bridge/contract'
import { maxPanes } from './blocks/workspaceLayout.ts'
import type { SplitSizes, WorkspaceLayout } from './types.ts'

/** The tree with only the panes of `kept`; a split that loses a part becomes its other part. */
function prune(node: LayoutNode, kept: ReadonlySet<ChatId>): LayoutNode | undefined {
  if (node.kind === 'pane') return kept.has(node.chat) ? node : undefined
  const first = prune(node.first, kept)
  const second = prune(node.second, kept)
  if (first === undefined) return second
  if (second === undefined) return first
  return { ...node, first, second }
}

/** A split's two shares in percent: the first part's ratio, and the rest. */
function shares(ratio: number): number[] {
  const first = Math.round(ratio * 10_000) / 100
  return [first, Math.round((100 - first) * 100) / 100]
}

type Split = Extract<LayoutNode, { kind: 'split' }>
type Pane = Extract<LayoutNode, { kind: 'pane' }>

const isPane = (node: LayoutNode): node is Pane => node.kind === 'pane'

/** `node` when it is a split of two panes in `direction`. */
const pairIn = (
  node: LayoutNode,
  direction: Split['direction'],
): (Split & { first: Pane; second: Pane }) | undefined =>
  node.kind === 'split' && node.direction === direction && isPane(node.first) && isPane(node.second)
    ? { ...node, first: node.first, second: node.second }
    : undefined

/** The page's layout of a tree, its panes by chat ID: in each split's places, clockwise from the top left. */
type Placed = { panes: ChatId[]; split?: 'rows' | 'stack'; splitSizes?: SplitSizes }

function place(node: LayoutNode): Placed {
  if (node.kind === 'pane') return { panes: [node.chat] }
  const { first, second, ratio } = node
  if (isPane(first) && isPane(second))
    return node.direction === 'row'
      ? { panes: [first.chat, second.chat], splitSizes: { columns: shares(ratio) } }
      : { panes: [first.chat, second.chat], split: 'stack', splitSizes: { rows: shares(ratio) } }
  if (node.direction === 'column') {
    const top = pairIn(first, 'row')
    const bottom = pairIn(second, 'row')
    // The rows-first split's places run clockwise: the bottom row's right pane before its left one.
    if (top && bottom)
      return {
        panes: [top.first.chat, top.second.chat, bottom.second.chat, bottom.first.chat],
        split: 'rows',
        splitSizes: { rows: shares(ratio), top: shares(top.ratio), bottom: shares(bottom.ratio) },
      }
    if (top && isPane(second))
      return {
        panes: [top.first.chat, top.second.chat, second.chat],
        split: 'rows',
        splitSizes: { rows: shares(ratio), top: shares(top.ratio) },
      }
  } else {
    const left = pairIn(first, 'column')
    const right = pairIn(second, 'column')
    // The columns-first split's places run clockwise too: the left column's bottom pane is the last.
    if (left && right)
      return {
        panes: [left.first.chat, right.first.chat, right.second.chat, left.second.chat],
        splitSizes: { columns: shares(ratio), left: shares(left.ratio), right: shares(right.ratio) },
      }
    if (isPane(first) && right)
      return {
        panes: [first.chat, right.first.chat, right.second.chat],
        splitSizes: { columns: shares(ratio), right: shares(right.ratio) },
      }
  }
  // The nearest layout: the panes in tree order, row by row from the top left; a fourth pane is the bottom left,
  // so it comes last in the clockwise places.
  const [a, b, c, d] = chatsOf(node)
  const panes = d === undefined ? [a, b, c] : [a, b, d, c]
  return {
    panes: panes.filter((id) => id !== undefined),
    ...(node.direction === 'column' ? { split: 'rows' as const } : {}),
  }
}

/**
 * The page's layout of a workspace's active tab (`tabs` has one): its first `maxPanes` panes in tree order placed
 * by the rule above, by local chat ID as the page's panes are, and the tab's focused chat focused when it is drawn,
 * else the first drawn chat that is not a shell (`isShell`), else the first pane.
 */
export function layoutOfTab(tabs: readonly TabLayout[], isShell: (local: string) => boolean): WorkspaceLayout {
  const tab = tabs.find((t) => t.active) ?? tabs[0]
  if (tab === undefined) return { panes: [] }
  const kept = new Set(chatsOf(tab.root).slice(0, maxPanes))
  const tree = prune(tab.root, kept)
  if (tree === undefined) return { panes: [] }
  const placed = place(tree)
  const panes = placed.panes.map((id) => splitId(id).local)
  const focused = splitId(tab.focusedChat).local
  const focusedPane = panes.includes(focused) ? focused : (panes.find((id) => !isShell(id)) ?? panes[0])
  return {
    panes,
    ...(placed.split === undefined ? {} : { split: placed.split }),
    ...(placed.splitSizes === undefined ? {} : { splitSizes: placed.splitSizes }),
    ...(focusedPane === undefined ? {} : { focusedPane }),
  }
}
