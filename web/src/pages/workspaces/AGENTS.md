# Workspaces page

The Workbench of Figma page 89:2: frames D (desktop), T (tablet) and M
(phone). The saved frames are in `references/workspaces/`; run
`pnpm fidelity workspaces <frameId>` from the repo root to compare one.

- A part the library cannot draw goes in `LIBRARY_GAPS.md` with the part
  used now; never hand-build it in a block.
- `?chat=<chat ID>` opens that live chat as a tap on its row would, full
  screen on the phone, then leaves the URL (`useChatLink.ts`): a tap on
  a push notification links there (d-118, `app/push/AGENTS.md`). A chat
  the live data does not list opens nothing.
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
  (`app/WorkspacesLiveDefault.test.tsx`). The live page offers only what
  a route backs (reviews R41, R42): a live chat's actions are New chat,
  Fork (a Claude chat only), Side chat (a Claude chat only), Move to
  workspace, Rename chat (Rename in the phone's sheet), Close pane…,
  Compact context… and Clear context… (with the layout actions in a
  desktop pane, whose menu has no Rename, as it has no name field).
  Subtask stays hidden until its route comes. The fixture states keep every action, and their edit mode
  every control (`app/WorkspacesLiveUnbacked.test.tsx`).
- The live list's edits (R41, R42, backend #423 and #427; `useWorkspaceEdits.ts`,
  `liveWorkspaceEdits.ts`): the phone's and tablet's Edit opens edit
  mode with Done, which on live draws only what a route backs. Each
  workspace has a handle (`blocks/ReorderHandle.tsx`,
  `blocks/useWorkspaceReorder.ts`), Rename, and × when it has a chat. A drag on
  the handle, or an arrow key on the focused handle, posts `POST
  /api/workspaces/order` with the whole list in the new order; the page
  holds that order until the list read after `workspaces.changed`. While
  a drag runs every group shows its header only, a pointer held near the
  list's top or bottom edge scrolls it, and only the pointer that started
  the drag moves or ends it. Rename
  opens the name as a field, which posts `POST
  /api/workspaces/:workspace/rename`. A chat's Rename posts `POST
  /api/chats/:chat/rename`, herdr's label of its pane, which the list
  shows as the chat's title. × opens the close dialog
  (`blocks/CloseWorkspaceDialog.tsx` with `closeWorkspace.listed`), which
  names the workspace, says how many chats end and lists each by its
  title from the list data; Close posts `POST
  /api/workspaces/:workspace/close` with `{ confirm, panes }`, the
  workspace's ID and that count, and never herdr's group close. The
  workspace leaves only with the list read after the 204. A 409
  `workspace-not-ready` shows one plain line by state (`working`,
  `needsYou`, `holdsServer`, `group`, with no force), and `panesChanged`
  reads the list again and opens the dialog again with the new list; a
  400 or a 404 shows one line and reads the list again
  (`app/WorkspacesLiveClose.test.tsx`). The chats have no handle, no
  field and no Move to… in edit mode: ordering chats has no route, and a
  chat moves from its actions. A name is trimmed; an empty
  one or the same name is not sent, and one the contract's `Label`
  refuses (over 64 characters, a control character) shows a line and is
  not sent. A new name or order shows only from the list read, never
  before, so a miss leaves the old one. One edit at a time; 409
  orderStale and a 404 read the list again with a line, a 400 shows the
  server's message as one line, and any other miss "Not renamed —
  <kind>". The line draws under the live notice in every layout, with
  Dismiss. report() gets only a 5xx or an unexpected answer, with the
  action, kind and status (`app/WorkspacesLiveEdits.test.tsx`; the fake
  is `lib/fakeWorkspacesServer.ts`).
- New workspace (W4, R59 part 2, backend #471, `blocks/NewWorkspaceDialog.tsx`):
  the phone's and the tablet's + menu (M15) and the desktop sidebar's +
  (D2 105:617) open one library `Dialog` at every size (`ui.newWorkspaceOpen`),
  with an optional name field. Create, or Enter, posts `POST
  /api/workspaces` with the contract's `CreateWorkspaceRequest`: the
  trimmed name, or none when the field is empty, so the server names it
  "untitled". A name the contract's `Label` refuses is the field's error
  and is not sent. A 201 closes the dialog, and the workspace opens as a
  click on its tab does (`switchTo`) with the first list read that shows
  it, after `workspaces.changed` or the page's own read 2.5 s later. A
  400 shows the server's words as the field's error; herdr's 502 and 503,
  a 5xx with no error body and an unreachable server show "Not made —
  <kind>" with Retry, which posts the same name again; no answer in 30 s
  says the list shows the workspace if it was made, with no Retry. It is
  one of the list's edits, so one at a time with them, and report() gets
  only a 5xx or an unexpected answer, by kind and status, never the name.
  M15 draws New workspace as a workspace added with its name a field in
  edit mode; the fixtures keep that, and the live page asks for the name
  first, as the desktop has no such field
  (`app/WorkspacesLiveCreate.test.tsx`; the fake is
  `lib/fakeWorkspacesServer.ts`).
- Move to workspace (backend #435, `blocks/moveToWorkspace.ts`): a
  live chat's actions in the phone's sheet, the tablet's menu and the
  desktop's chat and pane menus list the other workspaces of the list,
  never the chat's own and with no New workspace row (the create route
  makes an empty workspace and does not move a chat into it); with no other workspace there is no Move to workspace. A pick
  posts `POST /api/chats/:chat/workspace` with `{ workspace }`
  (`liveWorkspaceEdits.ts`, the contract's `MoveToWorkspaceRequest`).
  A chat that is its workspace's last asks first in a library
  `alertdialog` ("Move <chat> to <workspace>?", "Moving it closes
  <workspace>.", `blocks/MoveWorkspaceDialog.tsx`, `ui.moveAsk`), as the
  move closes that workspace; Cancel sends nothing. A 200 keeps the chat
  ID: the first list read that shows it in its new workspace, however
  late, opens it there as a tap on its row would and selects that
  workspace (`useWorkspaceEdits` `onMoved`, `openMoved`); herdr puts it in
  a new tab there, which the workbench shows once a layout read lists it
  (`followTab`, as after Move to tab), and a workspace
  it left empty (`sourceClosed`) leaves with that read. 409
  chat-not-ready shows one line by state: `sameWorkspace` ("It is
  already in <workspace>"), `working`, `needsYou`, `holdsServer`; a 404
  says "Not moved — that chat or workspace is gone" and reads the list
  again. It is one of the list's edits, so one at a time and report()
  only for a 5xx or an unexpected answer (`app/WorkspacesLiveMove.test.tsx`).
- Fork (backend #443, `liveWorkspaceEdits.ts` `forkChat`,
  `useForkedChat.ts`): a live Claude chat's Fork, in the phone's sheet, the
  tablet's menu and the desktop's chat and pane menus, after New chat,
  posts `POST /api/chats/:chat/fork` with the contract's `ForkChatRequest`
  holding a new create ID only, at once with no form: the server names the
  copy the first free of "<name>-fork" and "-fork-2" to "-fork-9"
  (backend #446) and splits it beside the chat to the right. Figma's
  Fork form (D15, T8, M18) stays the fixtures' own, as no route forks up
  to a picked message. A Codex chat and a shell have no Fork on the live
  page (`blocks/chatCommands.ts` `withCommands`), as the server answers
  them 409 `noSession`. The answer (201, `StartChatResponse`) names the
  new pane: the chat opens as a new chat does (`openListedChat.ts`, shared
  with `useNewChat.ts`) once the list shows it on that pane ready or
  needing the owner, and one that needs the owner gets "This chat needs
  you on the Mac" under its composer; a `starting` answer waits for
  `workspaces.changed`. The wait is bounded, as Claude can still end at
  its start in the new pane (the #443 real run; since #446 a session with
  no saved turn is refused before any pane): a list read after the answer that shows the pane as a shell
  reads the list again after 2.5 s, and a later read that still does
  ends the wait with "Fork did not start — Claude ended in its new pane;
  look at it on the Mac"; no chat by 75 s ends it with "Fork did not
  start". The chat it came from goes on. A fork is one of
  the list's edits, so one at a time with them, its miss one line with
  Dismiss: 409 `noSession` (a chat with no saved turn yet, such as a
  fresh fork: "the chat has no saved turn yet; send it a message first"),
  `nameTaken` ("another chat has the fork’s name", past "-fork-9") and
  `folderNotAllowed` each have their line, a 404 says "Not forked — that
  chat is gone" and reads the list again, a 5xx "Not forked — <kind>"
  with a report (kind and status only), and no answer in 75 s says the
  list shows the chat if it started (`app/WorkspacesLiveFork.test.tsx`;
  the fake is `lib/fakeWorkspacesServer.ts`).
- Side chat (backend #456, #460, `liveSide.ts`, `useSideChats.ts`): a
  live Claude chat's Side chat, in the phone's sheet ("Side chat"), the
  tablet's menu and the desktop's chat and pane menus ("Side chat
  (/btw)"), after Fork, opens the side chat for that chat
  (`ui.sideChatFor`): the phone's and the tablet's sheet (M5, T2), the
  panel beside the desktop's chat (D2), or inside its pane of the
  workbench (D5). The page draws it in `data.sideChat` from the chat's
  questions, kept in page memory by the chat's server ID while the page
  is open. Send posts `POST /api/chats/:chat/side` with the contract's
  `SideQuestionRequest`, the question only, as it is: nothing of the
  earlier questions goes with it, as a new copy of the chat's session
  answers each one. With the 202's side ID the page reads `GET
  /api/chats/:chat/side/:side` every 500 ms until the answer's last
  state, and never holds the server's event stream of it: with the
  transcript streams and `/api/events`, one more held connection would
  take the browser's last HTTP/1.1 connection to the host, and Stop or a
  send would wait behind it (review of #477). "Asking…" then
  "Answering…" shows until text comes. A read that misses is read again
  for up to 150 s; a 404 says "This answer is gone — the server
  restarted", and no answer by 150 s says "Answer not live — the server
  did not answer" with a report. An ask that answers after the page left
  starts no reads. `failed`, `timedOut` ("Stopped after 2 minutes") and
  `cut` each have their line. The chat never sees the question or the answer. One question of
  a chat at a time: a second says "Not asked — a side question is still
  answering" with no request; over `maxSideQuestion` is not sent. A
  miss puts the question back in the box with one line by kind: 409
  `noSession`, `sideBusy` (with Retry), a 404, a 400 (the server's
  message), and any other "Not asked — <kind>", with Retry for a 5xx, a
  429 or no answer. report() gets only an ask's 5xx, and once per answer
  a read's error status, a lost answer or an answer the page does not
  expect, with the step, kind and status, never the
  question, the answer or a chat ID. The composer has no paperclip and
  the pane no "Open as its own pane", as no route takes them. While a
  question waits (`waiting`), the composer draws Stop, which posts
  `POST /api/chats/:chat/side/:side/stop` (backend #465): the answer
  ends `stopped` ("Stopped — the answer ends here") with the text so far, and
  a stop that misses is a quiet "Not stopped — …" line with no report().
  The side chat keeps its unsent question in the page's drafts by its own
  id (`side:<pane>`), so a close loses none of it, and its transcript
  follows the answer's end as a live chat's does (ChatPane `follows`).
  The phone's and the tablet's sheet docks on the keyboard while its box
  has the focus (`keyboardDock`, library #347) and the main composer
  stays put; it closes only on ×, a swipe from the grabber, Escape and,
  on the phone, a tap on the scrim (`closeOn`), never on a press on the
  chat above the tablet's sheet, a focus or the keyboard (screen review R71,
  `app/WorkspacesSideChatDock.test.tsx`). A Codex chat and a shell
  have no Side chat (`withCommands`), as the server answers them 409
  `noSession` (`app/WorkspacesLiveSide.test.tsx`; the fake is
  `lib/fakeSideServer.ts`).
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
  `app/WorkspacesLiveLayout.test.tsx`). A layout read with no answer at
  all (no status) while the page is hidden, after it hid during the read
  or within 5 s after it showed again is iOS closing it in the
  background (`lib/pageResume.ts`): no line and no report, and it reads
  again once the page shows, at once if it does; one such miss for each
  trip. An answer from the server, a 5xx too, is reported as before. The
  list read (`GET /api/workspaces`) takes the same rule: such a miss
  shows no notice and reads the list again once the page shows; a second
  one in the same trip, or any answer from the server, shows the notice
  (`app/WorkspacesLiveListResume.test.tsx`).
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
  the server fake is `lib/fakeTranscriptServer.ts`). A server restart
  ends every stream with no `error` event (review R43): a stream that
  read the transcript and then ends or drops so starts a 10 s grace
  (`reconnectGraceMs`), and until it passes that end and each miss of
  the reconnects (no answer, a 5xx) show no line and report nothing. The
  first read that answers ends it and shows the entries written
  meanwhile; a miss after the window shows the line and reports once.
  An `error` event (a failed watch, review R35), an event the page
  cannot read, a refusal and a read that missed show at once. The event
  stream's "Live updates lost" in the desktop status bar waits for the
  same window (`app/WorkspacesQuietReconnect.test.tsx`). A list read with
  no answer (no status, a timeout, a 5xx with no error body) after the
  page showed a list keeps that list and its cached layouts, with no
  notice, for the same window; a miss after it shows the notice, and a
  4xx or an error body shows it at once (review R43b). A stream that
  gives no byte for 45 s, pings too, is lost: `lib/eventFrames.ts` closes
  it and the page connects again as after a drop (a killed server behind
  the Vite proxy never ends it). iOS closes the
  stream of a page in the background: a stream that ends or drops, or a
  stream or read with no answer, while the page is hidden, after it hid
  during the connection or within 5 s after it showed again, gives no
  line and no report (`lib/pageResume.ts`). Hidden, the page connects again
  after the retry time; shown, at once. A visible page takes one such
  quiet miss for each trip to the background, none if a miss came while
  hidden, and an answer from the server is never quiet
  (`app/WorkspacesLiveTranscript.test.tsx`, `lib/pageResume.test.ts`). A prompt sent
  with files (`UserEntry.files`) shows a chip for each name above its
  text, and a prompt of files alone the chips with no bubble
  (`blocks/ChatEntryView.tsx`, `app/WorkspacesEntryFiles.test.tsx`). A
  long name truncates in its chip, and a tap on the chip opens the whole
  name in a popover (`blocks/SentFileChip.tsx`). The library has no
  sent-file chip yet, so each chip is a `MetaChipButton`
  (LIBRARY_GAPS.md: Sent file chips).
  A slash command's error output (`ErrorEntry`) shows as an `event`
  entry labelled "Error" with its text. A harness note (`NoteEntry`,
  R46: a task's report, a Stop hook) is a `note` entry: a small
  `fg.muted` line with its kind's library icon (task `AgentIcon`, hook
  `HookIcon`, named Task, Hook) and no bubble, never the owner's bubble
  or its colour (`blocks/NoteLine.tsx`). A `peer` note (R55: a
  SendMessage message or a prompt another chat typed in an
  `<agent-prompt>` wrapper; the server decides which lines are peer
  notes, #454) is a `peer` entry, drawn as the library's
  `Message from="peer"`: an amber start bar and "From <name>" with the
  chat icon, its `message` text as Markdown (`EntryText`) and the cut
  line, or the label alone when the note has no `message`. The sender
  is `message.from`, "another chat" when null, or for a note with no
  `message` the name in its "Message from <name>" text
  (`liveTranscript.ts`, `app/WorkspacesNoteLines.test.tsx`). Figma
  draws neither.
- A reply that a Stop hook had written again (R62, backend #470): the
  server marks the draft with `replacedBy`, the rewrite's entry ID. A
  draft whose rewrite is in the transcript is not a reply of its own
  (`rewrittenReplies.ts`, `withTranscripts`): the rewrite carries it, and
  beside its Copy a "Reply rewritten" button (`aria-expanded`) shows the
  drafts under it, oldest first, each as a `Message` named "Draft"
  (`blocks/ReplyEntry.tsx`; LIBRARY_GAPS.md: Rewritten reply note). With
  several rejections in a row the last reply carries every draft. A draft
  whose rewrite is not there (not yet come, or before the 500) shows as a
  reply; when the rewrite comes it folds away. A live entry is keyed by
  its ID (`TranscriptEntries`), so the fold mounts no other entry
  (`rewrittenReplies.test.ts`, `app/WorkspacesRewrittenReply.test.tsx`).
- A live tool call (review R32, backend #371) carries its `kind`, a
  readable `title` and its own one-line `label`: it draws its kind's
  icon, the title and the label in a quieter colour on one line
  (`blocks/ToolRow.tsx`); the raw tool name is only the icon's title. A
  run of two or more such calls between other entries is one row with a
  summary of its kinds and counts in order, "Ran 3 commands, read 2
  files" (`blocks/toolGroups.ts`), whose tap opens the run's rows
  (`blocks/ToolGroup.tsx`); the open state is the group's own, so a tap
  renders no other entry, and its first call's entry ID keys it, so it
  stays open while older entries drop off the 500 cap. The newest run of a working chat stays open
  until an entry follows it. A call without a kind (the fixtures, an
  older server) draws as Figma's tool line and is never grouped
  (`app/WorkspacesToolRows.test.tsx`; LIBRARY_GAPS.md: Tool row icon and
  label, Tool group row).
- A live Claude chat sends and stops (W1): `liveSend.ts` posts
  `POST /api/chats/:chat/prompt` with `{ text }` and `.../stop` with `{}`
  to the chat whose composer sent it, read at send time. The box empties
  as the send starts, and the text shows at once after the entries as a
  pending bubble with its file chips and "Sending…" (`livePending.ts`,
  `useLivePending.ts`, `blocks/PendingEntry.tsx`; the composer's chips of
  the send move into it). The bubble is not a transcript entry: the
  pane reads it itself (`ChatPending`), so it renders no other entry, and
  it goes in the render that draws the stream's new `user` entry with the
  same text (trimmed) and file names (`sentFileName`), so the text never
  shows twice. A 204 drops "Sending…", and the bubble stays until the
  entry comes, wherever it lands (a prompt queued while the chat works
  comes after the replies meanwhile, backend #343), or until a transcript
  read from 10 s after the 204.
  A miss removes it and puts the text back in the box, before any text
  typed meanwhile (`DraftBook.restore`); a pane that stops showing the
  chat (a chat switch, a /clear) drops it. Neither the text nor a file
  name goes to report() or a log (`app/WorkspacesPendingSend.test.tsx`).
  Each Send, a Retry and the send after a clear too, carries a new
  `sendId` (backend #369; the server refuses an ID it has seen with 409
  duplicateSend). Until its answer or its entry comes, the send stays in
  sessionStorage beside the drafts (`draftStorage.ts`: chat, server chat
  ID, send ID, text, file names, time; never a file's bytes). A reload
  meanwhile reads `GET /api/chats/:chat/sends/:send` on load
  (`keptSends.ts`): `pending` reads again 1.5 s later, at most 5 times;
  `sent` forgets it; `notSent` and `notSubmitted` put the text back before
  any newer draft with the miss's line; `unknown`, a 404, 5 pending reads
  or a send older than 10 min (no read) put it back with "This message may
  have been sent". A read with no answer keeps it for the next time its
  chat opens or the next load. A send whose request got no answer (a
  reload ends it so in WebKit, after `beforeunload`) stays kept, marked
  `restored`, as the composer put its text back: on load, `sent` takes
  the text back out of the draft (`DraftBook.withdraw`), and another
  result shows its line without putting it back twice. A restored send
  whose text the owner changed or cleared, or whose chat sends again, is
  forgotten. The line is the chat's notice in
  `livePending.ts` until its next send. The page never sends it again
  itself, and the read reports nothing (`app/WorkspacesSendReload.test.tsx`).
  The status shows when the workspace events bring it. The composer shows Stop only while
  the chat works. One send and one stop are in flight at a time, a text
  over `maxPromptChars` is not sent, and a miss puts the text back and shows
  one quiet line under the composer by kind ("Not sent — herdr-unavailable",
  with Retry for a 5xx, no answer or a 429); a Stop that finds the chat not
  working is quiet (`blocks/useComposerActions.ts`). A send to a chat whose
  terminal input holds text (409 inputNotEmpty, W1-3: a Stop puts the
  stopped prompt back there) keeps the draft and says "Not sent — clear
  the text in the chat's terminal input, then send", with no Retry and no
  report.
- A terminal dialog (R69, backend #493, the contract's `paneDialogs.ts`):
  a live Claude chat that needs the owner on a dialog its transcript does
  not hold, such as a skill's numbered step, shows it as a card after the
  entries (`blocks/DialogCard.tsx`, an approval `ProposalBlock`): the
  title, the body with its line breaks and one button per option, "1 Send
  structured", 28 high with a mouse and 44 on a touch screen (`pointer:
  coarse`, as the menus' touch rows, R59). The pane reads `GET
  /api/chats/:chat/dialog` only while the chat is "Needs you", its
  transcript has loaded and no AskUserQuestion of it still runs
  (`blocks/chatDialog.ts`): at once, every 3 s while the page shows and
  at once when it shows again, one read at a time, stopped when the pane
  goes or the chat is no longer blocked (`liveDialogs.ts`,
  `useLiveDialogs.ts`), through the typed client. Each reply is parsed
  with the contract's schemas; `dialog: null` and a 404 draw no card. A
  reply the schema refuses is reported as `bad-reply`: on the first read
  it draws no card, and on a later read the card keeps what it shows; a
  tap on it still goes through the server's dialog-ID check (a 409
  `dialogChanged` if the dialog changed). A tap posts the contract's
  `AnswerDialogRequest` `{ id, n }` once and turns every option off until
  the next dialog. The server lists only the options a tap answers (no
  free-text ones), so the options keep `n` as given, a long label wraps,
  and a muted line "Other answers: in the terminal" shows under them.
  A 409 `dialogChanged` shows "The terminal changed — showing the new
  state" until the next read; another 409 state "Not sent
  — <state>" with no Retry; any other miss "Not sent — <kind>" with Retry
  for no answer, a 5xx or a 429. A dialog with no sure options shows its
  read text read-only, scrolling when long, with "Answer in the terminal".
  The card is in the transcript, so the end pin keeps it over the docked
  composer while the phone's keyboard is up. report() gets only the step,
  the kind and the status, never the dialog's text or a label
  (`app/WorkspacesTerminalDialog.test.tsx`; the fake is
  `lib/fakeWorkspacesServer.ts`; LIBRARY_GAPS.md: Terminal dialog card).
- A send, a /compact or /clear and a clear of the terminal input whose
  chat input box the server cannot find on the screen (409
  inputUnreadable, backend #339: a dialog, or a box it does not know)
  sent nothing. The line says "Not sent — cannot read this chat's input
  box. Look at the chat on the Mac." with its own lead ("Not compacted",
  "Not cleared"), with no Retry, no "Clear the terminal input" and no
  report; the draft and its chips stay (`app/WorkspacesInputUnreadable.test.tsx`).
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
  composer or a paste of files adds them too. iOS opens that menu at the
  last touch and closes the keyboard for it, so a touch on the paperclip
  while AppShell docks the composer on the keyboard only closes the
  keyboard; the next tap opens the input (review R29,
  `blocks/useKeyboardFirst.ts`, `app/WorkspacesAttachKeyboard.test.tsx`). Each file starts at once:
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
- The phone's and the tablet's chat (`PhoneChat`, `ChatPane collapsible`)
  draw the composer as one row (paperclip, text, Send; about 50 px) while
  the box is not focused and holds no text and no files: library beta.96
  `collapsed`, as the Claude iOS app does with its keyboard closed (review
  R31). Focus expands it (`onFocusChange`), and a blur with the box empty
  collapses it again. A working chat collapses too: the row draws Stop
  beside Send (library beta.103), as M3 does (Stop 105:2838, Send
  105:2844), and a turn that starts or ends changes no height, so the
  transcript does not move (review R45, the owner: "sometimes the chat
  box closes all the way and sometimes it stays as the expanded form";
  this replaces R31's rule that a running chat stays expanded,
  `app/WorkspacesComposerOneRow.test.tsx`). A draft, a file and a
  disabled box keep it expanded; the desktop never collapses. Send keeps
  the focus, so the box stays expanded under the pending send. A focus
  change renders only the composer (`app/WorkspacesComposerCollapsed.test.tsx`,
  `app/WorkspacesTypingRenders.test.tsx`). The height change only resizes
  the transcript's scroller: the pin (`usePinnedEnd`) keeps a chat at its
  end, a reader above the end keeps his place and stays unpinned, and the
  button to the newest message keeps its gap above the composer
  (`app/WorkspacesComposerCollapsedScroll.test.tsx`).
- A live chat's model is read-only (d-101, W5): the pane header shows
  "Opus 5.5 · high effort" as text (`PaneHead.effort`, `readOnlyModel`),
  the model alone when the effort is not known.
- A live Claude chat's model chip in the chat header picks its model and
  its effort (W10, backend #382, #384 and #386 to #391,
  `blocks/EffortPicker.tsx`, `useLiveEffort.ts`, `liveEffort.ts`,
  `useLiveModel.ts`, `liveModel.ts`): it shows the list's model and level
  (`modelId`, `effortLevel`) and opens one menu with the model families
  (Fable, Opus, Sonnet, Haiku; no Default), the list's family checked,
  then "low effort" to "xhigh effort", the list's level described
  "Current": the library's chip takes one list with one check
  (LIBRARY_GAPS.md: Effort menu). `max` shows on the chip but is not
  offered. Never `/effort` or `/model` as a prompt: each writes the
  owner's Claude Code settings.
  - An effort pick posts `POST /api/chats/:chat/effort` with the
    contract's `SetEffortRequest`, for the session only; the menu stays
    open with the pick "Setting…" until the answer. A 204 closes it and
    the chip shows the level until the next list read, which gives the
    set level. A miss shows one line beside the chip by reason (working,
    needsYou, inputNotEmpty, restarting, a 404, else "Could not change
    the effort").
  - A model pick closes the menu and asks on a row under the chip
    ("Restart the chat with Sonnet? It resumes the same conversation.",
    `blocks/ModelConfirm.tsx`); only Restart posts `POST
    /api/chats/:chat/model` with `{ model, confirm }`, `confirm` the same
    chat ID. The server ends the chat and resumes its session with the
    new model in the same pane, so the chat ID, the open view, the draft
    and the kept sends stay. While it runs the chip says "Restarting…",
    and the chat's composer (`composer.notLive`) and every menu row are
    off with "The chat is restarting", as the server answers every other
    POST to the chat 409 restarting. A 200 `ready` shows the new family
    on the chip until the next list read; `needsYou` adds "The chat needs
    you on the Mac"; `starting` keeps "Restarting…" until a list read
    after `workspaces.changed` shows the chat idle, done or needing the
    owner (no read loop), or at once when a list read during the
    request lists the new family and that status. A restart that
    answered reads the chat's transcript again, as its stream may have
    ended while the chat was gone. Pane follow keeps the chat on its
    pane while the restart runs and until a list read lists the chat
    again, so a list that shows the pane's shell meanwhile moves no view
    and drops no file (`keptOnPane`). A 502 `failed` ended the chat (its pane is a
    shell from the next list on): a library dialog says "The chat stopped
    and did not restart. On the Mac, run this in its pane:" over a
    read-only field with `claude --resume <session>` and Copy
    (`blocks/ModelRestartFailed.tsx`); the page tries nothing again. A 502
    herdr-bad-reply says "The chat did not restart; it runs as before";
    409 skipsPermissions, launchArgsUnknown, folderChanged, restarting,
    working and needsYou and a 404 each have their line, and sameModel
    does nothing.
  - Every row is off while the chat works, with "Wait until the chat is
    idle". report() gets only a 5xx or an answer the page does not
    expect, by kind and status, never a session or a chat ID. A Codex
    chat has no picker (W8), and the pane header keeps its text
    (`app/WorkspacesEffort.test.tsx`, `app/WorkspacesModel.test.tsx`;
    references D02 and M03 `deviations.md`).
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
- A live Claude chat's "/" list (review R34, backend #352) is read from
  `GET /api/chats/:chat/skills` each time it opens, for the chat the pane
  shows then (`liveSkills.ts`, `useLiveSkills.ts`,
  `blocks/skillLists.ts`); the list shows that chat's last list at once
  while the read runs, and a read that answers after the list closed or
  for another chat changes nothing. It starts with /compact and /clear
  (off unless the chat is idle or done), whose pick opens the W5 dialog
  and takes the "/" word out of the box; /model and /effort never show,
  as sending them changes the owner's Claude Code settings (the model
  chip sets the model and the effort through their routes, W10). A picked skill goes in the box as "/<name> ". The
  filter, case aside: names that start with the typed text, then names
  that hold it, then descriptions that hold it, in the server's order;
  none says "No match". A project's or a plugin's skill has a badge. An
  empty list, a 404, a 400 or any other miss lists the commands alone,
  never the sample; report() gets only a 5xx or a reply the contract
  refuses, with the kind only, never a name or a description
  (`app/WorkspacesLiveSkills.test.tsx`).
- A live chat's pane layout writes (W2, backend #333,
  `blocks/layoutActions.ts`, `useLayoutWrites.ts`, `liveLayoutWrites.ts`):
  `POST /api/chats/:chat/focus`, `/zoom`, `/swap` and `/close` with the
  contract's bodies, through the typed RPC client with the chat ID
  URL-encoded once. Only a chat in a herdr tab the page read
  (`data.liveTabs`) has them. The desktop workbench's pane menu adds
  Zoom pane or Unzoom pane and Swap with… (the other chats of the
  pane's tab), both hidden for a tab's only pane, and Maximise zooms;
  while herdr zooms the active tab only its focused pane draws
  (`shownView`). Every layout's chat actions end with Close pane…, a
  library `alertdialog` that names the chat and sends its ID as
  `confirm` (`blocks/CloseChatDialog.tsx`); a working chat gets Stop
  there. A focus moves the focus in the owner's real terminal, so it
  goes only for a tap on a desktop pane's or desktop chat's header
  (`blocks/headerTap.ts`), its menu's Focus in terminal (the keyboard's
  way, offered while herdr focuses another pane) or a Send there, never
  for a click in the
  transcript or the composer, a scroll, a selection, or anything on
  the phone or the tablet's chat, and never to the chat herdr focuses
  already. No layout moves before `layout.changed` brings the new one:
  a write stays pending on its control until the next layout read
  changes that workspace's tabs, or for 2.5 s, after which the page reads
  the layout itself. 409 singlePane and otherTab read the layout again
  quietly, a 404 the list; any other miss says "Not zoomed — <kind>" in
  the status bar (a close's in its dialog), and report() gets only a
  5xx or an answer the page does not expect, with the action, kind and
  status (`app/WorkspacesLayoutWrites.test.tsx`; a layout change of
  another workspace renders no transcript entry,
  `app/WorkspacesLayoutRenders.test.tsx`).
- Split and ratio (W2c, backend #334): the desktop workbench's pane menu
  adds Split right (`POST /api/chats/:chat/split` with `{ direction:
  'row' }`) and Split down (`'column'`), off while herdr zooms the tab;
  the phone and the tablet have none. The new shell pane shows when the
  server's events bring it, and the page does not focus it. A live
  split's handles send `POST /api/workspaces/:workspace/layout/ratio`
  (`blocks/useRatioDrag.ts`): a drag moves the handle and the panes on
  the page, and its end sends one ratio, when the pointer goes up or
  400 ms after the last arrow key or double-click. `blocks/splitRatio.ts`
  finds the herdr split the handle stands for (its path) and the ratio,
  clamped to 0.1 to 0.9; a handle with no such split goes back to the
  server's sizes. The page holds the sent sizes only while the write
  waits. A 404 reads the layout again quietly; any other miss says "Not
  split — <kind>" or "Not resized — <kind>" in the status bar
  (`app/WorkspacesLayoutSplit.test.tsx`).
- Move to tab (W2d, backend #337): the desktop workbench's pane menu
  adds Move to tab… when the pane's workspace has another herdr tab; its
  list names the other tabs (`moveTargets`), and a tab herdr zooms is off
  with "zoomed" at its end. A pick opens `blocks/MoveChatDialog.tsx`
  (`ui.chatDialog` `moveTab`, `ui.commandFor`, `ui.moveToTab`): Place
  (beside the tab's focused pane, the default, or beside one of its
  panes) and Side (Right `row`, Below `column`), then Move posts `POST
  /api/chats/:chat/move` with `{ tab, direction, beside? }`. The phone and
  the tablet have none. The pane moves when the layout read after
  `layout.changed` shows it, and when the moved chat was the focused
  pane the workbench shows the tab it went to (`ui.shownTabs`,
  `shownTabs.ts`): each layout read draws that tab, which the screen
  gets as `active` (herdr's own flag in `herdrActive`, which a focus
  reads), so its splits, swaps and ratios work as in herdr's active tab.
  It shows herdr's active tab again once that tab changes or the shown
  tab closes. Move stays off while the chosen pane has left the tab.
  409 sameTab reads the layout again quietly, 409 zoomedTab with
  "Not moved — that tab is zoomed", a 404 reads the list, and any other
  miss says "Not moved — <kind>" in the status bar
  (`app/WorkspacesLayoutMove.test.tsx`).
- New chat (W3, backend #378 to #381, `useNewChat.ts`, `liveNewChat.ts`,
  `liveNewChatForm.ts`, `blocks/newChatStart.ts`): the live page's New
  chat is Figma's form (D3, T7, M7) with what the server can start
  (references D03 and M07 `deviations.md`). The phone's + (M15) and a
  workspace's ⋯ (M14) and the desktop's tab + (D1) open it for a new tab
  of that workspace; a chat's actions and a desktop pane's menu (D2b)
  open it for a pane beside that chat (`ui.newChatBeside`, Split right's
  `row`), while its workspace stays picked; the WORKSPACE hint says
  which. Start chat posts `POST /api/chats` with the contract's
  `StartChatRequest` and a new create ID (`newSendId`); Retry sends the
  same start again. Start chat says "Starting…" and is off until the
  chat opens: the page opens it as a tap on its row does (the desktop
  shows its tab, `followTab`) once the workspace list shows its pane
  ready or needing the owner, with no focus change in herdr. A ready
  chat gets the first message through the composer's send (a new send
  ID); a chat that needs the owner gets "This chat needs you on the Mac"
  under its composer and the message in its box. `starting`, and a
  `duplicateCreate` (matched by a pane the workspace did not list when
  the start began, and the name), wait for `workspaces.changed`; no read
  loop. nameTaken and a name that does not fit `ChatName` show under the
  name; folderNotAllowed, a 404 ("That chat or workspace is gone", the
  form stays open so the owner can pick again) and a 5xx, 429 or no
  answer ("Could not start the chat", with Retry) show a line in the
  form. Cancel ends the wait. report() gets only a 5xx or an answer the
  page does not expect, by kind and status, never a name or a message
  (`app/WorkspacesNewChat.test.tsx`; the fake is
  `lib/fakeWorkspacesServer.ts`).
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
  another, until the cleared chat has left it (`readAfterClear`). The
  reads end when the page closes its open watcher, as it does when it
  unmounts: no read and no load follow, and any error but that abort
  throws (`liveWorkspaces.test.ts`, `app/WorkspacesLiveCommands.test.tsx`,
  the-bridge #342).
  The route tests' list fake is `lib/fakeWorkspacesServer.ts`; it takes
  the W2 layout writes too.
- Paging (backend #469, `liveTranscript.ts`, `blocks/EarlierLine.tsx`): a
  chat reads its newest 100 entries (`pageEntries`); "Loading earlier entries"
  in view reads the 100 before the first, one read at a time, up to the 500
  cap, and the pin keeps the reader's place (`earlierSlot`). A miss shows
  "Earlier entries not loaded — <kind>" with Retry. A read again (a
  reconnect, Retry) takes as many entries as the view holds; a 409 reads the
  newest page again (`WorkspacesEntryRenders.test.tsx`).
- A live chat opens at its newest entry and stays there as entries come
  in, unless the reader scrolled up; back at the end, it follows again
  (`blocks/usePinnedEnd.ts`, `app/WorkspacesTranscriptScroll.test.tsx`).
  Only the reader leaves the end: a moving finger on the transcript, a
  wheel turn, a scroll key, a mouse drag (its scroll bar, a text
  selection) or a focus moved
  into an entry (Tab, a link). The focus on the transcript's body itself,
  which a tap on it off a control gives as it closes the keyboard, is not
  the reader's: after a send it let iOS's scroll leave the end (review
  R61, `app/WorkspacesSendStaysEnd.test.tsx`). A reader's scroll up that
  lands before its scroll event, as an entry comes in, leaves the end; the
  pin does not move it back (the-bridge#478's CI failure). The reader's
  input counts for 500 ms, or 3 rendering steps when frames run slow, so
  a long frame before the scroll event keeps it the reader's (#469's CI
  failure). Another scroll away from the end goes back
  in the same frame only within 1.5 s of a layout change the page made (a
  resize of the transcript or the composer, the keyboard, an entry added
  or removed, the page back on screen), such as the one iOS made after
  Send closed the keyboard (review R33); the page back from the
  background follows too. Later, such a scroll is the reader's:
  VoiceOver's three-finger swipe and Find in page leave the end and keep
  their place (`app/WorkspacesTranscriptQuietScroll.test.tsx`). Away
  from the end, a change above the view (a draft that folds away, R62)
  does not move what the reader sees: the hook notes the entries in view
  after each scroll and moves the scroll back so the first of them still
  there starts where it did, as Safari has no scroll anchoring of its own
  (`app/WorkspacesRewrittenReply.test.tsx`).
  Fixture chats keep their scroll, so the fidelity frames do not move.
  More than a screen above the end, a button labelled "Scroll to the
  newest message" sticks 8 above the transcript's bottom, centred on it,
  with a dot when entries came in meanwhile (the owner's request, 2026-11-21,
  `blocks/NewestButton.tsx`). A tap scrolls to the end (at once with
  prefers-reduced-motion), pins it and hides the button; the press is
  cancelled at its start, so the composer keeps the focus and the phone
  its keyboard. Its state is a small store that only the button reads,
  so a scroll renders no entry; the dev ErrorTray keeps clear of it
  (`app/WorkspacesScrollNewest.test.tsx`; LIBRARY_GAPS.md: Scroll to
  newest).
- A message's and a reply's text renders as Markdown in the library's
  `MarkdownView`, as the Inbox detail draws its text
  (`blocks/EntryText.tsx`, through the shared `../../blocks/MarkdownText.tsx`):
  GitHub's tables, strikethrough, task lists and autolinks render
  (remark-gfm, review R51), HTML in the text stays text, a bare URL
  and a `www.` link (to https) are links, only an http, https or mailto
  link is a link and it opens in a new tab (review R56,
  `app/WorkspacesMarkdownLinks.test.tsx`), and an image shows its alt
  text. A table's elements
  come from `../../blocks/markdownTableParts.ts`
  (`app/WorkspacesMarkdownTables.test.tsx`).
- The chat width (Settings → Appearance, `settingsStore` `chatWidth`):
  `WorkspacesPage` passes it down to each `ChatPane`. Wide and Narrow
  centre the transcript and the composer in one column of the library's
  `shell.threadWide` or `shell.thread` in a desktop pane, the desktop's
  chat and the tablet's chat; Full, the default, is today's width, so the
  Figma frames do not change. The phone, the sheet and the side chats
  keep their width (`app/ChatWidthRoute.test.tsx`).
- A stacked pane is never lower than its header and composer
  (`blocks/paneFloors.ts`, measured, as no library token gives that
  height); the room comes from the largest pane.

## Rules

- Each transcript and terminal renders in a `BlockBoundary` keyed by its
  chat or pane id, so one bad entry keeps the chat on screen
  (`TranscriptBoundary.test.tsx`, audit P-1).
- `WorkspacesPage` saves the composer drafts, and the live sends with no
  answer yet, in sessionStorage by chat id (`draftStorage.ts`) and reads
  them back on load, so Reload app keeps them; never localStorage (`app/WorkspacesRouteRecovery.test.tsx`,
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
- A press on Send never takes the focus from the message box, so the
  phone's keyboard stays up through the send and the box emptying, as
  chat apps do (the owner's phone review, 2026-11-21): `blocks/useSendKeepsFocus.ts`
  cancels the default of Send's `pointerdown`, `mousedown` and
  `touchstart`, and clicks Send on a touch that ends on it. Never disable
  the box while a send is pending; a disabled field closes the iOS
  keyboard (`app/WorkspacesSendKeepsFocus.test.tsx`).
- A send empties only the sent chat's draft, and only while it still holds
  the text sent (`DraftBook.clear`); a send that misses after the owner
  opened another chat puts the text back in the sent chat's draft only
  (`DraftBook.restore`). `WorkspacesPage` merges each ui change into the ui
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
  a region with `blocks/frameRegion.ts`. On the keyboard the chat's
  composer ends 8 over it on the phone (M10) and 16 on the tablet (T4):
  `ChatPane` pads its footer by the dock, up to that space, so with the
  keyboard closed the safe area stays under the composer (review R36,
  `app/WorkspacesKeyboardGap.test.tsx`).
- The app does not size the screen to the area above the keyboard; that
  is the "Phone keyboard" row of `LIBRARY_GAPS.md`.

## Folders

- [screens/AGENTS.md](screens/AGENTS.md): read before you change a layout
  or a story.
- [blocks/AGENTS.md](blocks/AGENTS.md): read before you add or change a
  block.
- [states/AGENTS.md](states/AGENTS.md): read before you add a state for a
  Figma frame.
