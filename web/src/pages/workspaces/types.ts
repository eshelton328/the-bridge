// The Workspaces page's view models, display-ready, each from its Zod schema.
// The Workbench (Figma page 89:2): workspace tabs over one to four split
// panes, each a chat, a shell or an empty pane, and a status bar.
import { z } from 'zod'

export const AgentKind = z.enum(['claude', 'codex', 'shell'])
export type AgentKind = z.infer<typeof AgentKind>

const PaneStatus = z.object({
  label: z.string(),
  tone: z.enum(['working', 'running', 'needsYou', 'idle', 'done']),
})
type PaneStatus = z.infer<typeof PaneStatus>

/** A chat in the workspace sidebar (D2 105:643): its kind, title, model, context used and status. */
export const SidebarChat = z.object({
  id: z.string(),
  kind: AgentKind,
  title: z.string(),
  /** The model, or for a shell its program, such as "shell · zsh". */
  model: z.string(),
  context: z.number().optional(),
  status: PaneStatus,
  /** 1 for a subtask's chat, indented under the chat that started it. */
  level: z.union([z.literal(0), z.literal(1)]).optional(),
})
export type SidebarChat = z.infer<typeof SidebarChat>

/** One workspace tab: its name, its number of chats and whether a chat in it needs Erik. */
export const Workspace = z.object({
  id: z.string(),
  label: z.string(),
  count: z.number(),
  needsYou: z.boolean(),
  /** Its chats, as the sidebar lists them (side chats are not listed). */
  chats: z.array(SidebarChat).optional(),
})
export type Workspace = z.infer<typeof Workspace>

/** The header of a pane: kind mark, title, model, context used and status. */
export const PaneHead = z.object({
  kind: AgentKind,
  title: z.string(),
  /** The model, or for a shell its program, such as "shell · zsh". */
  model: z.string(),
  /** The share of the context window in use; a shell has none. */
  context: z.number().optional(),
  status: PaneStatus,
})
export type PaneHead = z.infer<typeof PaneHead>

/** One entry of a chat's transcript, a union on `type`. */
export const ChatEntry = z.discriminatedUnion('type', [
  z.object({ type: z.literal('user'), text: z.string() }),
  z.object({ type: z.literal('tool'), name: z.string(), target: z.string() }),
  z.object({ type: z.literal('assistant'), kind: AgentKind, name: z.string(), text: z.string(), copy: z.string() }),
  /** Lines of an agent's progress, in mono. */
  z.object({ type: z.literal('progress'), lines: z.array(z.string()) }),
  /** A command the agent asks to run. */
  z.object({
    type: z.literal('approval'),
    label: z.string(),
    title: z.string(),
    command: z.string(),
    actions: z.array(z.string()),
  }),
])
export type ChatEntry = z.infer<typeof ChatEntry>

export const ComposerState = z.object({
  placeholder: z.string(),
  text: z.string(),
  attachments: z.array(z.string()),
  /** The model chip; a composer without one shows none. */
  model: z.string().optional(),
  /** The chat is working: the composer shows Stop. */
  running: z.boolean(),
})
export type ComposerState = z.infer<typeof ComposerState>

/** The color of a shell line: plain, modified, deleted or untracked. */
export const ShellLine = z.object({ text: z.string(), tone: z.enum(['plain', 'modified', 'deleted', 'untracked']) })
export type ShellLine = z.infer<typeof ShellLine>

/** A chat that an empty pane can open. */
export const OpenableChat = z.object({
  kind: AgentKind,
  title: z.string(),
  model: z.string(),
  context: z.number(),
  status: PaneStatus,
})
export type OpenableChat = z.infer<typeof OpenableChat>

/** One pane of the split, a union on `type`. */
export const WorkbenchPane = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('chat'),
    id: z.string(),
    head: PaneHead,
    entries: z.array(ChatEntry),
    composer: ComposerState,
  }),
  z.object({ type: z.literal('shell'), id: z.string(), head: PaneHead, lines: z.array(ShellLine), prompt: z.string() }),
  z.object({
    type: z.literal('empty'),
    id: z.string(),
    title: z.string(),
    text: z.string(),
    start: z.array(z.object({ kind: AgentKind, label: z.string() })),
    openLabel: z.string(),
    open: z.array(OpenableChat),
  }),
])
export type WorkbenchPane = z.infer<typeof WorkbenchPane>

/** An action of a pane's or a chat's menu; `move` opens the list of workspaces. */
export const PaneAction = z.object({
  value: z.enum(['newChat', 'fork', 'sideChat', 'subtask', 'subagents', 'folders', 'move', 'rename', 'close']),
  label: z.string(),
})
export type PaneAction = z.infer<typeof PaneAction>

/** The side chat beside the main chat (D2 105:920): a quick question that never enters it. */
export const SideChat = z.object({
  title: z.string(),
  /** The command that opens it, such as "/btw". */
  command: z.string(),
  note: z.string(),
  closeLabel: z.string(),
  entries: z.array(ChatEntry),
  composer: ComposerState,
})
export type SideChat = z.infer<typeof SideChat>

/** The workspace sidebar's labels (D2 105:611). */
export const SidebarText = z.object({
  title: z.string(),
  hide: z.string(),
  newWorkspace: z.string(),
  /** The hint under a chat being dragged; {chat} and {workspace} are filled in. */
  dropHint: z.string(),
  /** The word after the main chat's context meter. */
  contextLabel: z.string(),
})
export type SidebarText = z.infer<typeof SidebarText>

/**
 * The Figma layer ids of a sidebar frame's parts, for the fidelity checks (`data-figma`). Each frame has its own
 * ids; a block uses D2's for a part a state does not name.
 */
export const SidebarLayers = z.object({
  sidebar: z.string().optional(),
  toggle: z.string().optional(),
  newWorkspace: z.string().optional(),
  /** The group headers, by workspace id. */
  headers: z.record(z.string(), z.string()).optional(),
  /** The chat rows, by chat id. */
  rows: z.record(z.string(), z.string()).optional(),
  mainChat: z.string().optional(),
  chatHead: z.string().optional(),
  chatActions: z.string().optional(),
  /** The chat actions menu, when it is open. */
  chatMenu: z.string().optional(),
  composer: z.string().optional(),
  /** The main chat's entries, in order; an entry with no layer has none. */
  entries: z.array(z.string().optional()).optional(),
  sideChat: z.string().optional(),
  sideNote: z.string().optional(),
  sideComposer: z.string().optional(),
  sideEntries: z.array(z.string().optional()).optional(),
})
export type SidebarLayers = z.infer<typeof SidebarLayers>

export const Skill = z.object({ name: z.string(), description: z.string() })
export type Skill = z.infer<typeof Skill>

export const WorkspacesData = z.object({
  /** The number of Inbox items that need Erik, on the rail. */
  railBadge: z.number(),
  workspaces: z.array(Workspace),
  /** The workspace shown. */
  current: z.string(),
  /** The current workspace's panes, clockwise from the top left. */
  panes: z.array(WorkbenchPane),
  status: z.object({ summary: z.string(), hints: z.array(z.string()), alert: z.string() }),
  /** A pane menu's actions, with a separator before `move`. */
  paneMenu: z.array(PaneAction),
  /** The last row of Move to workspace. */
  newWorkspace: z.string(),
  /** What typing / in a composer lists. */
  skillsLabel: z.string(),
  skills: z.array(Skill),
  /** The sidebar's labels; a state without them has no sidebar. */
  sidebar: SidebarText.optional(),
  /** The side chat of the current chat, when one is open. */
  sideChat: SideChat.optional(),
  /** The actions behind the ⋯ of the chat shown alone (D2b), with a separator before `subagents`. */
  chatMenu: z.array(PaneAction).optional(),
  /** The Figma layers of the sidebar frame's parts; D2's when not set. */
  layers: SidebarLayers.optional(),
})
export type WorkspacesData = z.infer<typeof WorkspacesData>

/** The view state a Figma frame shows. */
export const WorkspacesUi = z.object({
  /** The pane keyboard shortcuts act on; it has the cyan border. */
  focusedPane: z.string(),
  /** The pane whose menu is open, or null. */
  menuFor: z.string().nullable(),
  /** Move to workspace's list is open in that menu. */
  moveOpen: z.boolean(),
  /** The workspace highlighted in that list. */
  moveTarget: z.string().nullable(),
  /** The pane whose composer lists the skills, or null. */
  skillsFor: z.string().nullable(),
  /** The highlighted skill. */
  skill: z.string().nullable(),
  /** The sidebar shows in place of the tabs, with the focused pane's chat alone beside it. */
  sidebar: z.boolean().optional(),
  /** The workspaces whose chats the sidebar hides. */
  collapsed: z.array(z.string()).optional(),
  /** The workspace under the pointer: its header shows rename and close. */
  hovered: z.string().nullable().optional(),
  /** A chat Erik drags onto another workspace. */
  drag: z.object({ chat: z.string(), over: z.string() }).nullable().optional(),
  /** The side chat shows beside the main chat. */
  sideChatOpen: z.boolean().optional(),
})
export type WorkspacesUi = z.infer<typeof WorkspacesUi>

/** The schema of one Workspaces state, for the state checks. */
export const WorkspacesState = z.object({ data: WorkspacesData, ui: WorkspacesUi })
