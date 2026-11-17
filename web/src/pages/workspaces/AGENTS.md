# Workspaces page

The Workspaces page: the Workbench of Figma page 89:2, whose
references are in `references/workspaces/`. Read [../AGENTS.md](../AGENTS.md)
first: it says what each file of a page folder is for.

- `WorkspacesPage.tsx` is the connected entry; it passes the loader's
  state to the screen.
- `screens/WorkspacesScreen.tsx`: the rail (`AppRail`) and the library's
  `Workbench`: the workspace tabs with New chat and the sidebar toggle,
  the current workspace's panes and the status bar. It keeps what Erik
  opens or closes (a pane menu, Move to workspace, the skill list, the
  focused pane) until the state changes, and reports it with `onUiChange`.
  With `ui.sidebar` (D2) it shows the workspace sidebar in the list slot,
  the focused chat alone in the detail and its side chat in the side slot;
  with `ui.subagentsOpen` (D3) the subagents panel takes the side slot,
  420 wide, and `ui.newChatOpen` opens the New chat form over the screen.
- `blocks/`: `WorkbenchPanes` (the split, one to four panes clockwise
  from the top left, each pane by its `type`), `PaneFrame` (a pane's
  header through `PaneSlot`: kind mark, title, model, context, status,
  Maximise and the menu), `PaneMenu` (fork, side chat, subtask, Move to
  workspace with its list, rename, close), `ChatPane` (the transcript
  and the composer), `ChatEntryView` (one entry, by `type`),
  `SkillPicker` (the skills after "/"), `ShellPane` (terminal lines) and
  `EmptyPane` (start a chat, or open one of the workspace). D2 adds
  `WorkspaceSidebar` (the title, the toggle, + and the groups),
  `SidebarGroup` (a workspace's header and chats, the drop target and the
  dragged chat), `SidebarChatRow`, `MainChat` (the chat alone: `ChatHead`
  over `ChatPane size="full"`) and `SideChatPanel`. D2b adds
  `ChatActionsMenu` (the `PaneMenu` behind the chat header's ⋯). D3 adds
  `SubagentsPane` (the title, the count, Close and the cards),
  `SubagentCard` (one subagent with its transcript and Stop),
  `NewChatDialog` (the New chat form in `Dialog size="lg"`), `FormField`
  (a field's capital label and hint over its control) and `SelectField`
  (a closed choice: a `RadioMenu` behind a field-wide button). Later
  frames add to these blocks.
- `states/`: D1 `workbench`, D2 `sideChat`, D2b `chatActions`, D3
  `subagents` (from `chatActions`). Later states start from
  `workbench`; the first key of `states/index.ts` is the page's default.
- `types.ts`: `WorkspacesData` (the workspaces, the current one's panes, a
  union on `type`: chat, shell or empty, the status bar, the pane menu and
  the skills; for D2 each workspace's chats, the sidebar's labels and the
  side chat; for D2b the chat actions and the frame's Figma `layers`,
  which the sidebar blocks put on `data-figma`, D2's when not set; for D3
  the subagents panel and the New chat form) and
  `WorkspacesUi` (the focused pane, the open menu and
  list, the open skill list; for D2 the sidebar, closed groups, the
  hovered header, the drag and the side chat; for D3 the subagents panel
  and the New chat form, with the open transcripts), each a Zod schema.
- `LIBRARY_GAPS.md`: what the Workbench frames need that the component
  library cannot draw yet, for the batched library PR.
