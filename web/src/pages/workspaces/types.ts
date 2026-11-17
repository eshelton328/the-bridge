// The Workspaces page's view models, display-ready, each from its Zod schema.
// The Workbench (Figma page 89:2): workspace tabs over one to four split
// panes, each a chat, a shell or an empty pane, and a status bar.
import { z } from 'zod'

export const AgentKind = z.enum(['claude', 'codex', 'shell'])
export type AgentKind = z.infer<typeof AgentKind>

const PaneStatus = z.object({
  label: z.string(),
  tone: z.enum(['working', 'needsYou', 'idle']),
})
type PaneStatus = z.infer<typeof PaneStatus>

/** One workspace tab: its name, its number of chats and whether a chat in it needs Erik. */
export const Workspace = z.object({
  id: z.string(),
  label: z.string(),
  count: z.number(),
  needsYou: z.boolean(),
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

/** An action of a pane's menu; `move` opens the list of workspaces. */
export const PaneAction = z.object({
  value: z.enum(['fork', 'sideChat', 'subtask', 'move', 'rename', 'close']),
  label: z.string(),
})
export type PaneAction = z.infer<typeof PaneAction>

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
})
export type WorkspacesUi = z.infer<typeof WorkspacesUi>

/** The schema of one Workspaces state, for the state checks. */
export const WorkspacesState = z.object({ data: WorkspacesData, ui: WorkspacesUi })
