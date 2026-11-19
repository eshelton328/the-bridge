# Workspaces page

The Workspaces page: the Workbench of Figma page 89:2, whose
references are in `references/workspaces/`. Read [../AGENTS.md](../AGENTS.md)
first: it says what each file of a page folder is for.

- `WorkspacesPage.tsx` is the connected entry; it merges the loader's
  state with what Erik changed in it (`workspacesStore.ts`), passes it to
  the screen and goes to the page Erik picks.
- `home.ts`: `workspacesHome`, what `/workspaces` shows with no
  `?state=`: M1's data with the phone's labels and `tabletList`, so the
  screen lays out for the window (desktop, tablet or phone) and changes
  on resize, with every menu, list and dialog closed. It is not a Figma
  state, so it sits outside `states/` with no frame, story, board or
  fidelity check (`app/WorkspacesHome.test.tsx`).
- `workspacesStore.ts`: the page's view store (`createAppStore`, as
  Inbox's). It holds the changes to the shown state's `ui`, so a visit to
  another page keeps them (`app/WorkspacesRoute.test.tsx`), and drops
  them when another `?state=` is shown. What Erik types in a chat's
  composer is one of them: `ui.drafts` by chat id, which the composer in a
  pane and in the chat alone starts from (`blocks/chatDraft.ts`), so a
  pane that unmounts keeps its draft. The composer is uncontrolled, so
  each `ChatPane` is keyed by its chat's id: a switch to another chat
  mounts that chat's composer from its own draft.
- The screen lays out by its width (`ViewportFrame`, as Inbox does): a
  state with `data.phone` (the phone's labels) draws
  `screens/WorkspacesPhone.tsx` at a phone's width, the phone layout of
  M1 to M23: one view at a time with the shared `AppTabBar`, whose More
  opens the shared `MoreDrawer`. The tab bar lies over the list's foot
  (AppShell `tabBarOverlay`, as the other pages): the list runs under it
  and its last workspace scrolls clear of it (`app/PhoneTabBar.test.tsx`).
  The views with no tab bar keep their footers (the composer, New chat's
  start bar) in `ScrollFrame` footers, which the library lifts above a bar.
  The chat (`ChatPane`'s `header`) and New chat are each one `ScrollFrame`
  straight in the AppShell detail, as the library docks only that frame's
  footer on the keyboard (R20, `app/WorkspacesChatDock.test.tsx`);
  `blocks/frameRegion.ts` names it a region, as their section did.
  A tablet draws the desktop layout, with the rail and no tab bar, except
  for a state with `data.tabletList` (T1): it draws the phone's views at
  the tablet's width (`WorkspacesPhone device="tablet"`), with the
  tablet's backdrop, shell and tab bar, whose More goes to its page; T2 is
  M3's chat at the tablet's width with M5's side chat sheet over it, with no
  tab bar, and T2b the same chat with D2b's chat actions menu under its ⋯; T3 is
  M6's subagents at the tablet's width, with no tab bar. M1 is its home, `PhoneWorkspaceList`;
  M2 is its edit mode (`ui.editing`); M3 is a chat (`ui.phoneView:
  'chat'`, `PhoneChat`), which fills the screen with no tab bar; M4 is
  that chat's actions sheet (`ui.menuFor`, `PhoneChatActions`); M5 is
  the side chat, a sheet over the chat (`ui.sideChatOpen`, `PhoneSideChat`);
  M6 is the chat's subagents (`ui.phoneView: 'subagents'`, `PhoneSubagents`),
  with no tab bar; M7 is New chat (`ui.newChatOpen`, `PhoneNewChat`), which
  fills the screen with no tab bar; M8 is the chat's folders, a sheet that
  the folders chip in the chat's header opens (`ui.foldersOpen`,
  `PhoneFolders`), with the folder picker under the folders
  (`ui.folderPickerOpen`); M9 is a chat held in the list: the same
  actions sheet opens over the list (`ui.menuFor` on a list chat,
  `data.phone.rowMenu`) and the row lifts over its scrim; M10 is the chat
  with the keyboard up (`ui.keyboardOpen`), whose header is one line; M11
  is New chat with the keyboard up, the name in focus and Start chat alone
  in the start bar; M12 is a subagent's full transcript (`ui.phoneView:
  'transcript'`, `ui.subagentFor`), with no tab bar. Every other width, and a state without `data.phone` (D1 to D21), draws
  the desktop layout. `WorkspacesScreen` keeps the ui above the layout,
  so a width change keeps what Erik changed (`WorkspacesLayout.test.tsx`).
  Later phone frames add their views to `WorkspacesPhone`.
- `screens/WorkspacesScreen.tsx`: the rail (`AppRail`) and the library's
  `Workbench`: the 52 px tab bar (`size="compact"`) with the sidebar
  toggle before the tabs and New chat after them, the current
  workspace's panes and the status bar. It keeps what Erik opens or
  closes (a pane menu, Move to workspace, the skill list, the
  focused pane) until the state changes, and reports it with `onUiChange`.
  With `ui.sidebar` (D2) it shows the workspace sidebar in the list slot,
  the focused chat alone in the detail and its side chat in the side slot;
  with `ui.subagentsOpen` (D3) the subagents panel takes the side slot,
  420 wide, and `ui.newChatOpen` opens the New chat form over the screen.
  With `data.folders` (D4) the composer has the folders control, whose
  list `ui.foldersOpen` opens, and `ui.folderPickerOpen` puts the folder
  picker in the side slot. With the split panes, `ui.sideChatOpen` opens
  `data.sideChat` inside the pane its `pane` names, over the chat's right
  side (D5). With `ui.paneDrag` (D6) the dragged chat's row fades in the
  sidebar and `data.paneDrop` shows as a drop zone over the chat alone.
  With `ui.workbench` (D7) the sidebar sits beside the workbench (tabs,
  panes, status bar) in place of the chat alone, whatever pane has the
  focus, a shell pane too; then `ui.paneDrag.pane`
  (D8) puts the drop zone over that pane of the split.
- `blocks/`: `WorkbenchPanes` (the split, one to four panes clockwise
  from the top left, each pane by its `type`), `PaneFrame` (a pane's
  header through `PaneSlot`: kind mark, title, model, context, status,
  Maximise and the menu), `PaneMenu` (fork, side chat, subtask, Move to
  workspace with its list as the action's `submenu`, rename, close;
  compact rows, and the highlighted row and workspace from the state),
  `ChatPane` (the transcript in a `ScrollFrame` body and the composer in
  its footer; a message that starts with "/", or a word that starts with
  "/" before the caret, opens the skill list, and the focus stays in the box), `ChatEntryView` (one entry, by `type`),
  `SkillPicker` (the skills after "/": `Popover width="composer"`, 40%
  of the composer from 240 to 400 (screen review R8; `SkillListWidth.test.tsx`
  checks the widths), and a mono `OptionList` with no check), `ShellPane` (the library's `TerminalLines`
  in a `ScrollFrame`) and `EmptyPane` (the library's `EmptyPane`: start a
  chat, or open one of the workspace). D2 adds
  `WorkspaceSidebar` (the title, the toggle, + and the groups; only a
  chat with a pane in `data.panes` can be selected),
  `SidebarGroup` (a workspace's header and chats, the drop target and the
  dragged chat in the library's `DragPreview`), `SidebarChatRow`, `MainChat` (the chat alone: `ChatHead`
  over `ChatPane size="full"`) and `SideChatPanel`. D2b adds
  `ChatActionsMenu` (the `PaneMenu` behind the chat header's ⋯). D3 adds
  `SubagentsPane` (the title, the count and Close in a `ScrollFrame`
  header over the cards),
  `SubagentCard` (one subagent with its transcript and Stop),
  `NewChatDialog` (the New chat form in `Dialog size="lg"`), `FormField`
  (a field's capital label and hint over its control) and `SelectField`
  (a closed choice: a `RadioMenu` behind a field-wide button). D4 adds
  `FoldersControl` (the folders control under the prompt box and its list)
  and `FolderPickerPane` (Add a folder: search, recent folders, browse).
  D5 adds `placement="pane"` to `SideChatPanel` (the side chat over its
  pane's chat, with Open as its own pane over a one-row composer,
  `ChatPane layout="inline"`; the panel does not scroll, and its note
  scrolls with the transcript as `ChatPane`'s `lead`; the composer keeps
  its height, so in a pane too short for the title row, a line of
  transcript and the composer the panel scrolls instead), which `ChatPane`
  draws as its `overlay`. D6 adds `PaneDropZone` (the drop zone over the part of the
  chat alone where a dragged chat would open, with the dragged chat in
  `DragPreview`), which
  `MainChat` draws as its `overlay`. D7 adds `WorkspaceTabs` (the
  `Workbench` with New chat, the sidebar toggle, which shows the
  sidebar again, when the sidebar is hidden, `WorkbenchPanes` and the status bar), which both layouts use.
  D8 adds `overlay` to `PaneFrame` (drawn over the whole pane, header
  included) and `placement="pane"` to `PaneDropZone` (4 in from the pane,
  the dragged chat at the zone's end; `data.paneDrop` without `hint` and
  with `icon: false` draws neither), which `WorkbenchPanes` gives the pane
  that `ui.paneDrag.pane` names. D9 needs no new block: `WorkbenchPanes`
  gives two panes to the library's `SplitPanes`, which puts them side by
  side at half the width each with its resize handle in the gap. D10
  needs no new block either: the drop zone is an overlay of the one pane
  that `ui.paneDrag.pane` names, so a drop splits only that pane (here
  `edge: 'bottom'`, the lower half of drift check), and the other panes
  keep their size. D11 needs no new block: `WorkbenchPanes` gives three
  panes to `SplitPanes`, which puts the first on the left at the full
  height and the second over the third on the right, with one handle
  between the columns and one between the right column's rows. D12 gives
  four panes to `SplitPanes` (the fourth under the first) and adds two
  things to `PaneDropZone`: over a pane, `edge: 'middle'` (a drop that
  replaces the pane's chat) dims the whole pane under the zone with
  `surface.pane`, and `data.paneDrop.preview: 'end'` puts the dragged
  chat at the end of the room under the text. D13 adds `close` to the
  empty pane (Close pane and its shortcut at the pane's top end, 12 in);
  the split keeps its four places, so the other panes stay where they
  are. D14 adds `RowsSplit` (with `data.split: 'rows'`, the library's
  `Splitter` nested rows outside and columns inside: the first two panes
  in the top row, the others in the bottom row, as `SplitPanes` cannot
  split the rows first) and `ResizeReadout` (`ui.resize`, the dragged
  handle and its sizes, shown as `data.resizeHint`'s ratio in the
  library's outline `Badge` over the pane before the handle). D15 adds
  `ForkDialog` (the Fork form in `Dialog size="lg"`: the copy's name, a
  two-way start-from choice, a note, Cancel and Fork), which opens over
  the chat alone when `ui.chatDialog` is `fork`. D16 needs no new block:
  `SidebarChatRow` draws a chat's `mark` (`fork`: the branch mark before
  the kind mark of a nested row), `ChatHead` puts the chat's `origin` after
  its workspace, and `ChatEntryView` draws an `event` entry (where a fork
  starts) as the library's `ToolLine`. D17 adds `SubtaskDialog` (the
  Subtask form in `Dialog size="lg"`: the model in a `SelectField`, the
  task in a `Composer` with its attach button and the focus, a note,
  Cancel and Start subtask), which opens over the chat alone when
  `ui.chatDialog` is `subtask`. D18 needs no new block: the subtask's
  chat is a nested row (`level: 1`) under its chat, and the line where it
  started is an `event` entry. D19 needs no new block: `ChatActionsMenu`
  opens Move to workspace's list (`ui.moveOpen`, the highlighted workspace
  in `ui.moveTarget`), which the library puts beside the menu, on the left
  where the window has no room on the right. D20 adds `ChatToast` (the
  library's static `Toast` with its button, centred), which `MainChat`
  draws in `ChatPane`'s `above` slot, over the composer, while
  `ui.toastOpen`; its button closes it. D21 adds `ChatNameField` (the
  library's `SearchField`, 300 wide, with × as its clear button), which
  `ChatHead` draws in place of the title while `ui.renaming`: Enter or a
  click outside saves the name in `ui.names`, × or Escape undoes it; Rename
  chat in `ChatActionsMenu` opens it. M1 adds `PhoneWorkspaceList` (the
  phone's home: the large title with Edit and +, then each workspace's
  `SidebarGroup` without the grip), and `menu` to `SidebarChatRow` and
  `rowMenu` to `SidebarGroup`: the ⋯ after a phone row's status. M2 adds
  edit mode to `PhoneWorkspaceList` (Done for Edit, + off), which draws each
  workspace as `PhoneEditGroup` (the header with its grip and × to close,
  or its name as a field; the rows with their grip and no ⋯; a tap on a
  chat's name opens its field), `PhoneRenameRow` (a chat row whose name is
  a field over the meta line) and `ChatMeta` (a chat's model and context,
  which `SidebarChatRow` uses too); it adds `grip` to `SidebarChatRow`, and
  `draft`, `autoFocus` and `fill` to `ChatNameField`. M3 adds `PhoneChat`
  (the chat on the phone: `ChatHead size="phone"` with the back button in
  its `back` slot and a bare ⋯, over `ChatPane size="phone"`), `autoFocus`
  to `ChatPane` (the focus in the message box) and `layout="phone"` to
  `SkillPicker` (as wide as the composer, `Popover width="trigger"`,
  compact, and the focus stays in the box); a tap on a chat in the phone's list opens it, and the back
  button returns to the list. M4 adds `PhoneChatActions` (the chat
  actions sheet behind the phone chat's ⋯: `BottomSheet size="sm"` titled
  with the chat's name, the actions in `OptionList`s with no check, Move
  to workspace's list of workspaces inline under its row) and
  `renderMenu` to `PhoneChat` (the caller gets the ⋯ as the sheet's
  trigger); `ChatPane`'s composer layer is optional, as M4's sheet hides
  the composer. M5 adds `PhoneSideChat` (the side chat on the phone:
  `BottomSheet size="sm"` with no title row, the focus in its message box),
  `placement="sheet"` to `SideChatPanel` (the title row with the bubble,
  `/btw` and a grey × at 20 px, the 17 px title, and `sideHeader`, its layer)
  and `size="sheet"` to `ChatPane`; Side chat in the chat actions sheet
  opens it, and × or the scrim closes it. M6 adds `PhoneSubagents` (the
  chat's subagents on the phone: `BackRow` to the chat, the title in
  `PageHeader size="phone"` and the count line, "3 · 2 running", in a
  `ScrollFrame` header over the cards), and `size="phone"` (the meta in
  `monoSm`) and `openLabel` (a grey chevron after the status, which opens
  the full transcript, M12) to `SubagentCard`; Subagents in the chat
  actions sheet opens it, and its back row returns to the chat. M7 adds
  `PhoneNewChat` (New chat on the phone: Cancel and the title in a
  `ScrollFrame` header, the fields between, and the start bar, the summary
  of the choices over Start chat, as its footer; Cancel closes it) and
  `NewChatFields` (D3's fields for a phone's width: the name, Runs in as
  stacked rows with a check on the chosen one, the workspace, the folder
  chips, the model and the first message), and `size` to `SelectField`
  (`xl`, 44 high). M8 adds `PhoneFolders` (the chat's folders on the phone:
  the chip in the header is the trigger of a `BottomSheet` titled Folders
  with a `ScrollFrame` of the folder rows, a rule and the picker, and Add as
  its footer; the search has the focus, its caret at the end), and moves
  D4's parts into two blocks both layouts use: `FolderRows` (the folder
  rows and Add folder, which `FoldersControl` draws in its popover;
  `accent` draws the working folder's icon cyan) and `FolderPickerList`
  (the picker's title row, note, search, recent and listed folders, which
  `FolderPickerPane` draws; `size="sheet"` puts every part 8 apart). It
  adds `extra` to `ChatHead` (in place of the context label) and
  `folders` and `noActions` (no ⋯) to `PhoneChat`. M9 adds `HoldArea` (a
  hold of 500 ms that a finger moving past 8 px cancels, the click that
  ends it stopped, Safari's selection and callout off), `onHold` and
  `lifted` to `SidebarChatRow` (the held row's copy in `DragPreview`, 6
  above the row with `zIndex: 1`, over the sheet's scrim) and to
  `SidebarGroup`, and `highlight` to `PhoneChatActions`, whose `trigger`
  is optional; a hold or a row's ⋯ in `PhoneWorkspaceList` opens the
  sheet with its first action highlighted. M10 adds `meta` to `ChatHead`
  and `PhoneChat` (the header on one line: the model, the context used and
  the folders under the title, with no model row) and `matching` to
  `ChatPane`'s skills (the word typed from "/" before the caret filters
  the list, whose label becomes `data.skillsMatching`). The app does not
  size the screen to the visible area above the keyboard
  (LIBRARY_GAPS.md: Phone keyboard). M11 adds `keyboardOpen` to
  `PhoneNewChat` (no summary over Start chat) and, to `NewChatFields` and
  `NewChatDialog`, the typed name (`form.name.value`, which hides the
  hint), the field with the focus (`form.focus`) and, on the phone only,
  `form.foldersBox` (the folders as one field-high box, such as
  "~/omni-brain +1"). M12 adds `PhoneSubagentTranscript` (a subagent's
  full transcript on the phone: `TranscriptTrail`, the trail of text
  buttons back to the chat and the subagents, then the sparkle, the title
  in `PageHeader`, the status, the meta line and Stop over a rule, in a
  `ScrollFrame` header; the task in a `ProposalBlock`, the entries by
  `ChatEntryView`, and the read-only note in a notice `Panel` as its
  footer), and `running` to a `tool` entry (`ToolLine state="running"`);
  the chevron of a card in `PhoneSubagents` opens it when the panel has
  `fullTranscript`, and is disabled on a subagent without `full`. M13 adds
  `CloseWorkspaceDialog` (the library's `Dialog role="alertdialog"`: the
  workspace's title and text, Cancel and a `dangerSoft` Close sharing the
  row, the focus on the box) and `onClose` to `PhoneEditGroup`: × on a
  workspace in edit mode opens the dialog (`ui.closing`) when
  `data.phone.closeWorkspace` has its text, and Close takes the workspace
  off the list (`ui.closedWorkspaces`). M14 adds `onActions` to
  `SidebarGroup` (the header's ⋯): with `data.phone.workspaceMenu` it opens
  the workspace's actions (`ui.workspaceMenuFor`), `PhoneChatActions` with
  no trigger, titled with the workspace: New chat in it, Rename workspace
  (edit mode with its name a field) and Close workspace (M13's dialog).
  M15 adds `PhoneAddMenu` (+ at the top of the list and, with
  `data.phone.addMenu`, the `Menu size="lg"` it opens under it, while
  `ui.addMenuOpen`): New chat opens New chat (M7) with the current
  workspace chosen (`ui.newChatWorkspace`), and New workspace adds one
  (`ui.addedWorkspaces`, after the others) and opens its name as a field
  in edit mode.
  M17 adds `focusMessage` to `PhoneChat` (the focus in the message box
  with the skills closed, `ui.messageFocus`); Back returns to the list,
  where the other chats keep running. M18 adds `ForkFields` (D15's name,
  start-from choice and note, which `ForkDialog` draws too) and `PhoneFork`
  (the Fork form on the phone: `BottomSheet` titled "Fork {chat}" with ×,
  the fields and Fork across the sheet, no Cancel), which the chat actions'
  Fork opens (`ui.chatDialog: 'fork'`) when the state has `data.fork`;
  `ForkFields size="phone"` draws the choices' labels in `labelSm`.
  M19 needs no new block: the fork fills the screen as M17's chat does,
  `ChatHead` puts its `origin` after the workspace, `ChatEntryView` draws
  the line where it was forked as D16's `event` entry, and Back returns to
  the list, where `SidebarChatRow` draws the fork under bridge themes with
  D16's branch mark. M20 adds `SubtaskFields` (D17's model, task and
  note, which `SubtaskDialog` draws too) and `PhoneSubtask` (the Subtask
  form on the phone: `BottomSheet` titled "Start a subtask" with ×, the
  fields with the focus in the task and Start subtask across the sheet, no
  Cancel), which the chat actions' Subtask opens (`ui.chatDialog:
  'subtask'`) when the state has `data.subtask`; `SubtaskFields
  size="phone"` draws the note in `small`. M21 needs no new block: the
  chat fills the screen as M17's does, still Working with Stop, the line
  where the subtask started is D18's `event` entry, and Back returns to
  the list, where layout notes is D18's nested row under bridge themes.
  M22 adds `above` to `PhoneChat` (drawn over the composer, in
  `ChatPane`'s `above` slot): D20's `ChatToast` while `ui.toastOpen`, whose
  Undo closes it; the header names the workspace the chat moved to, and
  Back returns to the list, where the chat heads that workspace.
  M23 adds `rename` to `PhoneChat` (in `ChatHead`'s title place) and
  `size="phone"` to `ChatNameField` (160 wide): D21's field while
  `ui.renaming`, which Rename in the chat actions sheet opens; a tap
  outside saves the name in `ui.names`, × undoes the change. Either
  gives the focus back to the message box if it had it before Rename
  (`ui.refocusMessage`).
  T1 adds `MoveButton` (Move to…, a `Button size="xs"` with the move
  mark) and `moveTo` and `onMove` to `PhoneEditGroup`: in edit mode a chat
  in `data.phone.moveTo` shows Move to… in place of its status, which opens
  its actions (`ui.menuFor`, M9's sheet) with Move to workspace's list
  open; and `device` to `PhoneWorkspaceList` and `PhoneEditGroup` (the
  tablet's Container inset and header ends).
  T2 adds `device` to `PhoneChat` (at a tablet's width the header is
  `ChatHead size="full"`, 12 under the status bar, over `ChatPane
  size="tablet"`, 24 in from the sides and 16 under the rule) and to
  `PhoneSideChat` and `SideChatPanel` (in the tablet's sheet the parts sit
  23 in from its edges and the note is `bodySm`).
  T2b adds `trigger` to `ChatActionsMenu`: at a tablet's width the chat's
  bare ⋯ opens D2b's chat actions menu (`data.chatMenu`, `ui.menuFor`)
  in place of M4's sheet.
  T3 adds `device` to `PhoneSubagents` (the tablet's inset, the cards 12
  apart and no chevrons), `startedFrom` to the count line ("· started from
  bridge themes") and `onStartSubtask` (Start a subtask under the cards,
  with `panel.startSubtask`), which opens the Subtask form over the chat
  (`ui.chatDialog: 'subtask'`) when the state has `data.subtask`.
  T4 needs no new block: T2's chat with "/" typed after an attachment
  lists the skills over the composer, compact as M3 does (`SkillPicker
  layout="tablet"`, 40% of the composer as in a pane, R8), and the screen keeps its full height under the
  keyboard (LIBRARY_GAPS.md: Phone keyboard).
  T5 adds `device` and `chat` to `PhoneFolders` (at a tablet's width the
  sheet's title row is Folders with the chat's name after it and ×, drawn
  in the `ScrollFrame`'s header as the library's title row takes a string;
  the parts sit 23 in and 10 apart, and D4's Cancel and Add sit at the end
  of the foot), `size="tabletSheet"` to `FolderPickerList` (every part and
  row 10 apart) and `extraAfterLabel` to `ChatHead` (the folders chip after
  "context", not in its place).
  T6 needs no new block: T2's chat fills the screen with "/" typed after
  an attachment and the focus in the message box, the skills closed, as
  M17 does; the tablet has no split panes and no drop targets.
  T7 adds `layers` to `NewChatDialog` (D3's ids when not set): at a
  tablet's width `ui.newChatOpen` opens D3's dialog over T2's chat in
  place of M7's full-screen form, and the chat actions' New chat opens it
  in the current chat's workspace.
  T8 adds `layers` to `ForkDialog` (D15's ids when not set): at a
  tablet's width `ui.chatDialog: 'fork'` opens D15's dialog over T2's
  chat in place of M18's sheet.
  T9 needs no new block: the fork fills the screen as T6's chat does, with
  D16's origin and fork line (`ChatEntryView` puts an `event` entry's
  layer on a box as wide as its text), and Back returns to the list, where
  `SidebarChatRow` draws the fork under bridge themes with D16's branch
  mark.
  T10 adds `layers` to `SubtaskDialog` (D17's ids when not set): at a
  tablet's width `ui.chatDialog: 'subtask'` opens D17's dialog over T2's
  chat in place of M20's sheet, from the chat actions' Subtask or T3's Start
  a subtask.
  T11 needs no new block: the chat fills the screen as T6's does, still
  Working with Stop and an empty composer in focus, D18's line where the
  subtask started under Claude's reply, and D18's chat actions with
  Subagents · 3; Back returns to the list, where layout notes is D18's
  nested row under bridge themes.
  T12 needs no new block: T2b's `ChatActionsMenu` under the tablet's ⋯
  opens Move to workspace's list (`ui.moveOpen`, the-bridge in
  `ui.moveTarget`) as D19 does, which the library puts on the menu's left.
  T13 needs no new block: the chat fills the screen as T11's does, still
  Working with Stop and an empty composer in focus, its header names the
  workspace it moved to, and D20's `ChatToast` sits over the composer in
  `PhoneChat`'s `above` slot while `ui.toastOpen`, as in M22.
  T14 needs no new block: the chat fills the screen as T11's does, and
  Rename chat in T2b's menu opens M23's field (`ui.renaming`), at a
  tablet's width D21's `ChatNameField`, 300 wide; a tap outside saves the
  name, × undoes the change, and either gives the focus back to the
  message box if it had it before (`ui.refocusMessage`).
  Later frames add to these blocks.
- Sticky bars (d-107): a composer stays at the bottom and a header at the
  top of its pane, the chat alone, the side chat and the subagents panel,
  and only the content between them scrolls. `ChatPane` and
  `SubagentsPane` do it with the library's `ScrollFrame`; the Composer
  stops a long draft at 30% of its pane (each `PaneFrame` is a size
  container) and scrolls inside. `app/WorkspacesStickyBars.test.tsx`
  scrolls each and checks that the bars stay in view.
- `states/`: D1 `workbench`, D2 `sideChat`, D2b `chatActions`, D3
  `subagents` (from `chatActions`), D4 `folders` (from `chatActions`, with
  D3's sidebar), D5 `sideChatInPane` (from `workbench`), D6 `dragIntoPane`
  (from `chatActions`), D7 `chatInWorkbench` (from `chatActions`, with
  D1's bridge themes pane), D8 `dragOverPane` (from `chatInWorkbench`),
  D9 `twoPanes` (from `chatInWorkbench`, with D1's drift check pane),
  D10 `dragBelowPane` (from `twoPanes`, with D8's drag over a pane),
  D11 `threePanes` (from `twoPanes`, with D1's brain git shell pane),
  D12 `fourPanes` (from `threePanes`, with D1's four panes and D10's drag
  over a pane), D13 `emptiedPane` (D12's panes and status bar on
  `threePanes`, without the drag, and Close pane on the empty pane), D14
  `resizedPanes` (from `emptiedPane` with D11's panes, rows first, and
  the top row's handle dragged to 60 : 40), D15 `forkDialog` (from
  `chatActions`, without the side chat and the menu, and the Fork form
  open), D16 `forkedChat` (from `chatActions`, without the side chat and
  the menu: the fork under bridge themes, focused, Idle), D17
  `subtaskDialog` (from `chatActions`, without the side chat and the
  menu, and the Subtask form open), D18 `subtaskRunning` (from
  `chatActions`, without the side chat and the menu: the subtask layout
  notes under bridge themes, Running, and the line where it started),
  D19 `moveToWorkspace` (from `chatActions`, without the side chat:
  Move to workspace's list open, the-bridge highlighted), D20
  `movedChat` (from `chatActions`, without the side chat and the menu:
  bridge themes and theme tokens moved to the-bridge, now `current`, and
  the toast with Undo), D21 `renameChat` (from `chatActions`, without the
  side chat and the menu: the chat's name a field in its header), M1
  `phoneHome` (from `chatActions`, without the side chat, the drag, the
  hovered header and the menu, with `data.phone`; at a desktop width it
  draws bridge themes alone beside the sidebar), M2 `phoneEdit` (from
  `phoneHome`, in edit mode: bridge themes' name a field with "theme
  explorations", the-bridge's name a field, without theme tokens, and
  drift check with no status), M3 `phoneChat` (from `phoneHome`, with
  D1's bridge themes pane without the composer's model chip: "/" typed,
  the skills listed, the chat open on the phone), M4 `phoneChatActions`
  (from `phoneChat`, without the skills and the "/": the chat actions
  sheet open, Move to workspace's list open on the-bridge), M5
  `phoneSideChat` (from `phoneChatActions`, without the sheet: D2's side
  chat with M5's note, open in a sheet over the chat), M6
  `phoneSubagents` (from `phoneChatActions`, without the sheet: D3's
  subagents, Layout notes' transcript open, on the phone), M7
  `phoneNewChat` (from `phoneHome`, with D3's New chat form and its summary
  line: the form open on the phone), M8 `phoneFolders` (from `phoneChat`,
  with D4's drift check pane with Erik's message alone, its folders and
  its picker without Documents: the folders sheet open on the phone), M9
  `phoneHoldChat` (from `phoneHome`: drift check held, its actions open
  with Rename first and highlighted, Move to workspace closed), M10
  `phoneKeyboard` (from `phoneChat`, with D4's two folders and M8's chip:
  Erik's message and Claude's reply without Copy, "/wri" typed at the end
  of a message, /writer listed alone, the keyboard up), M11
  `phoneNewChatKeyboard` (from `phoneNewChat`: "theme tokens" typed in the
  name, which has the focus, Runs in without shell, omni-brain, the
  folders as one box, the keyboard up), M12 `phoneSubagentTranscript`
  (from `phoneSubagents`: Layout notes' full transcript open), M13
  `phoneCloseWorkspace` (from `phoneEdit`, without its fields and with
  bridge themes showing no status: the dialog that asks before omni-brain
  closes), M14 `phoneWorkspaceActions` (from `phoneHome`, with M2's Done
  and M13's dialog text: omni-brain's actions open in a sheet), M15
  `phoneAddMenu` (from `phoneHome`, with M2's Done and M7's New chat
  form: the menu that + opens), M16 `phoneTapChat` (from `phoneHome`,
  with M3's back label: the tap that opens bridge themes), M17
  `phoneChatFull` (from `phoneChat`, without the skills, the focus in the
  message box: the chat full screen), M18 `phoneFork` (from
  `phoneChatFull`, with D15's Fork form without the hint, M18's note, M4's
  chat actions and the message box empty and out of focus: the Fork sheet
  open on the phone), M19 `phoneForkedChat` (from `phoneChatFull`, with
  D16's fork under bridge themes: the fork full screen, Idle with no Stop,
  nothing typed and the focus in the message box), M20 `phoneSubtask`
  (from `phoneFork`, without the Fork form, with D17's Subtask form and
  M20's task: the Subtask sheet open on the phone), M21
  `phoneSubtaskRunning` (from `phoneChatFull`, with M18's empty message
  box, M4's chat actions with Subagents · 3 and D18's layout notes row:
  the chat full screen, Working, with the line where the subtask started),
  M22 `phoneMovedChat` (from `phoneChatFull`, with M18's empty message
  box, M4's chat actions and D20's move of bridge themes and theme tokens
  to the-bridge, now `current`: the chat full screen with the toast
  "Moved to the-bridge" and Undo), M23 `phoneRenameChat` (from
  `phoneChatFull`, with M18's empty message box, M4's chat actions and
  D21's rename: the chat full screen with its name a field in the header,
  the focus in the field), T1 `tabletEdit` (from `phoneEdit`, with
  bridge themes' name no field and M9's chat actions: edit mode on the
  tablet, the-bridge's name a field and Move to… on drift check), T2
  `tabletSideChat` (from `phoneSideChat`, with `tabletList` and T2's note:
  the side chat in a sheet over the chat on the tablet), T2b
  `tabletChatActions` (from `tabletSideChat`, without the sheet, with
  D2b's chat actions and Opus 5.5 in the composer: the chat actions menu
  under the ⋯ on the tablet), T3 `tabletSubagents` (from
  `tabletChatActions`, without the menu, with M6's subagents, no chevrons,
  and D17's Subtask form: the chat's subagents on the tablet with Start a
  subtask), T4 `tabletComposing` (from `tabletChatActions`, without the
  menu, with M3's "/" typed, requirements.md attached and the skills
  listed, and Claude's second reply: the chat on the tablet while Erik
  types), T5 `tabletFolders` (from `tabletChatActions`, without the menu,
  with Erik's message and Claude's reply alone, M8's folders sheet and D4's
  picker with Documents: the chat's folders on the tablet, the picker open),
  T6 `tabletOneChat` (from `tabletChatActions`, without the menu, with
  T4's composer and M17's focus in the message box: the chat full screen
  on the tablet), T7 `tabletNewChat` (from `tabletChatActions`, without
  the menu, with D3's New chat form open: the form in a dialog over the
  chat on the tablet), T8 `tabletFork` (from `tabletChatActions`, without
  the menu, with D15's Fork form open: the form in a dialog over the chat
  on the tablet), T9 `tabletForkedChat` (from `tabletOneChat`, with D16's
  fork under bridge themes and M19's empty composer: the fork full screen
  on the tablet, Idle with no Stop and the focus in the message box), T10
  `tabletSubtask` (from `tabletChatActions`, without the menu, with D17's
  Subtask form open: the form in a dialog over the chat on the tablet), T11
  `tabletSubtaskRunning` (from `tabletOneChat`, with M19's empty composer
  and D18's subtask row, line and chat actions: the chat full screen on
  the tablet, Working, with the line where the subtask started), T12
  `tabletMoveToWorkspace` (from `tabletChatActions`, with D19's list
  open on the-bridge: Move to workspace on the tablet), T13
  `tabletMovedChat` (from `tabletOneChat`, with M19's empty composer,
  D20's move of bridge themes and theme tokens to the-bridge, now
  `current`, and its toast: the chat full screen on the tablet with the
  toast "Moved bridge themes to the-bridge" and Undo), T14
  `tabletRenameChat` (from `tabletOneChat`, with M19's empty composer and
  D21's rename: the chat full screen on the tablet with its name a field
  in the header, the focus in the field).
  Later states start from
  `workbench`; the first key of `states/index.ts` is the page's default.
- `states/screens.ts`: the screen map (screen review R10), each screen's
  desktop, tablet and phone state, in the order of the D frames and then
  the screens with only tablet or phone states (the list, edit mode, the
  skills, the subagents, the keyboard views and the phone's sheets). The
  split panes and their drags (D1, D5, D6, D8 to D14) have no tablet or
  phone state (R19). D3 pairs with T7 and M7 as New chat; T3 and M6, the
  subagents, have no desktop state of their own. `states/screens.test.ts`
  checks that every state is in one screen, on its own device.
  `screens/WorkspacesScreens.stories.tsx` (`Pages/Workspaces/Screens`)
  draws each screen's states side by side; the per-state stories with
  their play tests stay in `screens/WorkspacesScreen.stories.tsx`
  (`Pages/Workspaces/States`). A new state goes into a screen there.
- `types.ts`: `WorkspacesData` (the workspaces, the current one's panes, a
  union on `type`: chat, shell or empty, the status bar, the pane menu and
  the skills; for D2 each workspace's chats, the sidebar's labels and the
  side chat; for D2b the chat actions and the frame's Figma `layers`,
  which the sidebar blocks put on `data-figma`, D2's when not set; for D3
  the subagents panel, the New chat form and the sidebar's `grip`; for D4 the folders, the
  folder picker, the sidebar's `counts` and `chatActions`; for D5 the side
  chat's `pane` and `openAsPane`, and the split's layers in `layers`
  (`emptyRows`: the empty pane's rows, as `EmptyPane` takes no
  `data-figma`); for
  D6 the drop zone's text, `paneDrop`, and for D8 its optional `hint` and
  `icon` and the zone's layers in `layers.dropZone`, for D12 its
  `preview`; for D13 the empty pane's `close` and its layers in
  `layers.emptyClose`; for D14 `split`, `resizeHint` and its layer in
  `layers.resizeHint`; for D15 `fork`, the Fork form; for D16 a sidebar
  chat's `mark`, a pane head's `origin` and the `event` chat entry; for
  D17 `subtask`, the Subtask form; for D20 `toast`, the toast's text and
  button, and its layer in `layers.toast`; for D21 the name field's layer
  in `layers.renameField`; for M1 `phone`, the phone's labels, and the
  phone list's layers in `layers.phoneList`, `phoneHeader`, `phoneEdit`,
  `phoneAdd` and `rowMenus`; for M2 `phone.done`, a chat's `hideStatus`
  and the fields' layers in `layers.renameFields`; for M3 `phone.back`
  and the layers `phoneBack` and `skills`; for M4 `phone.chatMenu`, the
  sheet's actions, and the sheet's icons in `layers.sheetIcons`; for M5
  the side chat's title row in `layers.sideHeader`; for M6 the subagents'
  `running` and `openTranscript` labels and the view's layers in
  `layers.subagentsHeader`, `subagentsTitle`, `subagentsCount` and
  `subagentChevrons`; for M7 the New chat form's `summary` and its models'
  `short` names, and the form's layers in `layers.newChatForm`; for M8 the
  folders' `chip` and the sheet's layers in `layers.phoneFolders`; for M9
  `phone.rowMenu`, a list chat's actions, and the lifted copy's layers in
  `layers.liftedRow` and `liftedMenu`; for M10 `skillsMatching`, the
  skill list's label once more than "/" is typed; for M11 the New chat
  form's `name.value`, `focus` and `foldersBox`, and the optional layers
  of `newChatForm` that M11 does not show; for M12 a subagent's `full`
  transcript, the panel's `fullTranscript` labels and the view's layers in
  `layers.subagentTranscript`; for M13 `phone.closeWorkspace`, the close
  dialog's text, and its layers in `layers.closeDialog`; for M14
  `phone.workspaceMenu`, a workspace's actions; for M15 `phone.addMenu`,
  the labels of the menu that + opens, and its layers in
  `layers.addMenu`; for M18 the Fork form's optional `name.hint` and the
  sheet's layers in `layers.phoneFork`; for M20 the Subtask sheet's layers
  in `layers.phoneSubtask`; for T1 `tabletList`, `phone.moveTo` and the
  Move to… buttons' layers in `layers.rowMoves`; for T5 the tablet's title
  row and Cancel in `layers.phoneFolders` (`title`, `cancel`); for T3 the subagents'
  `startedFrom` and `startSubtask` labels and Start a subtask's layer in
  `layers.subagentsStart`; for T7 the New chat dialog's layers in
  `layers.newChatDialog`; for T8 the Fork dialog's layers in
  `layers.forkDialog`; for T10 the Subtask dialog's layers in
  `layers.subtaskDialog`) and
  `WorkspacesUi` (the focused pane, the open menu and
  list with their highlighted row and workspace, the open skill list;
  for D2 the sidebar, closed groups, the hovered header, the drag and the side chat; for D3 the subagents panel
  and the New chat form, with the open transcripts; for D4 the folder
  list, the picker and the chosen folder; for D6 `paneDrag`, the chat
  dragged onto the chat alone and its edge; for D7 `workbench`, the
  workbench beside the sidebar; for D8 `paneDrag.pane`, the pane of the
  workbench a chat is dragged over; for D14 `resize`, the dragged handle
  of a rows-first split and its sizes, and `splitSizes`, each handle's
  sizes, so a drag of one handle leaves the others (the columns-first
  `SplitPanes`' handles too: `columns`, `left`, `right`); for D15 `chatDialog`,
  the chat action whose dialog is open, `subtask` in D17; for D20
  `toastOpen`, the toast shown; for D21 `renaming`, the name field open,
  and `names`, the names Erik gave chats, and `drafts`, the text Erik typed
  in each chat's composer; for M2 `editing`, the phone list's
  edit mode, `renamingChats` and `renamingWorkspaces`, the names that are
  fields with their text, and `workspaceNames`; for M3 `phoneView`, what
  fills the phone's screen, `subagents` in M6, `transcript` in M12 with
  `subagentFor`; for M10 `keyboardOpen`, the
  keyboard up over the phone's chat, and in M11 over New chat; for M13
  `closing`, the workspace whose close dialog is open, and
  `closedWorkspaces`; for M14 `workspaceMenuFor`, the workspace whose
  actions are open; for M15 `addMenuOpen`, `addedWorkspaces` and
  `newChatWorkspace`; for M17 `messageFocus`, the phone chat's message
  box in focus with the skills closed; for M23 `refocusMessage`, the box
  takes the focus back when the name field closes), each a Zod schema.
- `LIBRARY_GAPS.md`: what the Workbench frames need that the component
  library cannot draw yet, for the batched library PR.
