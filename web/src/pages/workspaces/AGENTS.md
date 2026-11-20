# Workspaces page

The Workbench of Figma page 89:2: frames D (desktop), T (tablet) and M
(phone). The saved frames are in `references/workspaces/`; run
`pnpm fidelity workspaces <frameId>` from the repo root to compare one.

- A part the library cannot draw goes in `LIBRARY_GAPS.md` with the part
  used now; never hand-build it in a block.
- In development the home reads the live source (d-117): with no
  `?state=` and no `?source=`, and with `?source=live`. `?source=fixtures`
  shows the home's sample data, and a `?state=` its fixture state.
  `liveWorkspaces.ts` maps the server's workspaces, with a pane for each
  chat whose transcript or terminal says it is not live yet
  (`blocks/NotLive.tsx`). A live chat's composer is disabled and says
  "Sending not live yet" (`composer.notLive`), so no message goes to the
  store's `send`, which goes nowhere. On an expected miss the page shows no
  workspaces, never the sample ones, and `blocks/LiveNotice.tsx` with
  Retry in every layout; any other error goes to RouteError
  (`app/WorkspacesLiveDefault.test.tsx`).
- Each live workspace's panes are its herdr layout's active tab (slice
  3a): `liveWorkspaces.ts` reads `GET /api/workspaces/:workspace/layout`
  on load, on `workspaces.changed` and on that workspace's
  `layout.changed`, and `liveLayout.ts` maps the split tree to the
  page's splits by the rule in its header: the focused pane and its
  nearest neighbours when the tab has more than four, each pane's share
  of the whole tab scaled to fill the space. A layout read that misses
  keeps the first four chats as the panes, says "Layout not live — first
  4 chats" in the status bar until a load reads every layout, and calls
  `report()` once for each outage (d-115,
  `app/WorkspacesLiveLayout.test.tsx`).
- A stacked pane is never lower than its header and composer
  (`blocks/paneFloors.ts`, measured, as no library token gives that
  height); the room comes from the largest pane.

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
