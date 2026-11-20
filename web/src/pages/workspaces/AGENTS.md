# Workspaces page

The Workbench of Figma page 89:2: frames D (desktop), T (tablet) and M
(phone). The saved frames are in `references/workspaces/`; run
`pnpm fidelity workspaces <frameId>` from the repo root to compare one.

- A part the library cannot draw goes in `LIBRARY_GAPS.md` with the part
  used now; never hand-build it in a block.
- `liveWorkspaces.ts` maps the server's workspaces for `?source=live`
  (development only); on an error the page keeps the home's mock data.

## Rules

- `workspacesStore.ts` holds the owner's changes to the shown state's
  `ui`, so a page visit keeps them, and drops them when another
  `?state=` is shown (`app/WorkspacesRoute.test.tsx`).
- A composer's text lives in `ui.drafts` by chat id (`blocks/chatDraft.ts`),
  so a pane that unmounts keeps its draft. Key each `ChatPane` by its
  pane's id, so a switch mounts that chat's own draft.
- A chat's Send goes to the store's `send` through the library's
  `onSend`; a failed send keeps the draft (`WorkspacesSendDraft.test.tsx`).
- The screen lays out by its width (`ViewportFrame`): `data.phone` draws
  `WorkspacesPhone` at a phone's width, and at a tablet's width too with
  `data.tabletList`; every other case draws the desktop layout.
- `WorkspacesScreen` keeps the `ui` above both layouts, so a width
  change keeps what the owner changed (`WorkspacesLayout.test.tsx`).
- Each workspace keeps its own layout in `ui.layouts` by id (review R6,
  `blocks/workspaceLayout.ts`): its panes, handle sizes, focused pane
  and side chat. A resize or a closed pane changes only the shown
  workspace (`WorkspaceTabSwitch.test.tsx`).
- Sticky bars (d-107): a header and a composer stay in view and only the
  content between them scrolls, through the library's `ScrollFrame`
  (`app/WorkspacesStickyBars.test.tsx`).
- On the phone the tab bar lies over the list's foot (AppShell
  `tabBarOverlay`), and the last workspace scrolls clear of it
  (`app/PhoneTabBar.test.tsx`).
- The phone's chat and New chat are each one `ScrollFrame` straight in
  the AppShell detail, as the library docks only that frame's footer on
  the keyboard (review R20, `app/WorkspacesChatDock.test.tsx`). Name it
  a region with `blocks/frameRegion.ts`.
- The app does not size the screen to the area above the keyboard; that
  is the "Phone keyboard" row of `LIBRARY_GAPS.md`.

## Folders

- [screens/AGENTS.md](screens/AGENTS.md): read before you change a layout
  or a story.
- [blocks/AGENTS.md](blocks/AGENTS.md): read before you add or change a
  block.
- [states/AGENTS.md](states/AGENTS.md): read before you add a state for a
  Figma frame.
