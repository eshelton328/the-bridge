# contract/src

One file for each area of the API, named after the area in camelCase,
with its `*.test.ts` beside it. `index.ts` exports each name.

- A schema is Zod, and its type is `z.infer` of it, exported under the
  same name; never write the type by hand.
- An ID that the server makes is a branded schema in the IDs file. A
  workspace or chat ID holds its machine ID before a `/`
  (`mac-mini/w17`), so IDs stay unique across machines.
- A live event wraps its data in the event envelope: source, sequence
  number, type and data. Each source has its own sequence numbers.
- A live event says what changed, not the new list: a client reads the
  workspaces again on `workspaces.changed` and each time the stream
  opens.
- Every error response and SSE `error` event is an `ErrorBody`: a `kind`
  from the `ErrorKind` union, a client message with no path or login,
  and the request ID (d-115, `errors.test.ts`). A new kind gets a status
  in `errorStatus`.
- A layout names each pane by its chat ID, as `GET /api/workspaces`
  does, never by a herdr pane ID; `TabLayout` checks that its chats are
  its panes in tree order and that the focused chat is in the tree
  (`layout.test.ts`). `zoomed` says that the tab shows only its
  focused pane (slice W2). A layout write request is a strict object:
  focus is empty, zoom has `zoomed`, swap the other chat's ID, and close
  a `confirm` that must be the closed chat's ID; a move a tab, a
  direction and an optional `beside` chat; a split has a
  direction, and a ratio request a tab, the path of parts to its split
  and a ratio from `minSplitRatio` to `maxSplitRatio` (0.1 to 0.9, as
  herdr keeps them) (`layout.test.ts`).
- A transcript read takes an optional `TranscriptQuery`: a `limit` of
  1 to `maxTranscriptEntries` and a `before` entry ID; its answer is in
  transcript order, and `earlier` says that older entries exist. An
  unknown `before` is 409 `chat-not-ready` `entryNotFound`
  (`transcripts.test.ts`).
- A transcript entry has an ID that is stable in its chat; a change
  event replaces the entry with that ID or adds it at the end. Its
  `added` names the entries that are new; a client leaves out a changed
  entry that it does not hold, as that entry is older. A tool
  entry has a name and a short target, never its arguments or its
  result; the server adds its `ToolKind`, a readable title and a
  one-line label from the call's own description (R32). A user entry of a prompt sent with files has `files`: the
  file names, never a path. An error entry is a slash command's error
  output, text only, at most `maxErrorText` (500) characters. A note
  entry (R46) is a harness input that the chat got, never the owner's
  prompt: a `NoteKind` (`task`, `peer`, `hook`) and a short text of at
  most `maxNoteText` (200) characters. Only a `peer` note may have a
  `message` (R55): the sender's chat name (null when none), `via`
  (`message` or `prompt`) and the text, cut as a user entry's
  (`transcripts.test.ts`). An assistant entry that a Stop hook sent
  back has `replacedBy`: the ID of the reply written after the hook's
  note (R62), so the page can show the note in the draft's place.
- A chat's "/" list (`ChatSkillsResponse`) names each skill as typed
  after "/", never a path, with a one-line description and its source
  (`skills.test.ts`).
- A prompt request holds only its text and at most `maxAttachments`
  upload IDs (a strict object, never a path), and a stop request and an
  input clear request are empty objects; the text may be empty only with
  a file, and goes to the chat and nowhere else. A command request is
  `compact` with at most one line of instructions, or `clear`; the
  instructions go to the chat as a prompt's text does (`prompts.test.ts`).
  An effort request (slice W10) is `{ effort }` with a `KeyEffort`
  (not `max`, which the keys do not reach). A prompt may carry the page's `sendId`; its `SendResult` (`pending`,
  `sent`, `notSubmitted`, `notSent` or `unknown`) holds no text.
- A start request (slice W3, `newChats.ts`) is a strict object: kind
  `claude`, a name of herdr's form, a `ModelAlias` and a place (beside
  a chat, a workspace's new tab, or a project by its `ProjectSlug`,
  NCC-129), never a path, a flag, tags or a first message; the answer
  gives the pane, the chat once it has a session, and the state
  (`newChats.test.ts`). A model restart request (slice W10) is a
  `ModelAlias` and a `confirm` that must be the chat's ID; its answer
  is the chat and a start state, or `failed` with the `SessionId` to
  resume in the terminal.
- An upload request holds the file's name, size and type only (a strict
  object), never a path; the file goes up in chunks of the size the
  server gives, at most `maxUploadBytes` (1 GiB) a file, and the name
  never goes into a log line or an error body (`uploads.test.ts`).
- Web Push (d-118, `push.ts`): a subscription is the browser's
  `toJSON()` (a strict object, an https endpoint, base64url keys) and
  an optional `preview` (absent is true); a push payload holds the chat
  ID, its name, its workspace's name, the event (`needsYou` or `done`)
  and `body`: null, or one preview line of at most `maxPushBody` (140)
  code points that the server makes from the last reply or the tool the
  chat waits on, never a code block, a file's text or a tool result. The
  largest payload stays under the 4 KB Web Push record. A subscription
  saved with no `preview` key (by a page from before the choice) gets
  `LegacyPushPayload`, sw.js version 2's {chat, name, event}, until the
  page saves it again at its start (`push.test.ts`).
- The Artifacts library (R26, R27, `artifacts.ts`): an artifact is
  named by its `ArtifactId` (16 hex characters of its link's sha256),
  so a link never goes in a URL. A found artifact (`foundBy:
  'session'`) is a Claude artifact with an https claude.ai link and the
  chat that published it; an owner link is any https link. Strict
  objects, no path. An add of a link the library has answers 200 with
  that entry, not an error (`artifacts.test.ts`).
- The Inbox (R20, f-003, `inbox.ts`): an item is named by its
  `InboxId` (16 hex characters of a sha256 the server makes), so no path
  goes in a URL. A chat item names its chat and may take snooze, done
  and dismiss; a brain item names none and takes no action here (the
  server answers 409 `inbox-read-only`). `needsYou` marks what waits on
  the owner, and `counts.needsYou` is the tab badge. A brain record's
  text goes only in the detail's `body`; no prompt or transcript text
  in an item. A brain item's `origin` is the chat that filed it
  (`{ chat, live }`), from the record's origin keys; a chat item, a
  record with none and one of another machine have null, and a chat
  that is not live is `live: false`, never an error. Its `workspace`
  is the live workspace of its project, else null; a chat item has null
  (R49, `inbox.test.ts`). `inbox.changed` on `/api/events`
  says to read the list again.
- The Toolkit page (R21, `toolkit.ts`): an item of the brain's shared
  toolkit or of one project's toolkit, read-only. Its `scope` is
  `shared` (project null) or `project` (its project's folder name), and
  its `path` is relative to its toolkit root, never a local path. A URL
  names an item or a file by its hashed ID. Links may cross scopes. File
  text goes only in an item's `main` or a file's body, at most
  `maxToolkitFileText` characters (`toolkit.test.ts`).
  `toolkit.changed` on `/api/events` says to read the list again.
- The Workspaces edit actions (R41, R42, `workspaceEdits.ts`): a
  rename takes a trimmed `Label` of 1 to `maxLabel` (64) characters
  with no control character; a chat's rename sets its pane's label, never
  the agent's herdr name.
  A new workspace (W4) takes only an optional name, a `Label`
  ("untitled" when none), never a folder; the answer is the workspace
  as the list gives it.
  A workspace close asks for the workspace's ID and the number of chats
  the page listed. An order names each workspace or chat once. A move to
  another workspace answers with the pane's old and new ID and
  `sourceClosed` (the chat was its workspace's last pane, so herdr
  closed that workspace), and the page follows the chat ID. A fork takes only an optional name, direction
  and `createId`, never a session or a flag. A workspace that cannot
  take a close or an order is 409 `workspace-not-ready`
  (`workspaceEdits.test.ts`).
- A side question (`sideAnswers.ts`) is a strict object with the
  question only (trimmed, 1 to `maxSideQuestion` (4000) characters),
  never a session, a model or a flag. Its `SideId` is 16 hex
  characters; a `SideAnswer` holds the whole text so far, cut at
  `maxEntryText`, and a state (`answering`, `done`, `failed`,
  `timedOut`, `stopped`). A
  chat that cannot take one is 409 `chat-not-ready` `noSession` or
  `sideBusy` (`sideAnswers.test.ts`).
- A dialog on a chat's screen that its transcript does not hold (R69,
  `paneDialogs.ts`): `GET /api/chats/:chat/dialog` gives a `PaneDialog`
  or null. Its `id` is a hash of the read text, `options` (1 to 9, each
  a number, a label and an optional `detail`, the description under it
  when it says more than the label) is there only when the server read the numbered
  list for sure, and `raw` is the dialog's text, at most
  `maxDialogChars`. This is the one place the contract carries a
  screen's text (d-125, an exception to d-110): the owner must see the
  dialog to answer it. An answer is `{ id, n }` only, never a key; the
  server sends it only when the screen still shows that dialog and
  option, else 409 `chat-not-ready` `dialogChanged`. Logs keep the ID
  and the number, never the text (`paneDialogs.test.ts`).
- A `ClientErrorReport` holds only its listed fields (a strict object),
  so a report carries no page text or app state (`clientErrors.test.ts`).
- The file links (`files.ts`): a `FileRoot` (the brain or a chat ID) index of git's tracked files as `RootFilePath`s, each named by its `FileId`; file text only in `FileTextResponse`; `FileRawQuery` takes a root and path or an `AbsoluteFilePath` (`files.test.ts`).
- The Projects app (f-008, `projects.ts`): a project is named by its
  `ProjectSlug` (its brain folder name) and an idea by its record's UUID
  (`IdeaId`), never by a path. The one exception is `IdeaDetailResponse.file`
  (`IdeaFile`, `ideas/<name>.md` with one plain name, or null): the server
  makes it from the folder entry's name, never from the record's text, and
  it never goes in a URL, a log or an error body (backend-coord,
  2026-11-28; "Chat about this idea" names it). A repository gives its GitHub owner and
  name, or null for one off GitHub; a PR link is an https github.com link
  only. An idea with no `tags`, `kind` or `state` key has no tags, the
  kind `idea` and the state `open`. A `DriftRun` lists findings only when
  its result is `findings`; each finding's paths are relative to the root
  of the chat tree. The pin and drift run bodies are strict objects
  (`projects.test.ts`). A `RepositorySection` (increment two) gives a
  repository's visibility, newest release (an https github.com link),
  open PR and worktree counts, each null when not read or off GitHub, and
  `unread` names the parts not read. `RepositoryCi` gives a repository's
  CI numbers since `since` (30 days, or the oldest run one read gives),
  each time null (never 0) with no data. The CI response gives the kept
  answer at once: `ci` null with `reading` false means not read, as
  `unread` does; `ci` null with `reading` true means the first read runs;
  `ci` with `reading` true means a refresh runs. `readAt`, the time of the
  GitHub read, is null exactly when `ci` is null.
  A `RepositoryDriftRun` has the
  snapshot's commit and findings of a strict `AgentsMdKind` with a path
  from the repository root (`RepositoryPathOrRoot`: "." or a
  `RepositoryPath`, the one schema of a path in a repository, with no
  control character or backslash), the first `maxDriftFindings` and a `total`.
  `projects.changed` on `/api/events` says that a
  project's open PRs changed or a CI read of one of its repositories
  ended, good or failed: read the project and its CI numbers again (NCC-156); its data is `{}`. Increment four: a create or edit body holds a
  one-line name and purpose (no control character, the contract's
  limits) and an icon or null, never a slug or a path. The Queue
  (`queue.ts`): an item is named by a `QueueItemId` (16 hex characters of
  a sha256 the server makes) and an issue by its `QaIssueId`, a priority
  is an integer 0 to 4, and a PR is `local` exactly when it names no
  issue. An idea state body is `parked` or `open`
  only. `queue.changed` carries only the slug.
- The Architecture tab (f-008 increment two, `architecture.ts`): a scope
  is `@system` (which no `RepositoryId` parses) or a repository's ID. A
  diagram is a strict model of parts (a shape, `ours`, a type line and an
  optional boundary), boundaries and labelled arrows; a refine checks that
  each arrow and boundary it names is in it. A folder or file part's name
  is a `RepositoryPath` from `projects.ts`: the one place besides a drift
  finding where the contract carries a repository path. Each text and list
  has a maximum. A scope's state gives its commit (40 hex) and time or
  null, and `stale` and `running` (in memory: false after a restart), and
  `failed`: the last failed run's time and fault code (`ArchitectureFailure`,
  letters, digits and "-" only), or null; in memory, so null after a
  restart, and only a good run clears it. A
  regenerate while a run of another scope goes is 409
  `architecture-busy`. `architecture.changed` carries the slug and scope
  only (`architecture.test.ts`).
- The QA tab (f-008 increment three, `qa.ts`): an issue is named by its
  Linear key (`QaIssueId`, such as `NCC-12`), so a path word such as
  `stop` is never one, and a draft by a 16-hex `QaDraftId`. An item
  gives its launch URL over https on a tailnet host only (a name under
  `tailnetSuffix`), never a path, and an after-merge item
  is on the served app (`servedApp`) and nothing else is. A comment's
  file is a `QaFileId` that the page reads from the server, never a
  Linear link. A draft request holds text or upload IDs, and a review
  request the answer only (strict objects). A launch that cannot start
  is 409 `qa-not-ready` with its reason; a Linear fault is
  `linear-bad-reply` (502) or `linear-unavailable` (503).
  `qa.changed` names the project whose list to read again (`qa.test.ts`).
