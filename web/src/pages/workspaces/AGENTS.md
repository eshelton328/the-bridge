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
  chat; a shell's terminal and a Codex chat's transcript say they are not
  live yet (`blocks/NotLive.tsx`). A live Codex chat's composer is disabled
  and says "Sending not live yet" (`composer.notLive`) until W8. On an
  expected miss the page shows no
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
- A live Claude chat's pane shows its transcript (slice 3b):
  `liveTranscript.ts` opens `GET /api/chats/:chat/transcript/events`,
  then reads `GET /api/chats/:chat/transcript`, and applies each
  `transcript.changed` by entry ID, only while the pane shows (ChatPane
  calls the page's `TranscriptWatch`, `useLiveTranscripts.ts`). A stream
  route that answers 404 (a server before backend 3b-3) gives one read,
  no line and no report. Any other miss shows a quiet line with Retry in
  the pane (`blocks/TranscriptProblem.tsx`) and calls `report()` once for
  each outage of a shown chat, with the miss kind, the HTTP status and
  the chat ID only, never transcript text, a tool target or the server's
  message (`liveTranscript.test.ts`, `app/WorkspacesLiveTranscript.test.tsx`;
  the server fake is `lib/fakeTranscriptServer.ts`).
- A live Claude chat sends and stops (W1): `liveSend.ts` posts
  `POST /api/chats/:chat/prompt` with `{ text }` and `.../stop` with `{}`
  to the chat whose composer sent it, read at send time, and a 204 empties
  the box; the prompt shows when the transcript stream brings it, and the
  status when the workspace events do. The composer shows Stop only while
  the chat works. One send and one stop are in flight at a time, a text
  over `maxPromptChars` is not sent, and a miss keeps the text and shows
  one quiet line under the composer by kind ("Not sent — herdr-unavailable",
  with Retry for a 5xx, no answer or a 429); a Stop that finds the chat not
  working is quiet (`blocks/useComposerActions.ts`). A send to a chat whose
  terminal input holds text, or one the server cannot read (409
  inputNotEmpty, W1-3: a Stop puts the stopped prompt back there),
  keeps the draft and says "Not sent — clear the text in the chat's
  terminal input, then send", with no Retry and no report. report() gets only a
  5xx or an answer the page does not expect, with the action, kind and
  status, never the message text (`app/WorkspacesLiveSend.test.tsx`). The
  requests go through the typed RPC client with the chat ID URL-encoded
  once, and the bodies are the contract's `SendPromptRequest` and
  `StopChatRequest` (backend #297).
- A live chat opens at its newest entry and stays there as entries come
  in, unless the reader scrolled up; back at the end, it follows again
  (`blocks/usePinnedEnd.ts`, `app/WorkspacesTranscriptScroll.test.tsx`).
  Fixture chats keep their scroll, so the fidelity frames do not move.
- A message's and a reply's text renders as Markdown in the library's
  `MarkdownView`, as the Inbox detail draws its text
  (`blocks/EntryText.tsx`): HTML in the text stays text, a link keeps
  only a safe URL, and an image shows its alt text.
- A stacked pane is never lower than its header and composer
  (`blocks/paneFloors.ts`, measured, as no library token gives that
  height); the room comes from the largest pane.

## Rules

- Each transcript and terminal renders in a `BlockBoundary` keyed by its
  chat or pane id, so one bad entry keeps the chat on screen
  (`TranscriptBoundary.test.tsx`, audit P-1).
- `WorkspacesPage` saves the composer drafts in sessionStorage by chat id
  (`draftStorage.ts`) and reads them back on load, so Reload app keeps
  them; never localStorage (`app/WorkspacesRouteRecovery.test.tsx`,
  audit W-10).
- `workspacesStore.ts` holds the owner's changes to the shown state's
  `ui`, so a page visit keeps them, and drops them when another
  `?state=` is shown (`app/WorkspacesRoute.test.tsx`).
- A composer's text lives in `ui.drafts` by chat id (`blocks/chatDraft.ts`),
  so a pane that unmounts keeps its draft. Key each `ChatPane` by its
  pane's id, so a switch mounts that chat's own draft.
- A sample chat's Send goes to the store's `send` through the library's
  `onSend`; a failed send keeps the draft (`WorkspacesSendDraft.test.tsx`).
- A send that ends after the owner opened another chat changes only the
  sent chat's draft: `WorkspacesPage` merges each ui change into the ui
  shown now, not the one of the render that sent it.
- Every reply's Copy, sample or live, goes through the screen's `onCopy`
  to `WorkspacesPage`, which copies with `copyText`; the button
  (`blocks/ReplyCopyButton.tsx`) reads Copied or Copy failed for 2 s. A
  fault goes to `report()` with the clipboard's error only, never the
  reply's text (audit P-4, `app/WorkspacesReplyCopy.test.tsx`).
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
