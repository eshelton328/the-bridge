// The layout of one workspace: its tabs, and in each tab the split tree of
// its panes (slice 3a). `GET /api/workspaces/:workspace/layout` returns it,
// with the workspace ID URL-encoded; the `layout.changed` live event says
// when to read it again. Each pane shows one chat (an agent session or a
// shell), named by its chat ID. Each pane's chat, shells too, is also in the
// workspace's chats in `GET /api/workspaces`, with the same ID, so the app
// opens a pane from a list row by that ID.
// The server sends every tab and the whole tree; the app picks what to draw.
import { z } from 'zod'
import { ChatId, splitId, TabId, WorkspaceId } from './ids.ts'
import { ChatSummary } from './workspaces.ts'

/** How a split places its two parts: `row` side by side, `column` one above the other. */
export const SplitDirection = z.enum(['row', 'column'])
export type SplitDirection = z.infer<typeof SplitDirection>

/** One pane: the chat it shows. */
const PaneNode = z.object({ kind: z.literal('pane'), chat: ChatId })

/**
 * A split in two: `first` is the left part of a row or the top part of a column, and `ratio` is the share
 * of `first`, more than 0 and less than 1.
 */
const SplitNode = z.object({
  kind: z.literal('split'),
  direction: SplitDirection,
  ratio: z.number().gt(0).lt(1),
  get first() {
    return LayoutNode
  },
  get second() {
    return LayoutNode
  },
})

/** A node of a tab's split tree: a pane or a split. */
export const LayoutNode: z.ZodDiscriminatedUnion<[typeof PaneNode, typeof SplitNode]> = z.discriminatedUnion('kind', [
  PaneNode,
  SplitNode,
])
export type LayoutNode = z.infer<typeof LayoutNode>

/** The chats of a tree's panes, first part before second part. */
export function chatsOf(node: LayoutNode): ChatId[] {
  return node.kind === 'pane' ? [node.chat] : [...chatsOf(node.first), ...chatsOf(node.second)]
}

/**
 * One tab: its split tree, the chat of its focused pane, and the summary of each pane's chat in tree order. A
 * pane's chat ID stays the same in each read while the pane lives.
 */
export const TabLayout = z
  .object({
    id: TabId,
    label: z.string(),
    /** The tab the workspace shows now; one tab of each workspace is active. */
    active: z.boolean(),
    root: LayoutNode,
    focusedChat: ChatId,
    /** The tab shows only its focused pane, at full size, until the zoom ends (slice W2). */
    zoomed: z.boolean(),
    /** One summary for each pane, in tree order; a shell's `model` is its program, such as "pnpm dev". */
    chats: z.array(ChatSummary),
  })
  .check((ctx) => {
    const tree = chatsOf(ctx.value.root)
    if (new Set(tree).size !== tree.length)
      ctx.issues.push({
        code: 'custom',
        message: 'a chat is in two panes of the tree',
        input: ctx.value,
        path: ['root'],
      })
    if (!tree.includes(ctx.value.focusedChat))
      ctx.issues.push({
        code: 'custom',
        message: 'the focused chat is not in the tree',
        input: ctx.value,
        path: ['focusedChat'],
      })
    if (ctx.value.chats.map((c) => c.id).join('\n') !== tree.join('\n'))
      ctx.issues.push({
        code: 'custom',
        message: 'the chats are not the panes in tree order',
        input: ctx.value,
        path: ['chats'],
      })
  })
export type TabLayout = z.infer<typeof TabLayout>

/** The response of `GET /api/workspaces/:workspace/layout`: the workspace's tabs, in its order. */
export const WorkspaceLayout = z.object({ workspace: WorkspaceId, tabs: z.array(TabLayout).min(1) }).check((ctx) => {
  if (ctx.value.tabs.filter((t) => t.active).length !== 1)
    ctx.issues.push({ code: 'custom', message: 'one tab must be active', input: ctx.value, path: ['tabs'] })
  const machine = splitId(ctx.value.workspace).machine
  const elsewhere = ctx.value.tabs
    .flatMap((t) => [t.id, ...chatsOf(t.root)])
    .filter((id) => splitId(id).machine !== machine)
  if (elsewhere.length > 0)
    ctx.issues.push({
      code: 'custom',
      message: 'a tab or chat is on another machine',
      input: ctx.value,
      path: ['tabs'],
    })
  const ids = ctx.value.tabs.map((t) => t.id)
  if (new Set(ids).size !== ids.length)
    ctx.issues.push({ code: 'custom', message: 'two tabs have one ID', input: ctx.value, path: ['tabs'] })
})
export type WorkspaceLayout = z.infer<typeof WorkspaceLayout>

/** Which part of a split: `first` (left of a row, top of a column) or `second`. */
export const SplitSide = z.enum(['first', 'second'])
export type SplitSide = z.infer<typeof SplitSide>

/** The least and the most share that a split gives its first part; herdr keeps each ratio between them. */
export const minSplitRatio = 0.1
export const maxSplitRatio = 0.9

/**
 * The body of `POST /api/chats/:chat/split`: `row` puts a new shell pane to the right of the chat's pane, `column`
 * below it, each half of the old pane (201, `SplitChatResponse`).
 */
export const SplitChatRequest = z.strictObject({ direction: SplitDirection })
export type SplitChatRequest = z.infer<typeof SplitChatRequest>

/** The answer to a split: the chat ID of the new shell pane. */
export const SplitChatResponse = z.object({ chat: ChatId })
export type SplitChatResponse = z.infer<typeof SplitChatResponse>

/**
 * The body of `POST /api/workspaces/:workspace/layout/ratio`: the split of tab `tab` at `path` (the parts from the
 * tree's root to it; empty for the root) gives its first part the share `ratio` (204). A tab or a path with no split
 * is 404.
 */
export const SetSplitRatioRequest = z.strictObject({
  tab: TabId,
  path: z.array(SplitSide).max(32),
  ratio: z.number().min(minSplitRatio).max(maxSplitRatio),
})
export type SetSplitRatioRequest = z.infer<typeof SetSplitRatioRequest>

/** The body of `POST /api/chats/:chat/focus`, which focuses the chat's pane in its tab (204): an empty object. */
export const FocusChatRequest = z.strictObject({})
export type FocusChatRequest = z.infer<typeof FocusChatRequest>

/**
 * The body of `POST /api/chats/:chat/zoom`: `zoomed` true shows only the chat's pane in its tab, at full size;
 * false ends the zoom of its tab (204). A tab of one pane is 409 `chat-not-ready` `singlePane`.
 */
export const ZoomChatRequest = z.strictObject({ zoomed: z.boolean() })
export type ZoomChatRequest = z.infer<typeof ZoomChatRequest>

/**
 * The body of `POST /api/chats/:chat/swap`: the chat whose pane takes this chat's place, and this chat's pane
 * takes its place (204). Each chat keeps its ID. A chat of another tab is 409 `chat-not-ready` `otherTab`; the
 * chat itself is 400.
 */
export const SwapChatsRequest = z.strictObject({ with: ChatId })
export type SwapChatsRequest = z.infer<typeof SwapChatsRequest>

/**
 * The body of `POST /api/chats/:chat/close`, which closes the chat's pane and so ends its agent or its shell,
 * with each command that runs in it (204). It cannot be undone, so the page asks the owner first, with the chat's
 * name, and `confirm` must be this chat's ID (400 otherwise). A chat that works is 409 `chat-not-ready`
 * `working`, one that waits for the owner `needsYou`.
 */
export const CloseChatRequest = z.strictObject({ confirm: ChatId })
export type CloseChatRequest = z.infer<typeof CloseChatRequest>
