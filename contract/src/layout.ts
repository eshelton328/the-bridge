// The layout of one workspace: its tabs, and in each tab the split tree of
// its panes (slice 3a). `GET /api/workspaces/:workspace/layout` returns it,
// with the workspace ID URL-encoded; the `layout.changed` live event says
// when to read it again. Each pane shows one chat (an agent session or a
// shell), named by its chat ID, the same ID as in `GET /api/workspaces`.
// The server sends every tab and the whole tree; the app picks what to draw.
import { z } from 'zod'
import { ChatId, TabId, WorkspaceId } from './ids.ts'
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
  const ids = ctx.value.tabs.map((t) => t.id)
  if (new Set(ids).size !== ids.length)
    ctx.issues.push({ code: 'custom', message: 'two tabs have one ID', input: ctx.value, path: ['tabs'] })
})
export type WorkspaceLayout = z.infer<typeof WorkspaceLayout>
