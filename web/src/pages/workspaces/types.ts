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
  /** An agent's reply; `copy` labels its Copy button, and a reply without it has none (D3). */
  z.object({
    type: z.literal('assistant'),
    kind: AgentKind,
    name: z.string(),
    text: z.string(),
    copy: z.string().optional(),
  }),
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
  /**
   * The pane it belongs to, by id: with the split panes (D5 158:518) it opens inside that pane, over the chat's
   * right side. Not set: it shows beside the chat shown alone (D2).
   */
  pane: z.string().optional(),
  /** The label of the button that moves it into a pane of its own (D5 158:540); not set, no button. */
  openAsPane: z.string().optional(),
})
export type SideChat = z.infer<typeof SideChat>

/** One subagent or subtask of the chat (D3 105:1322): its title, status, meta line, transcript and description. */
export const Subagent = z.object({
  id: z.string(),
  title: z.string(),
  status: PaneStatus,
  /** The agent, its time and its tokens, such as "Explore agent · 0:41 · 18k tokens". */
  meta: z.string(),
  /** A line under the meta that says what it is, as a subtask has. */
  description: z.string().optional(),
  /** The last lines of its transcript, shown when the transcript is open. */
  transcript: z.array(z.string()),
})
export type Subagent = z.infer<typeof Subagent>

/** The subagents panel beside the main chat (D3 105:1312): each subagent with its transcript and Stop. */
export const SubagentsPanel = z.object({
  title: z.string(),
  closeLabel: z.string(),
  showTranscript: z.string(),
  hideTranscript: z.string(),
  /** The label of the button that stops a running subagent. */
  stop: z.string(),
  items: z.array(Subagent),
})
export type SubagentsPanel = z.infer<typeof SubagentsPanel>

/** The New chat form (D3 105:1379): the labels and the values it opens with. */
export const NewChatForm = z.object({
  title: z.string(),
  /** The field labels, as Figma writes them, in capitals. */
  labels: z.object({
    name: z.string(),
    runsIn: z.string(),
    workspace: z.string(),
    folders: z.string(),
    model: z.string(),
    message: z.string(),
  }),
  /** The random name a blank name becomes, shown as the placeholder, and the hint that says so. */
  name: z.object({ placeholder: z.string(), hint: z.string() }),
  runsIn: z.object({ options: z.array(z.object({ kind: AgentKind, label: z.string() })), value: AgentKind }),
  /** The workspace the chat starts in, by id. */
  workspace: z.string(),
  /** The folders the chat may read; the first is the workspace's own. */
  folders: z.array(z.string()),
  addFolder: z.string(),
  model: z.object({ options: z.array(z.object({ value: z.string(), label: z.string() })), value: z.string() }),
  message: z.object({ placeholder: z.string(), skills: z.string() }),
  cancel: z.string(),
  start: z.string(),
})
export type NewChatForm = z.infer<typeof NewChatForm>

/** The workspace sidebar's labels (D2 105:611). */
export const SidebarText = z.object({
  title: z.string(),
  hide: z.string(),
  newWorkspace: z.string(),
  /** The hint under a chat being dragged; {chat} and {workspace} are filled in. */
  dropHint: z.string(),
  /** The word after the main chat's context meter. */
  contextLabel: z.string(),
  /** `false`: the group headers show no count and no needs-you dot, as D4 draws them. */
  counts: z.boolean().optional(),
})
export type SidebarText = z.infer<typeof SidebarText>

/** The Figma layers of a chat pane's composer and entries, for the fidelity checks. */
const PaneChatLayers = z.object({
  composer: z.string(),
  /** The entries, in order; an entry with no layer has none. */
  entries: z.array(z.string().optional()).optional(),
})
/**
 * The Figma layer ids of a frame's parts, for the fidelity checks (`data-figma`). Each frame has its own ids; a
 * block uses D1's (split panes) or D2's (sidebar) for a part a state does not name.
 */
export const SidebarLayers = z.object({
  sidebar: z.string().optional(),
  /** The sidebar toggle: Hide in the sidebar, Show in the tab bar. */
  toggle: z.string().optional(),
  /** New chat in the tab bar (D1 150:2). */
  newChat: z.string().optional(),
  /** The split panes, by their place, clockwise from the top left (D1 105:177). */
  panes: z.array(z.string()).optional(),
  /** The chat panes of the split, in order. */
  paneChats: z.array(PaneChatLayers).optional(),
  /** The shell pane's terminal (D1 105:337) and the empty pane's list (D1 105:368). */
  shell: z.string().optional(),
  emptyList: z.string().optional(),
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
  /** The subagents panel and its cards, by subagent id (D3). */
  subagents: z.string().optional(),
  subagentCards: z.record(z.string(), z.string()).optional(),
})
export type SidebarLayers = z.infer<typeof SidebarLayers>

/** The folders of the chat shown alone (D4 128:405): the control under the prompt box and its list. */
export const ChatFolders = z.object({
  /** The name of the list, for assistive technology. */
  label: z.string(),
  /** The list's heading, in capitals, and the note at its end. */
  heading: z.string(),
  scope: z.string(),
  /** The working folder first, then the folders added since. */
  items: z.array(z.string()),
  /** The note on the working folder. */
  working: z.string(),
  /** The accessible name of a folder's remove button; {folder} is filled in. */
  remove: z.string(),
  add: z.string(),
})
export type ChatFolders = z.infer<typeof ChatFolders>

/** The folder picker beside the chat (D4 128:330): a search, the recent folders and the folders of one path. */
export const FolderPicker = z.object({
  title: z.string(),
  closeLabel: z.string(),
  note: z.string(),
  searchLabel: z.string(),
  /** What Erik has typed. */
  query: z.string(),
  recentLabel: z.string(),
  /** The recent folders; `added` ones are already folders of the chat. */
  recent: z.array(z.object({ path: z.string(), added: z.boolean() })),
  addedLabel: z.string(),
  browseLabel: z.string(),
  /** The path whose folders the picker lists, such as "~/". */
  browsePath: z.string(),
  browse: z.array(z.string()),
  /** The accessible name of the button that opens a listed folder; {folder} is filled in. */
  openLabel: z.string(),
  cancel: z.string(),
  /** The add button's label; {folder} is filled in. */
  add: z.string(),
})
export type FolderPicker = z.infer<typeof FolderPicker>

/** Where a dragged chat lands on the chat shown alone (D6 158:1025): an edge splits the view, the middle replaces. */
export const DropEdge = z.enum(['left', 'right', 'top', 'bottom', 'middle'])
export type DropEdge = z.infer<typeof DropEdge>

/** The drop zone a chat dragged from the sidebar shows over the chat shown alone (D6 158:1025). */
const PaneDrop = z.object({
  /** What the drop does, such as "Open {chat} beside {target}"; {chat} and {target} are filled in. */
  title: z.string(),
  /** The line under it, such as "splits the view into two panes". */
  text: z.string(),
  /** The hint on where to drop, in one line. */
  hint: z.string(),
})

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
  /** The subagents and subtasks of the chat shown alone (D3). */
  subagents: SubagentsPanel.optional(),
  /** The New chat form (D3). */
  newChat: NewChatForm.optional(),
  /** `false`: the chat header has no ⋯, as D4 draws it. */
  chatActions: z.boolean().optional(),
  /** The folders of the chat shown alone (D4). */
  folders: ChatFolders.optional(),
  /** The folder picker (D4). */
  folderPicker: FolderPicker.optional(),
  /** The drop zone's text while a chat is dragged onto the chat shown alone (D6). */
  paneDrop: PaneDrop.optional(),
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
  /** The side chat shows beside the main chat, or inside its pane of the split (D5). */
  sideChatOpen: z.boolean().optional(),
  /** The subagents panel shows beside the main chat, in place of the side chat (D3). */
  subagentsOpen: z.boolean().optional(),
  /** The subagents whose transcript is open. */
  transcripts: z.array(z.string()).optional(),
  /** The New chat form is open over the screen (D3). */
  newChatOpen: z.boolean().optional(),
  /** The list of the chat's folders is open over the composer (D4). */
  foldersOpen: z.boolean().optional(),
  /** The folder picker shows beside the main chat, in place of the side chat (D4). */
  folderPickerOpen: z.boolean().optional(),
  /** The folder chosen in the picker, by path. */
  pickedFolder: z.string().nullable().optional(),
  /**
   * A chat Erik drags from the sidebar onto the chat shown alone, and where it would land (D6): its row in the
   * sidebar fades and the drop zone shows over that part of the chat.
   */
  paneDrag: z.object({ chat: z.string(), edge: DropEdge }).nullable().optional(),
  /**
   * With the sidebar, the workbench (the tabs, the panes and the status bar) shows beside it in place of the chat
   * alone (D7): a chat opened from the sidebar fills the panes area.
   */
  workbench: z.boolean().optional(),
})
export type WorkspacesUi = z.infer<typeof WorkspacesUi>

/** The schema of one Workspaces state, for the state checks. */
export const WorkspacesState = z.object({ data: WorkspacesData, ui: WorkspacesUi })
