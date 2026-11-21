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
  no line and no report. A stream that ends with an `error` event of
  kind `not-found` is a chat that left the list (after /clear or a closed
  pane, backend #313): it ends quietly, with no line, no report, no read
  and no connecting again; only the kind decides, never the message.
  Any other miss shows a quiet line with Retry in
  the pane (`blocks/TranscriptProblem.tsx`) and calls `report()` once for
  each outage of a shown chat, with the miss kind, the HTTP status and
  the chat ID only, never transcript text, a tool target or the server's
  message (`liveTranscript.test.ts`, `app/WorkspacesLiveTranscript.test.tsx`;
  the server fake is `lib/fakeTranscriptServer.ts`). A prompt sent
  with files (`UserEntry.files`) shows a chip for each name above its
  text, and a prompt of files alone the chips with no bubble
  (`blocks/ChatEntryView.tsx`, `app/WorkspacesEntryFiles.test.tsx`). A
  long name truncates in its chip, and a tap on the chip opens the whole
  name in a popover (`blocks/SentFileChip.tsx`). The library has no
  sent-file chip yet, so each chip is a `MetaChipButton`
  (LIBRARY_GAPS.md: Sent file chips).
  A slash command's error output (`ErrorEntry`) shows as an `event`
  entry labelled "Error" with its text.
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
  terminal input, then send", with no Retry and no report.
- That line offers "Clear the terminal input" (R28 part B), which asks
  first in a library confirm dialog (`blocks/ClearInputDialog.tsx`);
  Cancel does nothing. Clear posts `POST /api/chats/:chat/input/clear`
  with `{}` to the chat the line was made for (`liveSend.ts` binds it at
  send time), one at a time per chat, and a 204 sends the kept draft
  again through the normal send. A miss keeps the draft and says "Not
  cleared — …" by kind, with Retry (no second question) for a 5xx or no
  answer. A send that Claude Code did not take (409 notSubmitted) says
  "Not sent — the chat did not take the message" with Retry and no
  report; the clear's body is the contract's `ClearInputRequest`
  (`app/WorkspacesClearInput.test.tsx`). report() gets only a
  5xx or an answer the page does not expect, with the action, kind and
  status, never the message text (`app/WorkspacesLiveSend.test.tsx`). The
  requests go through the typed RPC client with the chat ID URL-encoded
  once, and the bodies are the contract's `SendPromptRequest` and
  `StopChatRequest` (backend #297).
- A live Claude chat takes files (W1b, `liveUploads.ts`, `useLiveUploads.ts`):
  the paperclip opens a hidden file input with no `accept` and no
  `capture` (a phone offers Photos, Camera and Files), and a drop on the
  composer or a paste of files adds them too. Each file starts at once:
  start, its chunks in order through XMLHttpRequest (60 s each, a miss on
  the network, a 5xx but 507, a 408 or a 429 goes again twice), then
  complete, at most two files at once; the chip shows the bytes sent.
  Retry goes on from the failed chunk with the same upload, or starts
  again after a 409 or a 404. Over 1 GiB fails on the page with no
  request, and the files past 10 are not added. Remove aborts and sends
  DELETE. Send is off while a file uploads or failed and while the text
  is over the limit; a send names the ready uploads in the chips' order
  and may have no text. The chips belong to the chat that added them. A
  line says "Not attached — <why>"; report() gets only a 5xx and an
  unexpected answer, with the step, kind and status, never a file name
  (`app/WorkspacesAttachments.test.tsx`, fake: `lib/fakeUploadServer.ts`).
  A sample chat keeps its drawn chips and a paperclip that does nothing; a
  live Codex chat and a shell have no paperclip. The calls go through
  the typed RPC client with each ID URL-encoded once, and the bodies are
  the contract's (backend #307 to #309). An upload's change renders only
  its chat's composers, never the page, a header or a transcript: each
  `ChatPane` reads its own chat's files through `ChatFiles` (`subscribe`,
  `view`), `liveUploads.ts` tells only the chats whose view changed, and
  a chunk's progress goes out at most once an animation frame (the #329
  flake, `app/WorkspacesUploadRenders.test.tsx`).
- A live Claude chat's model and effort are read-only (d-101, W5): the
  pane header and the chat header show "Opus 5.5 · high effort" as text
  (`PaneHead.effort`, `readOnlyModel`), the model alone when the effort is
  not known; the page has no model or effort picker.
- A live Claude chat's actions end with Compact context… and Clear
  context… (W5, `blocks/chatCommands.ts`): in the pane menu, the chat
  actions, the tablet's menu and the phone's sheet, on only while the
  chat is idle or done (the server refuses any other status, backend
  #317), none for a Codex chat or a shell. Each opens its page dialog
  (`ui.chatDialog`, for the chat in `ui.commandFor`,
  `blocks/ChatCommandDialog.tsx`): /compact with an
  optional one-line instructions field, /clear an `alertdialog` with Clear
  and Cancel. `liveSend.ts` posts `POST /api/chats/:chat/command` with the
  contract's `ChatCommandRequest`; a miss keeps the dialog with one line
  ("Not compacted — chat is working", "Not cleared — chat waits for an
  answer in the terminal"); a chat whose terminal input holds text offers
  "Clear the terminal input" as a send does, then posts the command again
  (`blocks/useCommandRun.ts`). report() gets only a 5xx or an answer the
  page does not expect, with the kind and status, never the instructions
  (`app/WorkspacesLiveCommands.test.tsx`).
- Pane follow (W5, `paneFollow.ts`): after a /clear, from the page or the
  terminal, the list drops the chat's ID and lists a new one on the same
  pane (`ChatSummary.pane`). The page store keeps the panes it last saw
  and moves the owner's ui changes from the old ID to the new one (open
  chat, phone view, saved panes and focus, names, menus) before the page
  draws the new list. The draft is not moved: it was for the old context.
  The old chat's file chips are dropped (aborted and deleted, as Remove
  does, `dropFiles`): the server holds each upload for the old chat.
  The server sends no event when herdr gives the chat its new ID, so after
  a /clear it sent the page reads the server's list, one read after
  another, until the cleared chat has left it (`readAfterClear`).
  The route tests' list fake is `lib/fakeWorkspacesServer.ts`.
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
- A composer's text lives in the page's draft book by chat id
  (`blocks/draftBook.ts`), outside the `ui`, so a pane that unmounts keeps
  its draft and a keystroke renders only its composer, never the page, a
  header or a transcript (review R28,
  `app/WorkspacesTypingRenders.test.tsx`). `WorkspacesPage` makes the book
  for the shown state and keeps it in the page store's drafts; a screen
  without one starts its own from `ui.drafts`. Key each `ChatPane` by its
  pane's id, so a switch mounts that chat's own draft.
- The transcript entries are memoised (`blocks/TranscriptEntries.tsx`,
  `ChatEntryView`, `EntryText`, review R28): keep their props stable, so
  a composer render does not parse every entry's Markdown again
  (`app/WorkspacesTypingRenders.test.tsx`).
- A sample chat's Send goes to the store's `send` through the library's
  `onSend`; a failed send keeps the draft (`WorkspacesSendDraft.test.tsx`).
- A send that ends after the owner opened another chat changes only the
  sent chat's draft, and only while it still holds the text sent
  (`DraftBook.clear`). `WorkspacesPage` merges each ui change into the ui
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
