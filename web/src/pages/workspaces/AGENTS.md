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
- `blocks/`: `WorkbenchPanes` (the split, one to four panes clockwise
  from the top left, each pane by its `type`), `PaneFrame` (a pane's
  header through `PaneSlot`: kind mark, title, model, context, status,
  Maximise and the menu), `PaneMenu` (fork, side chat, subtask, Move to
  workspace with its list, rename, close), `ChatPane` (the transcript
  and the composer), `ChatEntryView` (one entry, by `type`),
  `SkillPicker` (the skills after "/"), `ShellPane` (terminal lines) and
  `EmptyPane` (start a chat, or open one of the workspace). Later frames
  add to these blocks.
- `states/`: D1 `workbench`. Later states start from it.
- `types.ts`: `WorkspacesData` (the workspaces, the current one's panes, a
  union on `type`: chat, shell or empty, the status bar, the pane menu and
  the skills) and `WorkspacesUi` (the focused pane, the open menu and
  list, the open skill list), each a Zod schema.
- `LIBRARY_GAPS.md`: what the Workbench frames need that the component
  library cannot draw yet, for the batched library PR.
