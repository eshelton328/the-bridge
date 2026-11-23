// The Workspaces page's view models, display-ready, each from its Zod schema.
// The Workbench (Figma page 89:2): workspace tabs over one to four split
// panes, each a chat, a shell or an empty pane, and a status bar.
import { ChatEffort, LayoutNode, ModelAlias, NoteKind, TabId, ToolKind } from '@bridge/contract'
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
  /** `true`: the row shows no status, as M2 draws drift check (105:2556). */
  hideStatus: z.boolean().optional(),
  /** 1 for a subtask's or a fork's chat, indented under the chat that started it. */
  level: z.union([z.literal(0), z.literal(1)]).optional(),
  /**
   * What the chat is to the chat above it, drawn before its kind mark: `fork`, the branch mark of a fork (D16).
   * `label` names the mark for assistive technology.
   */
  mark: z.object({ kind: z.enum(['fork']), label: z.string() }).optional(),
  /** A live Claude chat's effort, such as "high effort" (W5); its pane's header shows it after the model. */
  effort: z.string().optional(),
  /** A live Claude chat's effort as the server lists it (W10): its header's effort picker checks it. */
  effortLevel: ChatEffort.optional(),
  /** A live Claude chat's model family as the server lists it (W10, `modelId`): its header's model picker checks it. */
  modelId: ModelAlias.optional(),
  /**
   * A live chat's pane (W5): opaque, and stable for the pane's life. When the chat's ID leaves the list and a chat on
   * the same pane comes, as after /clear, the page moves what it keeps by chat ID to the new one (`paneFollow.ts`).
   */
  pane: z.string().optional(),
})
export type SidebarChat = z.infer<typeof SidebarChat>

/** One workspace tab: its name, its number of chats and whether a chat in it needs the owner. */
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
  /** Where the chat came from, after its workspace in the header, such as "forked from bridge themes" (D16). */
  origin: z.string().optional(),
  /** The effort after the model, such as "high effort", as Figma draws "Sonnet 5.5 · high effort"; none when not set. */
  effort: z.string().optional(),
  /** A live Claude chat's effort level as the server lists it (W10), for the header's effort picker; none when unknown. */
  effortLevel: ChatEffort.optional(),
  /** A live Claude chat's model family as the server lists it (W10), for the header's model picker; none when unknown. */
  modelId: ModelAlias.optional(),
  /**
   * `true`: the model chip is text and opens no menu, as a live chat's model is (d-101, W5). A live Claude chat's
   * header chip has its own menu instead (W10, `ChatHead.effortPicker`): its model by restart, its effort by key.
   */
  readOnlyModel: z.boolean().optional(),
})
export type PaneHead = z.infer<typeof PaneHead>

/** One entry of a chat's transcript, a union on `type`. */
export const ChatEntry = z.discriminatedUnion('type', [
  /**
   * The owner's message; `cut` is the line under text the server cut, such as "Cut — full text not live yet".
   * `files` names the files sent with it, drawn as chips above the text; a message of files alone has text ''.
   */
  z.object({
    type: z.literal('user'),
    text: z.string(),
    cut: z.string().optional(),
    files: z.array(z.string()).optional(),
  }),
  /**
   * A tool call; `running` draws its dot in the running colour, as the call still runs (M12 147:383). A live call
   * has its `kind`, a readable `title` and the call's own one-line `label` (R32, backend #371): it draws its kind's
   * icon, the title and the label, and a run of them draws as one group row. Without `kind` it draws as before.
   */
  z.object({
    type: z.literal('tool'),
    /** A live call's entry ID from the server, which keys its group while older entries drop off the front. */
    id: z.string().optional(),
    name: z.string(),
    target: z.string(),
    running: z.boolean().optional(),
    kind: ToolKind.optional(),
    title: z.string().optional(),
    label: z.string().optional(),
  }),
  /** An agent's reply; `copy` labels its Copy button, and a reply without it has none (D3). `cut` as for `user`. */
  z.object({
    type: z.literal('assistant'),
    kind: AgentKind,
    name: z.string(),
    text: z.string(),
    copy: z.string().optional(),
    cut: z.string().optional(),
  }),
  /**
   * A line that records what happened to the chat, such as where a fork starts (D16 417:718): a done dot and the
   * text in mono, as a tool line. `label` names the dot for assistive technology.
   */
  z.object({ type: z.literal('event'), label: z.string(), text: z.string() }),
  /**
   * A harness note the chat got, never a prompt of the owner's (R46): a background task's report, a peer's message
   * or a Stop hook. It draws as a small muted line with its kind's icon and no bubble. `label` names the icon.
   */
  z.object({ type: z.literal('note'), kind: NoteKind, label: z.string(), text: z.string() }),
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
  /**
   * A live chat (d-117) that cannot send yet: the composer is disabled and shows this text, such as "Sending not live
   * yet", in place of its placeholder, and sends nothing; none when not set.
   */
  notLive: z.string().optional(),
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
    /** A live chat (d-117): the text in place of its transcript, such as "Transcript not live yet"; none when not set. */
    notLive: z.string().optional(),
    /**
     * A live chat (slice 3b): its server chat ID, such as "mac-mini/c1". While the pane shows, the page reads its
     * transcript into `entries` (liveTranscript.ts); a fixture's chat has none.
     */
    liveChat: z.string().optional(),
    /**
     * A live Claude chat (W5): `true` while it takes /compact and /clear (idle or done), `false` while it does not (any
     * other status); a chat with none set has no commands.
     */
    takesCommands: z.boolean().optional(),
    /** The line over the entries when the transcript has older entries than it shows, such as "Earlier entries not live yet". */
    earlier: z.string().optional(),
    /** The line in place of the entries when a read transcript has none, such as "No messages yet". */
    empty: z.string().optional(),
    /**
     * The line under the entries, with Retry, when the transcript's read or its updates failed, such as "Transcript not
     * live — unreachable"; none when not set.
     */
    problem: z.string().optional(),
  }),
  z.object({
    type: z.literal('shell'),
    id: z.string(),
    head: PaneHead,
    lines: z.array(ShellLine),
    prompt: z.string(),
    /** A live shell (d-117): the text in place of its terminal, such as "Terminal not live yet"; none when not set. */
    notLive: z.string().optional(),
  }),
  z.object({
    type: z.literal('empty'),
    id: z.string(),
    title: z.string(),
    text: z.string(),
    start: z.array(z.object({ kind: AgentKind, label: z.string() })),
    openLabel: z.string(),
    open: z.array(OpenableChat),
    /** Close pane and its shortcut at the pane's top end (D13), which remove the pane; none when not set. */
    close: z.object({ label: z.string(), shortcut: z.string() }).optional(),
  }),
])
export type WorkbenchPane = z.infer<typeof WorkbenchPane>

/**
 * One herdr tab of a live workspace (slice W2), from its layout read: whether it is the tab the workspace shows, its
 * panes' chats by local id in tree order, the chat herdr focuses and whether herdr zooms that pane. The page draws only
 * the active tab; a zoomed tab draws only its focused pane. Its server ID and split tree (server chat IDs) are what a
 * dragged handle's ratio write names (W2c, `blocks/splitRatio.ts`). Its herdr label names it in Move to tab… (W2d).
 */
export const LiveTab = z.object({
  id: TabId.optional(),
  label: z.string().optional(),
  root: LayoutNode.optional(),
  /** Herdr's own active flag when the page shows another tab of the workspace (`shownTabs.ts`), which is `active`. */
  herdrActive: z.boolean().optional(),
  active: z.boolean(),
  chats: z.array(z.string()),
  focused: z.string(),
  zoomed: z.boolean(),
})
export type LiveTab = z.infer<typeof LiveTab>

/** An action of a pane's or a chat's menu; `move` opens the list of workspaces. */
export const PaneAction = z.object({
  value: z.enum([
    'newChat',
    'fork',
    'sideChat',
    'subtask',
    'subagents',
    'folders',
    'move',
    'rename',
    'close',
    'compact',
    'clear',
    'focus',
    'zoom',
    'unzoom',
    'swap',
    'splitRight',
    'splitDown',
    'moveTab',
  ]),
  label: z.string(),
  /** `true`: the row shows and cannot be picked, such as /compact while the chat works (W5). */
  disabled: z.boolean().optional(),
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
  /**
   * Its full transcript on the phone (M12 147:367), which the card's chevron opens: the task the chat gave it and
   * what it has done since, its tool calls and its messages.
   */
  full: z.object({ task: z.string(), entries: z.array(ChatEntry) }).optional(),
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
  /**
   * The word after the number of running subagents on the phone, such as "running" in "3 · 2 running" (M6 105:3185);
   * without it, the phone shows the count alone.
   */
  running: z.string().optional(),
  /**
   * The accessible name of each card's chevron, before the subagent's title, such as "Open the transcript of" (M6
   * 147:15). The chevron opens the full transcript (M12); without it, the cards have none.
   */
  openTranscript: z.string().optional(),
  /**
   * The words before the chat's name at the end of the count line, such as "started from" in "3 · 2 running · started
   * from bridge themes" (T3 105:2029); without them, the count line ends with the running subagents.
   */
  startedFrom: z.string().optional(),
  /** The label of the button under the cards that starts a subtask, such as "Start a subtask" (T3 105:2087). */
  startSubtask: z.string().optional(),
  /**
   * The labels of a subagent's full transcript on the phone (M12): the trail's name for assistive technology, the
   * label over the task, such as "Task from {chat}", and the note at the foot, such as "Read-only: the result
   * returns to {chat} when it finishes"; {chat} is the chat the subagent works for.
   */
  fullTranscript: z.object({ trail: z.string(), taskFrom: z.string(), readOnly: z.string() }).optional(),
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
  /**
   * The random name a blank name becomes, shown as the placeholder, and the hint that says so; `value` is the name
   * the owner has typed (M11 147:212), which hides the hint.
   */
  name: z.object({ placeholder: z.string(), hint: z.string(), value: z.string().optional() }),
  /** The field with the focus when the form opens: the first message unless set, the name in M11 (147:211). */
  focus: z.enum(['name', 'message']).optional(),
  /** A live form (W3) turns off what the server cannot start yet (Codex until W8, a shell). */
  runsIn: z.object({
    options: z.array(z.object({ kind: AgentKind, label: z.string(), disabled: z.boolean().optional() })),
    value: AgentKind,
  }),
  /** The workspace the chat starts in, by id. */
  workspace: z.string(),
  /** The folders the chat may read; the first is the workspace's own. None in a live form, which hides the field (W3). */
  folders: z.array(z.string()),
  addFolder: z.string(),
  /**
   * On the phone, the folders as one field-high box in place of the chips (M11 148:82): `{first}` is the first
   * folder and `{more}` the number of the others, such as "~/omni-brain  +1". Without it, the chips.
   */
  foldersBox: z.string().optional(),
  /** The models; `short` names a model in the summary, such as "Sonnet 5.5" for "Sonnet 5.5 · high effort". */
  model: z.object({
    options: z.array(z.object({ value: z.string(), label: z.string(), short: z.string().optional() })),
    value: z.string(),
  }),
  message: z.object({ placeholder: z.string(), skills: z.string() }),
  cancel: z.string(),
  start: z.string(),
  /**
   * The line over Start chat on the phone (M7 147:9) that sums up the choices: `{workspace}`, `{model}` and
   * `{folders}` (the number of folders) are filled in. Without it, there is no line.
   */
  summary: z.string().optional(),
  /**
   * A live form's words (W3): Start chat's label while the start runs, the hint of the workspace field for a new tab
   * and for a pane beside a chat (`{chat}`).
   */
  live: z.object({ starting: z.string(), newTab: z.string(), beside: z.string() }).optional(),
})
export type NewChatForm = z.infer<typeof NewChatForm>

/**
 * The Figma layers of the New chat form on the phone (M7 105:3248), for the fidelity checks: the header (105:3273)
 * with Cancel and the title, the scrolling fields (105:3282), each field and its box, the Runs in choices by kind,
 * the folder chips in order and Add folder, and the start bar (147:8) with its summary and Start chat.
 */
export const NewChatLayers = z.object({
  header: z.string(),
  cancel: z.string(),
  title: z.string(),
  /** M11 (147:174) shows the fields above the keyboard alone, so the model and the first message have no layer. */
  fields: z.object({
    name: z.string(),
    runsIn: z.string(),
    workspace: z.string(),
    folders: z.string(),
    model: z.string().optional(),
    message: z.string().optional(),
  }),
  /** `folders` is the box of `foldersBox` (M11 148:82). */
  boxes: z.object({
    name: z.string(),
    workspace: z.string(),
    folders: z.string().optional(),
    model: z.string().optional(),
    message: z.string().optional(),
  }),
  runsIn: z.partialRecord(AgentKind, z.string()),
  folders: z.array(z.string()),
  addFolder: z.string().optional(),
  startBar: z.string(),
  /** M11 has no summary: it hides while the keyboard is up. */
  summary: z.string().optional(),
  start: z.string(),
})
export type NewChatLayers = z.infer<typeof NewChatLayers>

/** The New chat dialog's layers in a frame other than D3, whose ids `NewChatDialog` keeps as its defaults (T7). */
export const NewChatDialogLayers = z.object({
  dialog: z.string(),
  fields: z.object({
    name: z.string(),
    runsIn: z.string(),
    workspace: z.string(),
    folders: z.string(),
    model: z.string(),
    message: z.string(),
  }),
  /** D3 names no box for the name. */
  boxes: z.object({ name: z.string().optional(), workspace: z.string(), model: z.string(), message: z.string() }),
  runsIn: z.record(AgentKind, z.string()),
  folders: z.array(z.string()),
  addFolder: z.string(),
  cancel: z.string(),
  start: z.string(),
})
export type NewChatDialogLayers = z.infer<typeof NewChatDialogLayers>

/**
 * The Fork form (D15 417:305): the copy's name and how much of the chat it copies. `{chat}` in `title` and
 * `name.value` is the forked chat's title.
 */
export const ForkForm = z.object({
  title: z.string(),
  /** The field labels, as Figma writes them, in capitals. */
  labels: z.object({ name: z.string(), startFrom: z.string() }),
  /** The name the copy gets, which the owner can change, and the hint inside the field; the phone's has none (M18). */
  name: z.object({ value: z.string(), hint: z.string().optional() }),
  /** Where the copy starts: the whole chat, or up to a message the owner picks next. */
  startFrom: z.object({ options: z.array(z.object({ value: z.string(), label: z.string() })), value: z.string() }),
  /** The line under the choice that says what the fork copies. */
  note: z.string(),
  cancel: z.string(),
  submit: z.string(),
})
export type ForkForm = z.infer<typeof ForkForm>

/** The Fork dialog's layers in a frame other than D15, whose ids `ForkDialog` keeps as its defaults (T8). */
export const ForkDialogLayers = z.object({
  dialog: z.string(),
  name: z.string(),
  startFrom: z.string(),
  /** The start-from choices, in order. */
  choices: z.array(z.string()),
  note: z.string(),
  cancel: z.string(),
  submit: z.string(),
})
export type ForkDialogLayers = z.infer<typeof ForkDialogLayers>

/**
 * The Subtask form (D17 417:1026): what the subagent should do and which model runs it. The subtask gets the chat's
 * full context and returns its result to the chat.
 */
export const SubtaskForm = z.object({
  title: z.string(),
  /** The field labels, as Figma writes them, in capitals. */
  labels: z.object({ model: z.string(), task: z.string() }),
  model: z.object({ options: z.array(z.object({ value: z.string(), label: z.string() })), value: z.string() }),
  /** The task as the form opens with it, and the placeholder of an empty task. */
  task: z.object({ value: z.string(), placeholder: z.string().optional() }),
  /** The line under the task that says what the subtask gets and where its result goes. */
  note: z.string(),
  cancel: z.string(),
  submit: z.string(),
})
export type SubtaskForm = z.infer<typeof SubtaskForm>

/** The Subtask dialog's layers in a frame other than D17, whose ids `SubtaskDialog` keeps as its defaults (T10). */
export const SubtaskDialogLayers = z.object({
  dialog: z.string(),
  model: z.string(),
  modelBox: z.string(),
  task: z.string(),
  taskBox: z.string(),
  note: z.string(),
  cancel: z.string(),
  submit: z.string(),
})
export type SubtaskDialogLayers = z.infer<typeof SubtaskDialogLayers>

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
  /** `false`: the group headers have no drag handle, as D3 and D4 draw them. */
  grip: z.boolean().optional(),
})
export type SidebarText = z.infer<typeof SidebarText>

/**
 * The dialog that asks before a workspace closes (M13 208:765): Cancel, Close, and each workspace's title and text,
 * by workspace id. "{workspace}" in the title or text is the workspace's current name, so a renamed workspace is
 * asked about by its new name. × on a workspace without text here draws only.
 */
export const CloseWorkspaceText = z.object({
  cancel: z.string(),
  close: z.string(),
  workspaces: z.record(z.string(), z.object({ title: z.string(), text: z.string() })),
  /**
   * The live page's dialog, for any workspace (backend #427): the title, and the text over the list of its chats for
   * one chat and for more, "{count}" in `many` being their number. The dialog then lists each chat that ends.
   */
  listed: z.object({ title: z.string(), one: z.string(), many: z.string() }).optional(),
})
export type CloseWorkspaceText = z.infer<typeof CloseWorkspaceText>

/**
 * The phone's labels (M1 105:2302): the page title, Edit and the accessible name of +, which opens New chat or New
 * workspace. A state without them draws the desktop layout at a phone's width.
 */
export const PhoneText = z.object({
  title: z.string(),
  /** Edit (M1 105:2333); without it the list has no Edit, as on the live page, where no edit can be saved (R41). */
  edit: z.string().optional(),
  add: z.string(),
  /** The button that ends edit mode (M2 105:2508); without it, Edit does not start edit mode. */
  done: z.string().optional(),
  /** The accessible name of the back button over a chat (M3 105:2750), which returns to the list. */
  back: z.string().optional(),
  /**
   * The chat actions sheet behind the ⋯ of a chat on the phone (M4 105:2925), in order, with a rule before none: Fork
   * to Close chat. `move` opens the workspaces under its row. Without it, the ⋯ draws only.
   */
  chatMenu: z.array(PaneAction).optional(),
  /**
   * The actions sheet of a chat in the phone's list (M9 146:273), in order: what holding the row or its ⋯ opens,
   * Rename first. Without it, a hold does nothing and the row's ⋯ draws only.
   */
  rowMenu: z.array(PaneAction).optional(),
  /** The dialog that × on a workspace in edit mode opens (M13). Without it, × draws only. */
  closeWorkspace: CloseWorkspaceText.optional(),
  /**
   * The actions sheet of a workspace in the phone's list (M14 208:235), in order: what the ⋯ of its header opens.
   * "{workspace}" in a label is the workspace's name ("New chat in {workspace}"). `close` asks first with
   * `closeWorkspace` (M13). Without it, the header's ⋯ draws only.
   */
  workspaceMenu: z.array(PaneAction).optional(),
  /**
   * The menu that + at the top of the phone's list opens (M15 208:515): New chat, which opens New chat (M7) in the
   * current workspace, and New workspace, which adds a workspace named `untitled` and opens its name as a field in
   * edit mode. Without it, + draws only.
   */
  /** The live page (W3) names New chat alone: New workspace waits for W4. */
  addMenu: z
    .object({ newChat: z.string(), newWorkspace: z.string().optional(), untitled: z.string().optional() })
    .optional(),
  /**
   * Move to… in edit mode (T1 105:1594): the button that takes the place of the status of each chat in `chats`. With
   * `rowMenu`, it opens the chat's actions with Move to workspace's list open; without it, it draws only.
   */
  moveTo: z.object({ label: z.string(), chats: z.array(z.string()) }).optional(),
})
export type PhoneText = z.infer<typeof PhoneText>

/**
 * The Figma layers of the folders sheet on the phone (M8 128:704), for the fidelity checks: the header's chip
 * (128:695), the folder rows in order and Add folder, the rule over the picker, the picker's title row, search and
 * rows, and its Add button.
 */
export const PhoneFoldersLayers = z.object({
  chip: z.string(),
  /** The tablet's title row, Folders with the chat's name and × (T5 128:540). */
  title: z.string().optional(),
  rows: z.array(z.string()),
  add: z.string(),
  rule: z.string(),
  pickerTitle: z.string(),
  search: z.string(),
  recent: z.array(z.string()),
  browse: z.array(z.string()),
  addFolder: z.string(),
  /** The tablet's Cancel before Add (T5 128:636). */
  cancel: z.string().optional(),
})
export type PhoneFoldersLayers = z.infer<typeof PhoneFoldersLayers>

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
/**
 * A subagent's full transcript on the phone (M12 147:314): the trail (147:339) with its back chevron, the chat and
 * Subagents; the header (147:345) with the title, the status, the meta line and Stop; the task box (147:368), each
 * transcript entry in order, and the read-only note at the foot (147:387).
 */
export const SubagentTranscriptLayers = z.object({
  trail: z.string().optional(),
  back: z.string().optional(),
  chat: z.string().optional(),
  subagents: z.string().optional(),
  header: z.string().optional(),
  title: z.string().optional(),
  status: z.string().optional(),
  meta: z.string().optional(),
  stop: z.string().optional(),
  task: z.string().optional(),
  entries: z.array(z.string().optional()).optional(),
  note: z.string().optional(),
})
export type SubagentTranscriptLayers = z.infer<typeof SubagentTranscriptLayers>

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
  /**
   * The shell pane's terminal (D1 105:337) and the rows of the empty pane's list (D1 105:370, 105:384): the library's
   * `EmptyPane` takes no `data-*`, so its list's box (105:368) cannot carry one.
   */
  shell: z.string().optional(),
  emptyRows: z.array(z.string()).optional(),
  /** The empty pane's Close pane button and its shortcut (D13 402:6502, 402:6504). */
  emptyClose: z.object({ close: z.string(), shortcut: z.string() }).optional(),
  /** The split's readout while a handle is dragged (D14 402:7151). */
  resizeHint: z.string().optional(),
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
  /** The side chat's title row: its bubble, title, command and × (M5 105:3109); none when not set. */
  sideHeader: z.string().optional(),
  sideNote: z.string().optional(),
  sideComposer: z.string().optional(),
  sideEntries: z.array(z.string().optional()).optional(),
  /** The subagents panel and its cards, by subagent id (D3). */
  subagents: z.string().optional(),
  subagentCards: z.record(z.string(), z.string()).optional(),
  /**
   * The subagents view on the phone (M6): its header (105:3176), the title (105:3181), the count line (105:3185) and
   * each card's chevron, by subagent id (147:15). The back button is `phoneBack`.
   */
  subagentsHeader: z.string().optional(),
  subagentsTitle: z.string().optional(),
  subagentsCount: z.string().optional(),
  subagentChevrons: z.record(z.string(), z.string()).optional(),
  /** The button under the cards that starts a subtask (T3 105:2087). */
  subagentsStart: z.string().optional(),
  /** The drop zone of a dragged chat, the dragged chat in it and its hint (D6 158:1025, 158:1034, 158:1048). */
  dropZone: z.object({ zone: z.string(), preview: z.string(), hint: z.string().optional() }).optional(),
  /** The toast over the composer of the chat shown alone (D20 toast · moved). */
  toast: z.string().optional(),
  /** The field that takes the place of the chat's name in its header while the owner renames it (D21 417:2442). */
  renameField: z.string().optional(),
  /** The phone's list of workspaces (M1 105:2327) and its header with Edit and + (105:2328, 105:2333, 105:2335). */
  phoneList: z.string().optional(),
  phoneHeader: z.string().optional(),
  phoneEdit: z.string().optional(),
  phoneAdd: z.string().optional(),
  /** The ⋯ at the end of each chat row on the phone, by chat id (M1 146:2). */
  rowMenus: z.record(z.string(), z.string()).optional(),
  /** The fields that rename a chat or a workspace in the phone's list, by chat or workspace id (M2 146:37, 105:2614). */
  renameFields: z.record(z.string(), z.string()).optional(),
  /** Move to… in place of a chat row's status in the tablet's edit mode, by chat id (T1 105:1594). */
  rowMoves: z.record(z.string(), z.string()).optional(),
  /** The back button over a chat on the phone (M3 105:2750). */
  phoneBack: z.string().optional(),
  /** The skill list after "/" in the chat's composer; D1's (105:406) when not set. */
  skills: z.string().optional(),
  /**
   * The icons of the phone's chat actions sheet (M4 105:2938), by action value or, under Move to workspace, by
   * workspace id and `new`: `BottomSheet` and `OptionList` take no `data-*`, so the icons carry the rows' places.
   */
  sheetIcons: z.record(z.string(), z.string()).optional(),
  /** The lifted copy of a held chat's row over the sheet's scrim on the phone (M9 146:252). */
  liftedRow: z.string().optional(),
  /** The ⋯ of that copy (M9 146:268). */
  liftedMenu: z.string().optional(),
  /** The New chat form on the phone (M7). */
  newChatForm: NewChatLayers.optional(),
  /** The New chat dialog over the tablet's chat (T7); D3's layers when not set. */
  newChatDialog: NewChatDialogLayers.optional(),
  /** A subagent's full transcript on the phone (M12). */
  subagentTranscript: SubagentTranscriptLayers.optional(),
  /** The folders sheet on the phone (M8). */
  phoneFolders: PhoneFoldersLayers.optional(),
  /** The dialog that asks before a workspace closes, and its Cancel and Close (M13 208:765, 208:769, 208:771). */
  closeDialog: z.object({ dialog: z.string(), cancel: z.string(), close: z.string() }).optional(),
  /**
   * The menu that + opens on the phone (M15 208:515) and its icons, by action (208:521, 208:529): `Menu`'s rows take
   * no `data-*`, so the icons carry the rows' places.
   */
  addMenu: z.object({ menu: z.string(), icons: z.record(z.string(), z.string()) }).optional(),
  /** The Fork dialog over the tablet's chat (T8); D15's layers when not set. */
  forkDialog: ForkDialogLayers.optional(),
  /** The Subtask dialog over the tablet's chat (T10); D17's layers when not set. */
  subtaskDialog: SubtaskDialogLayers.optional(),
  /** The Fork sheet on the phone (M18 422:217): its fields, the start-from choices in order, the note and Fork. */
  phoneFork: z
    .object({
      name: z.string(),
      startFrom: z.string(),
      choices: z.array(z.string()),
      note: z.string(),
      submit: z.string(),
    })
    .optional(),
  /** The Subtask sheet on the phone (M20 422:520): the model's field and box, the task's, the note and Start subtask. */
  phoneSubtask: z
    .object({
      model: z.string(),
      modelBox: z.string(),
      task: z.string(),
      taskBox: z.string(),
      note: z.string(),
      submit: z.string(),
    })
    .optional(),
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
  /**
   * The chip in a phone chat's header that opens the folders sheet (M8 128:695), such as "{count} folders"; {count}
   * is the number of folders. Without it, the phone's header has no chip.
   */
  chip: z.string().optional(),
})
export type ChatFolders = z.infer<typeof ChatFolders>

/** The folder picker beside the chat (D4 128:330): a search, the recent folders and the folders of one path. */
export const FolderPicker = z.object({
  title: z.string(),
  closeLabel: z.string(),
  note: z.string(),
  searchLabel: z.string(),
  /** What the owner has typed. */
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

/**
 * The drop zone a chat dragged from the sidebar shows over the chat shown alone (D6 158:1025) or over a pane of the
 * workbench (D8 402:1112).
 */
const PaneDrop = z.object({
  /** What the drop does, such as "Open {chat} beside {target}"; {chat} and {target} are filled in. */
  title: z.string(),
  /** The line under it, such as "splits {target} into two panes side by side"; {chat} and {target} are filled in. */
  text: z.string(),
  /** The hint on where to drop, in one line; none when not set (D8). */
  hint: z.string().optional(),
  /** `false`: no split icon over the title (D8). */
  icon: z.boolean().optional(),
  /**
   * Over a pane, where the dragged chat sits in the room under the text: a third of the way down (the default, D8,
   * D10) or at its end, where the pointer is near the pane's bottom (D12).
   */
  preview: z.enum(['third', 'end']).optional(),
})
export type PaneDrop = z.infer<typeof PaneDrop>

export const Skill = z.object({ name: z.string(), description: z.string() })
export type Skill = z.infer<typeof Skill>

/**
 * How a split places its panes when it is not the library's `SplitPanes`, which splits the columns first:
 * - `rows` (D14): the first two panes side by side in the top row and the others in the bottom row, each row with its
 *   own column handle;
 * - `stack`: the panes one above the other, as herdr's `column` split of two panes (slice 3a).
 */
const PaneSplit = z.enum(['rows', 'stack'])

const WorkspacesDataFields = z.object({
  /** The number of Inbox items that need the owner, on the rail. */
  railBadge: z.number(),
  workspaces: z.array(Workspace),
  /** The workspace shown: one of `workspaces`, or null when there are none (an empty live list, P-3). */
  current: z.string().nullable(),
  /** The current workspace's panes, clockwise from the top left. */
  panes: z.array(WorkbenchPane),
  /**
   * The status bar: the shown view's summary, the key hints and an alert on the right. A live state with no
   * workspace has no summary, and has an alert only when the live source says something (liveWorkspaces.ts).
   */
  status: z.object({ summary: z.string().optional(), hints: z.array(z.string()), alert: z.string().optional() }),
  /**
   * The notice over every layout when the live source could not be read and the page shows no workspaces
   * (liveWorkspaces.ts), with Retry; a state without it shows none.
   */
  liveNotice: z.object({ title: z.string(), description: z.string() }).optional(),
  /** A pane menu's actions, with a separator before `move`. */
  paneMenu: z.array(PaneAction),
  /** The last row of Move to workspace; the live page has none, as no route makes a workspace from there. */
  newWorkspace: z.string().optional(),
  /** What typing / in a composer lists. */
  skillsLabel: z.string(),
  /**
   * The list's label once the owner has typed more than the "/", such as "SKILLS MATCHING {query}" (M10 147:72); {query}
   * is what he typed from the "/", and the list keeps only the skills that start with it. `skillsLabel` when not set.
   */
  skillsMatching: z.string().optional(),
  skills: z.array(Skill),
  /** The sidebar's labels; a state without them has no sidebar. */
  sidebar: SidebarText.optional(),
  /** The side chat of the current chat, when one is open. */
  sideChat: SideChat.optional(),
  /** The actions behind the ⋯ of the chat shown alone (D2b), with a separator before `subagents`. */
  chatMenu: z.array(PaneAction).optional(),
  /**
   * The commands a live Claude chat's actions offer after its other actions, with a separator before them (W5):
   * `compact` and `clear`, each of which opens its dialog. On only while the chat is idle or done (`takesCommands`); a Codex chat and a shell have none.
   */
  chatCommands: z.array(PaneAction).optional(),
  /**
   * The herdr tabs of each live workspace whose layout the page read (slice W2), by workspace id: what the layout writes
   * act on (`blocks/layoutActions.ts`). A fixture and a workspace whose layout read missed have none, so their panes offer
   * no zoom, swap or close.
   */
  liveTabs: z.record(z.string(), z.array(LiveTab)).optional(),
  /** The machine of the live chats: a chat's server ID is `<liveMachine>/<id>`. */
  liveMachine: z.string().optional(),
  /** The Figma layers of the sidebar frame's parts; D2's when not set. */
  layers: SidebarLayers.optional(),
  /** The subagents and subtasks of the chat shown alone (D3). */
  subagents: SubagentsPanel.optional(),
  /** The New chat form (D3). */
  newChat: NewChatForm.optional(),
  /** The Fork form of a chat action (D15). */
  fork: ForkForm.optional(),
  /** The Subtask form of a chat action (D17). */
  subtask: SubtaskForm.optional(),
  /** `false`: the chat header has no ⋯, as D4 draws it. */
  chatActions: z.boolean().optional(),
  /** The folders of the chat shown alone (D4). */
  folders: ChatFolders.optional(),
  /** The folder picker (D4). */
  folderPicker: FolderPicker.optional(),
  /** The drop zone's text while a chat is dragged onto the chat shown alone (D6) or a pane of the workbench (D8). */
  paneDrop: PaneDrop.optional(),
  /** How the split places the panes (`PaneSplit`); the library's `SplitPanes`, columns first, when not set. */
  split: PaneSplit.optional(),
  /** The readout beside a handle while the owner drags it (D14), such as "{ratio}  ·  double-click for 50 : 50". */
  resizeHint: z.string().optional(),
  /**
   * A toast over the composer of the chat shown alone that confirms what the owner just did, with its button, such as
   * "Moved bridge themes to the-bridge" and Undo (D20). `ui.toastOpen` shows it.
   */
  toast: z.object({ text: z.string(), action: z.string() }).optional(),
  /** The phone's labels (M1); with them, a phone's width draws the phone layout: the list and the tab bar. */
  phone: PhoneText.optional(),
  /**
   * `true` (T1, T2): with the phone's labels, a tablet's width draws the phone's views too: the list with the tablet's
   * tab bar (T1), or a chat with no tab bar (T2). When not set, a tablet's width draws the desktop layout.
   */
  tabletList: z.boolean().optional(),
  /**
   * The most recent chat of each workspace, by workspace id, as a pane (R6). A click on the tab of a workspace with no
   * layout yet opens this chat alone in one pane.
   */
  lastChats: z.record(z.string(), WorkbenchPane).optional(),
})

export const WorkspacesData = WorkspacesDataFields.refine(
  (data) => (data.current === null ? data.workspaces.length === 0 : data.workspaces.some((w) => w.id === data.current)),
  { message: '`current` must name one of `workspaces`, and be null only when there are none', path: ['current'] },
)
export type WorkspacesData = z.infer<typeof WorkspacesData>

/** A handle of a rows-first split (D14): between the rows, or between the columns of the top or bottom row. */
export const ResizePart = z.enum(['rows', 'top', 'bottom'])
export type ResizePart = z.infer<typeof ResizePart>

/**
 * A handle of the split: a rows-first split's (`ResizePart`), or the library `SplitPanes`' handle between the columns
 * (`columns`) and between the rows of the left or right column.
 */
const SplitHandle = z.enum([...ResizePart.options, 'columns', 'left', 'right'])

/** The sizes of each handle of the split, in percent; a handle with none shares its panes equally. */
const SplitSizes = z.partialRecord(SplitHandle, z.array(z.number()))
export type SplitSizes = z.infer<typeof SplitSizes>

/**
 * The layout of one workspace (R6): its panes by id, clockwise from the top left, the sizes of its handles and the
 * pane that had the focus when the owner left it.
 */
export const WorkspaceLayout = z.object({
  panes: z.array(z.string()),
  splitSizes: SplitSizes.optional(),
  focusedPane: z.string().optional(),
  /** How its split places the panes (`PaneSplit`); the state's own for `data.current` when not set. */
  split: PaneSplit.optional(),
  /** The workspace's side chat is open (`ui.sideChatOpen`); closed when not set. */
  sideChatOpen: z.boolean().optional(),
})
export type WorkspaceLayout = z.infer<typeof WorkspaceLayout>

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
  /** The highlighted row of the open menu, such as `move` while its list is open (D1, D2b); the menu's own when not set. */
  menuHighlight: z.string().nullable().optional(),
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
  /** A chat the owner drags onto another workspace. */
  drag: z.object({ chat: z.string(), over: z.string() }).nullable().optional(),
  /** The side chat shows beside the main chat, or inside its pane of the split (D5). */
  sideChatOpen: z.boolean().optional(),
  /** The subagents panel shows beside the main chat, in place of the side chat (D3). */
  subagentsOpen: z.boolean().optional(),
  /** The subagents whose transcript is open. */
  transcripts: z.array(z.string()).optional(),
  /** The New chat form is open over the screen (D3). */
  newChatOpen: z.boolean().optional(),
  /** The chat action whose dialog is open over the screen, for the focused chat, such as `fork` (D15), or null. */
  chatDialog: PaneAction.shape.value.nullable().optional(),
  /**
   * The chat a /compact or /clear dialog acts on (W5), by pane id: the chat whose actions opened it, so a change of
   * the focused pane while the dialog is open (a live layout) does not send the command to another chat.
   */
  commandFor: z.string().nullable().optional(),
  /** The herdr tab (its server ID) that the Move to tab… dialog of the chat in `commandFor` moves it to (W2d). */
  moveToTab: z.string().nullable().optional(),
  /**
   * A live move to another workspace that asks first (backend #435): the chat, by pane id, is its workspace's last, so
   * the move closes that workspace.
   */
  moveAsk: z.object({ chat: z.string(), workspace: z.string() }).nullable().optional(),
  /**
   * The herdr tab the workbench shows in place of the active one, by workspace id (W2d, `shownTabs.ts`): the tab a
   * moved open pane went to (`tab`), while herdr's active tab is still `over`.
   */
  shownTabs: z.record(z.string(), z.object({ tab: z.string(), over: z.string() })).optional(),
  /** The list of the chat's folders is open over the composer (D4). */
  foldersOpen: z.boolean().optional(),
  /** The folder picker shows beside the main chat, in place of the side chat (D4). */
  folderPickerOpen: z.boolean().optional(),
  /** The folder chosen in the picker, by path. */
  pickedFolder: z.string().nullable().optional(),
  /**
   * A chat the owner drags from the sidebar onto the chat shown alone, and where it would land (D6): its row in the
   * sidebar fades and the drop zone shows over that part of the chat. With the workbench (D8), `pane` is the pane
   * it is over, and the drop zone shows over that part of the pane.
   */
  paneDrag: z.object({ chat: z.string(), edge: DropEdge, pane: z.string().optional() }).nullable().optional(),
  /**
   * With the sidebar, the workbench (the tabs, the panes and the status bar) shows beside it in place of the chat
   * alone (D7): a chat opened from the sidebar fills the panes area.
   */
  workbench: z.boolean().optional(),
  /**
   * The handle of a rows-first split that the owner drags and the sizes it gives, in percent (D14): `rows` between the
   * rows, `top` and `bottom` between a row's columns. The readout shows the sizes as a ratio.
   */
  resize: z
    .object({ part: ResizePart, sizes: z.array(z.number()) })
    .nullable()
    .optional(),
  /**
   * The sizes of each handle of the split, rows first or columns first, in percent, kept apart so that a drag of one
   * handle leaves the others as they are; `resize` sets its own handle's sizes over these. A workspace's saved layout
   * has its own (`layouts`).
   */
  splitSizes: SplitSizes.optional(),
  /** The workspace whose tab is selected (R6); `data.current` when not set. */
  workspace: z.string().optional(),
  /**
   * The layout of each workspace, by workspace id (R6): a click on a tab shows that workspace as the owner left it, and a
   * resize or a closed pane changes only the shown workspace's. A workspace with none shows the state's panes when it
   * is `data.current`, and its last chat (`data.lastChats`) alone in one pane when it is another.
   */
  layouts: z.record(z.string(), WorkspaceLayout).optional(),
  /**
   * The loaded state's layouts, by workspace id, each as JSON, when the owner last changed the `ui`
   * (`blocks/workspaceLayout.ts`, `withLoadedLayouts`): a loaded layout that differs is newer than his change, such as
   * a herdr layout read again (slice 3a), and replaces his layout of that workspace.
   */
  layoutsSeen: z.record(z.string(), z.string()).optional(),
  /**
   * What the owner has typed in each chat's composer, by chat id, in place of the data's text. The composer is drawn anew
   * when its pane mounts again, after a visit to another page or a closed pane, so it starts from its draft here.
   */
  drafts: z.record(z.string(), z.string()).optional(),
  /** `data.toast` shows over the composer of the chat shown alone (D20); its button closes it. */
  toastOpen: z.boolean().optional(),
  /**
   * The name of the chat shown alone is a field in its header (D21): a click outside it or Enter saves the name,
   * and its × or Escape undoes the change; either closes it.
   */
  renaming: z.boolean().optional(),
  /** The names the owner gave chats, by chat id, in place of their titles in the data. */
  names: z.record(z.string(), z.string()).optional(),
  /**
   * The phone's list is in edit mode (M2): each workspace and chat has its handle, each workspace its ×, + is off and
   * Done ends it.
   */
  editing: z.boolean().optional(),
  /**
   * The chats and the workspaces whose name is a field in the phone's list (M2), by id, with the text in the field.
   * A tap outside a field saves it, and its × undoes the change; either closes it.
   */
  renamingChats: z.record(z.string(), z.string()).optional(),
  renamingWorkspaces: z.record(z.string(), z.string()).optional(),
  /** The names the owner gave workspaces, by workspace id, in place of their labels in the data. */
  workspaceNames: z.record(z.string(), z.string()).optional(),
  /**
   * What fills the phone's screen: `list`, the workspaces (M1, the default), `chat`, the focused chat with its
   * header and composer and no tab bar (M3), `subagents`, the focused chat's subagents (M6), or `transcript`, the
   * full transcript of the subagent `subagentFor` names (M12). A tap on a chat in the list opens it; the chat's back
   * button returns. Subagents in the chat actions opens the subagents, and their back button returns to the chat. A
   * card's chevron opens its transcript, whose back chevron and Subagents return to the subagents and whose chat
   * returns to the chat.
   */
  phoneView: z.enum(['list', 'chat', 'subagents', 'transcript']).optional(),
  /** The subagent whose full transcript fills the phone's screen (M12). */
  subagentFor: z.string().nullable().optional(),
  /**
   * The on-screen keyboard is up over the phone's chat (M10): the chat's header shrinks to one line, the model, the
   * context used and the folders under the title. Over New chat (M11) the start bar keeps Start chat alone, with no
   * summary. The app does not measure the keyboard yet, and the screen does
   * not size itself to the visible area (LIBRARY_GAPS.md: Phone keyboard).
   */
  keyboardOpen: z.boolean().optional(),
  /**
   * The phone chat's message box has the focus with no skill list open, the caret after the text (M17 402:10841).
   * With the skills open (M3) the box has the focus anyway.
   */
  messageFocus: z.boolean().optional(),
  /**
   * The phone chat's message box had the focus when Rename opened the name field in its header (M23): the box takes
   * the focus back when the field closes, saved or undone.
   */
  refocusMessage: z.boolean().optional(),
  /** The workspace whose close dialog is open over the phone's list (M13), or null. */
  closing: z.string().nullable().optional(),
  /** The workspaces the owner closed with that dialog's Close; the list no longer shows them. */
  closedWorkspaces: z.array(z.string()).optional(),
  /** The workspace whose actions sheet is open over the phone's list (M14), or null. */
  workspaceMenuFor: z.string().nullable().optional(),
  /** The menu that + opens at the top of the phone's list is open (M15). */
  addMenuOpen: z.boolean().optional(),
  /** The workspaces the owner added with that menu's New workspace, by id, with the name each started with. */
  addedWorkspaces: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
  /** The workspace New chat opens with, by id, in place of the form's own: the one New chat was picked for. */
  newChatWorkspace: z.string().nullable().optional(),
  /** The chat New chat starts beside (W3), by pane id: the chat whose actions opened it; null for a new tab. */
  newChatBeside: z.string().nullable().optional(),
  /**
   * The live start of New chat (W3): it runs (`busy`), the name field's error, or the miss's line, with Retry when the
   * same start may work again.
   */
  newChatStart: z
    .object({
      busy: z.boolean().optional(),
      nameError: z.string().optional(),
      line: z.string().optional(),
      retry: z.boolean().optional(),
    })
    .nullable()
    .optional(),
})
export type WorkspacesUi = z.infer<typeof WorkspacesUi>

/** The schema of one Workspaces state, for the state checks. */
export const WorkspacesState = z.object({ data: WorkspacesData, ui: WorkspacesUi })

/**
 * The live list's edits (reviews R41, R42, useWorkspaceEdits.ts): one at a time, each shown from the next list read,
 * never before. IDs are the page's. None on a fixture, which keeps its names in `ui`.
 */
export type WorkspaceEdits = {
  /** An edit waits for its answer or for the list read after it. */
  readonly pending: boolean
  /** The order of the workspaces (page IDs) that a pending reorder holds on the page; none otherwise. */
  readonly held: readonly string[] | undefined
  /** The line about the last edit that missed, such as "Not renamed — herdr-unavailable". */
  readonly line: string | undefined
  /** Hides the line. */
  readonly dismiss: () => void
  /** Renames `workspace` to `name` (trimmed); nothing goes when it is empty or still `was`. */
  readonly renameWorkspace: (workspace: string, name: string, was: string) => void
  /** Gives the chat's pane the label `name` (trimmed); nothing goes when it is empty or still `was`. */
  readonly renameChat: (chat: string, name: string, was: string) => void
  /** Puts the workspaces in this order, each of the list once; nothing goes when the order is the list's. */
  readonly order: (workspaces: readonly string[]) => void
  /**
   * Closes `workspace` and the `panes` chats the dialog listed. `again` runs when the server counts other chats
   * (409 `panesChanged`), after the page asked for the list again, so the dialog can ask with the new list.
   */
  readonly close: (workspace: string, panes: number, again: () => void) => void
  /** Moves `chat` to a new tab of `workspace`; the chat opens there with the list read that shows it moved. */
  readonly moveChat: (chat: string, workspace: string) => void
}
