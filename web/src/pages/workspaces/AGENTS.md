# Workspaces page

The Workspaces page: the Workbench of Figma page 89:2, whose
references are in `references/workspaces/`. Read [../AGENTS.md](../AGENTS.md)
first: it says what each file of a page folder is for.

- `WorkspacesPage.tsx` is the connected entry; it passes the loader's
  state to the screen.
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
  panes, status bar) in place of the chat alone; then `ui.paneDrag.pane`
  (D8) puts the drop zone over that pane of the split.
- `blocks/`: `WorkbenchPanes` (the split, one to four panes clockwise
  from the top left, each pane by its `type`), `PaneFrame` (a pane's
  header through `PaneSlot`: kind mark, title, model, context, status,
  Maximise and the menu), `PaneMenu` (fork, side chat, subtask, Move to
  workspace with its list as the action's `submenu`, rename, close;
  compact rows, and the highlighted row and workspace from the state),
  `ChatPane` (the transcript in a `ScrollFrame` body and the composer in
  its footer; only a message that starts with "/" opens the skill list,
  and the focus stays in the box), `ChatEntryView` (one entry, by `type`),
  `SkillPicker` (the skills after "/": `Popover width="xs"` and a mono
  `OptionList` with no check), `ShellPane` (the library's `TerminalLines`
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
  pane's chat, with Open as its own pane), which `ChatPane` draws as its
  `overlay`. D6 adds `PaneDropZone` (the drop zone over the part of the
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
  `overlay.scrim`, and `data.paneDrop.preview: 'end'` puts the dragged
  chat at the end of the room under the text. D13 adds `close` to the
  empty pane (Close pane and its shortcut at the pane's top end, 12 in);
  the split keeps its four places, so the other panes stay where they
  are. Later frames add to these blocks.
- Sticky bars (d-107): a composer stays at the bottom and a header at the
  top of its pane, the chat alone, the side chat and the subagents panel,
  and only the content between them scrolls. `ChatPane` and
  `SubagentsPane` do it with the library's `ScrollFrame`; a long draft
  stops at `min(50vh, 50cqh)` (half the window, or half the pane: each
  `PaneFrame` is a size container) and scrolls inside. `app/WorkspacesStickyBars.test.tsx`
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
  `threePanes`, without the drag, and Close pane on the empty pane).
  Later states start from
  `workbench`; the first key of `states/index.ts` is the page's default.
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
  `layers.emptyClose`) and
  `WorkspacesUi` (the focused pane, the open menu and
  list with their highlighted row and workspace, the open skill list;
  for D2 the sidebar, closed groups, the hovered header, the drag and the side chat; for D3 the subagents panel
  and the New chat form, with the open transcripts; for D4 the folder
  list, the picker and the chosen folder; for D6 `paneDrag`, the chat
  dragged onto the chat alone and its edge; for D7 `workbench`, the
  workbench beside the sidebar; for D8 `paneDrag.pane`, the pane of the
  workbench a chat is dragged over), each a Zod schema.
- `LIBRARY_GAPS.md`: what the Workbench frames need that the component
  library cannot draw yet, for the batched library PR.
