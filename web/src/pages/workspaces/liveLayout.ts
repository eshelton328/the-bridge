// A workspace's herdr layout (slice 3a) as the page's own layout: the active
// tab's split tree drawn by the page's splits, with the tab's focused chat
// as the focused pane. The page draws at most `maxPanes` panes. The rule
// for which panes of a larger tree it draws (the focused-pane rule): the
// focused pane and its nearest neighbours in tree order, the two panes
// before it and the one after it, moved back or forward so four panes
// are drawn when the tree has them. With the focus on one of the first
// three panes, those are the tree's first four panes. A split that loses
// a part gives its place to the other part. The chats of the other panes
// stay sidebar rows. Inactive tabs are not drawn.
//
// The rule, from the tree that is left:
// - one pane fills the space;
// - `row(a, b)` puts a and b side by side (the columns-first split), and
//   `column(a, b)` puts a over b (`stack`), each sized by its share of the
//   whole tree;
// - `column(row(a, b), row(c, d))` is the rows-first 2×2 (`rows`), and
//   `column(row(a, b), c)` its three-pane form; `row(column(a, c),
//   column(b, d))` is the columns-first 2×2, and `row(a, column(b, c))` its
//   three-pane form.
// - A tree of `column` splits only puts its panes one above the other
//   (`stack`).
// - Any other tree takes the nearest layout: the rows-first split when its
//   root is a `column`, else the columns-first split, its panes in tree
//   order from the top left, row by row, with equal shares.
// A pane's share of the whole tree is its height (in a column) or width
// (in a row) in herdr's full tab. The drawn panes' shares are scaled to
// fill the space and keep their relative sizes: herdr's ratios in a tall
// column give each pane a small part of the tab, and a subset of it would
// otherwise keep a few panes at that small part. A handle's sizes are in
// percent, rounded to 0.01. The page keeps each stacked pane at least as
// high as its header and composer (`blocks/paneFloors.ts`).
import { chatsOf, type ChatId, type LayoutNode, splitId, type TabLayout } from '@bridge/contract'
import { maxPanes } from './blocks/workspaceLayout.ts'
import type { LiveTab, SplitSizes, WorkspaceLayout } from './types.ts'

/** The tree with only the panes of `kept`; a split that loses a part becomes its other part. */
function prune(node: LayoutNode, kept: ReadonlySet<ChatId>): LayoutNode | undefined {
  if (node.kind === 'pane') return kept.has(node.chat) ? node : undefined
  const first = prune(node.first, kept)
  const second = prune(node.second, kept)
  if (first === undefined) return second
  if (second === undefined) return first
  return { ...node, first, second }
}

/** Every split of `node` is a `column`. */
const onlyColumns = (node: LayoutNode): boolean =>
  node.kind === 'pane' || (node.direction === 'column' && onlyColumns(node.first) && onlyColumns(node.second))

/** Each pane's share of `node` along `axis`, by chat ID: its height for `column`, its width for `row`. */
function extents(node: LayoutNode, axis: Split['direction'], share = 1, into = new Map<ChatId, number>()) {
  if (node.kind === 'pane') return into.set(node.chat, share)
  const split = node.direction === axis
  extents(node.first, axis, split ? share * node.ratio : share, into)
  extents(node.second, axis, split ? share * (1 - node.ratio) : share, into)
  return into
}

/** The shares of `chats` along `axis` in the whole tree, scaled to make 100. */
function scaled(whole: LayoutNode, chats: readonly ChatId[], axis: Split['direction']): number[] {
  const of = extents(whole, axis)
  const parts = chats.map((chat) => of.get(chat) ?? 0)
  const sum = parts.reduce((total, part) => total + part, 0)
  return summed(parts.map((part) => (sum === 0 ? 100 / parts.length : (part / sum) * 100)))
}

/** `shares` rounded to 0.01, the last one taking what makes 100. */
function summed(shares: readonly number[]): number[] {
  const rounded = shares.slice(0, -1).map((s) => Math.round(s * 100) / 100)
  return [...rounded, Math.round((100 - rounded.reduce((sum, s) => sum + s, 0)) * 100) / 100]
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

/** The page's layout of `node`, what is left of `whole` once the panes past four are gone. */
function place(node: LayoutNode, whole: LayoutNode): Placed {
  if (node.kind === 'pane') return { panes: [node.chat] }
  const { first, second } = node
  /** The handle of `a` and `b` along `axis`: their shares of the whole tree, scaled to make 100. */
  const handle = (a: Pane, b: Pane, axis: Split['direction']) => scaled(whole, [a.chat, b.chat], axis)
  if (isPane(first) && isPane(second)) {
    const panes = [first.chat, second.chat]
    return node.direction === 'row'
      ? { panes, splitSizes: { columns: scaled(whole, panes, 'row') } }
      : { panes, split: 'stack', splitSizes: { rows: scaled(whole, panes, 'column') } }
  }
  if (node.direction === 'column') {
    const top = pairIn(first, 'row')
    const bottom = pairIn(second, 'row')
    // The rows-first split's places run clockwise: the bottom row's right pane before its left one.
    if (top && bottom)
      return {
        panes: [top.first.chat, top.second.chat, bottom.second.chat, bottom.first.chat],
        split: 'rows',
        splitSizes: {
          rows: handle(top.first, bottom.first, 'column'),
          top: handle(top.first, top.second, 'row'),
          bottom: handle(bottom.first, bottom.second, 'row'),
        },
      }
    if (top && isPane(second))
      return {
        panes: [top.first.chat, top.second.chat, second.chat],
        split: 'rows',
        splitSizes: { rows: handle(top.first, second, 'column'), top: handle(top.first, top.second, 'row') },
      }
  } else {
    const left = pairIn(first, 'column')
    const right = pairIn(second, 'column')
    // The columns-first split's places run clockwise too: the left column's bottom pane is the last.
    if (left && right)
      return {
        panes: [left.first.chat, right.first.chat, right.second.chat, left.second.chat],
        splitSizes: {
          columns: handle(left.first, right.first, 'row'),
          left: handle(left.first, left.second, 'column'),
          right: handle(right.first, right.second, 'column'),
        },
      }
    if (isPane(first) && right)
      return {
        panes: [first.chat, right.first.chat, right.second.chat],
        splitSizes: { columns: handle(first, right.first, 'row'), right: handle(right.first, right.second, 'column') },
      }
  }
  if (onlyColumns(node)) {
    const panes = chatsOf(node)
    return { panes, split: 'stack', splitSizes: { rows: scaled(whole, panes, 'column') } }
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

/** The chats of `order` the page draws: all of them up to `maxPanes`, else the focused-pane rule's window. */
function drawnChats(order: readonly ChatId[], focused: ChatId): ChatId[] {
  if (order.length <= maxPanes) return [...order]
  const at = Math.max(order.indexOf(focused), 0)
  const start = Math.min(Math.max(at - 2, 0), order.length - maxPanes)
  return order.slice(start, start + maxPanes)
}

/**
 * The page's layout of a workspace's active tab (`tabs` has one): the panes the focused-pane rule draws, placed by the
 * rule above, by local chat ID as the page's panes are, with the tab's focused chat focused. The contract has the
 * focused chat in the tree, so it is always drawn.
 */
export function layoutOfTab(tabs: readonly TabLayout[]): WorkspaceLayout {
  const tab = tabs.find((t) => t.active) ?? tabs[0]
  return tab === undefined ? { panes: [] } : layoutOfTree(tab.root, tab.focusedChat)
}

/**
 * The page's layout of a tab that the workbench follows a moved chat to (W2d, `useLayoutWrites.ts`): its tree drawn as
 * the active tab's is, with `chat` (a local chat ID) as the focused pane, so the focused-pane rule draws it. None when
 * the tab has no tree or does not hold the chat.
 */
export function layoutOfLiveTab(tab: LiveTab, chat: string): WorkspaceLayout | undefined {
  const focused = tab.root === undefined ? undefined : chatsOf(tab.root).find((id) => splitId(id).local === chat)
  return tab.root === undefined || focused === undefined ? undefined : layoutOfTree(tab.root, focused)
}

/** The page's layout of the split tree `root`, with `focusedChat` focused. */
function layoutOfTree(root: LayoutNode, focusedChat: ChatId): WorkspaceLayout {
  const kept = new Set(drawnChats(chatsOf(root), focusedChat))
  const tree = prune(root, kept)
  if (tree === undefined) return { panes: [] }
  const placed = place(tree, root)
  const panes = placed.panes.map((id) => splitId(id).local)
  const focused = splitId(focusedChat).local
  return {
    panes,
    ...(placed.split === undefined ? {} : { split: placed.split }),
    ...(placed.splitSizes === undefined ? {} : { splitSizes: placed.splitSizes }),
    focusedPane: focused,
  }
}

/**
 * Each of the workspace's tabs as the layout writes see it (slice W2): its ID, herdr label and split tree, its panes' chats in tree
 * order, by local chat ID, the focused chat and whether herdr zooms it. The page draws only the active tab, and only its focused pane while it
 * is zoomed (`blocks/workspaceLayout.ts`, `shownView`).
 */
export const liveTabsOf = (tabs: readonly TabLayout[]): LiveTab[] =>
  tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    root: tab.root,
    active: tab.active,
    chats: chatsOf(tab.root).map((id) => splitId(id).local),
    focused: splitId(tab.focusedChat).local,
    zoomed: tab.zoomed,
  }))
