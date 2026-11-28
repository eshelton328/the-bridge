# services

What the server does, in the app's own terms, and the ports it needs
from the outside world.

- A port is an interface in this folder, such as `AgentPort` in
  `agentPort.ts`: the only way the server reaches agents (d-110). A new
  outside system gets a new port here and its adapters in
  [../adapters/](../adapters/AGENTS.md).
- A service imports ports, never an adapter; `../main.ts` and the tests
  pass the adapter in.
- A failure the caller expects returns a `Result` from `@bridge/shared`
  (d-084); it does not throw.
- `transcriptEvents.ts` watches one chat for each open transcript
  stream, through the port, and reads it again on each change; it reads
  once when the stream opens, after the watch is ready, so no change is
  lost. Each stream also subscribes to the port's list changes, and a
  read that then finds no such chat ends the stream with `gone`
  (`transcriptEvents.test.ts`).
- `uploadStore.ts` is the port for the files that the owner attaches
  to a prompt; `uploads.ts` lets only a Claude chat take one, and
  sends a prompt with the path of each file below its text; the
  transcript reads those lines back as the entry's file names.
- `layoutWrites.ts` sends the layout writes of slice W2 (a move too, and a
  move to another workspace) to the port;
  a close goes to the port only when its confirm names the chat, and a
  ratio only for a tab of the workspace in the path.
- `workspaces.ts` sends a workspace close to the port only when its
  `confirm` names the workspace (R41).
- `push.ts` is the port of the Web Push keys and subscriptions
  (d-118), the hosts a subscription may name, and `PushSeen`, when a
  page of the owner was last visible.
- `pushNotifier.ts` sends a Web Push (d-118) to each stored
  subscription when a chat's status changes to `needsYou`, or from
  `working` to `done` or `idle` (herdr gives `idle` in the pane
  that its own screen shows), unless a page was seen in the last 30 s; a
  subscription the push service no longer knows (404 or 410) is
  dropped. A push names the chat's workspace too, and to a subscription
  whose `preview` is not false it adds one line (`pushPreview.ts`): the
  first sentence of the last reply for `done`, the tool the chat waits
  on ("Wants to run: pnpm") or its last question for `needsYou`, as
  plain text cut at a word to 140 code points; no line when the text
  looks like a secret (`looksSecret`, the server's one list of secret
  text shapes) or is empty. The transcript is read only when a stored
  subscription wants the line, and the line and the workspace name never
  go into a log. It watches the agents only while a subscription is stored,
  and opens the watch again 5 s after the agents stop answering
  (`pushNotifier.test.ts`).
- `sendResults.ts` keeps the result of each prompt send that carries
  the page's send ID: pending, then sent, notSubmitted, notSent (refused
  before any text was typed) or unknown (the chat may hold the text:
  a herdr failure, `inputNotEmpty` or `inputUnreadable`), for 10
  minutes and at most 500,
  with no text (`sendResults.test.ts`).
- `newChats.ts` starts a chat for the page (slice W3) and keeps the
  answer of each start with a `createId` for 10 minutes, at most 500:
  the same ID again gets that answer, or `duplicateCreate` while the
  first start runs or after it failed in herdr (it may have made a
  pane). A refusal (`notFound`, `folderNotAllowed`, `nameTaken`)
  made nothing, so it frees the ID. A fork (in a row by default) takes
  the same rules (`newChats.test.ts`). A project start takes only a slug
  of the brain's project list (else `notFound`; a list fault is 500 and
  frees the ID); a kept create ID answers with no list read.
- `restarts.ts` holds one lock for each chat with a model restart in
  progress (slice W10, in memory): a confirm of another chat is
  `notConfirmed` with no call to the port, and a second restart of the
  chat is `restarting`. It also counts each other request to the chat
  in progress: a restart waits for none (`busy`), and no request enters
  while a restart runs (`restarts.test.ts`).
- `artifacts.ts` is the Artifacts library (R26, R27) and its ports:
  the finder of published Claude artifacts and the store. A list
  reads what the finder found since the last list and keeps it: a new
  link is added with its chat and `foundAt`, and a republished one gets
  its newer title. An artifact's ID is the first 16 hex characters of its
  link's sha256. An owner link that the library has answers that entry
  (`added: false`), a removed entry stays as removed so a find does not
  add it again, and an add brings it back. One change at a time; a
  store fault is its code only. After each list whose save succeeds, it
  calls the scan's `keep`, so the finder saves how far it read only for
  artifacts the library holds (`artifacts.test.ts`).
- `inbox.ts` is the Inbox (R20, f-003) and its ports: the brain's
  attention requests (read only), the end of a chat's turn and the
  owner's marks. A chat that needs the owner is a question on the badge;
  a done chat is a review off it; a chat in any other status has no
  item. A chat item's ID hashes the chat, its status and its turn's end,
  so a mark holds for that turn only and a mark of an ended turn is
  dropped. A chat item with no known turn end takes no action, as a mark
  could hide its next turn; the time the server first saw the status is
  its time. A snooze takes an item off the badge until its time. A brain
  item takes no action (`readOnly`). A brain item's origin chat (R49) is
  `<machine>/<session>` of the record's origin keys (this machine when
  the record names none), `live` when the workspace list has that chat
  now; one of another machine is null. Its `workspace` is the port's
  workspace for its project (`projectWorkspaces`), else null. A chat
  item's `project` is its pane's `project` tag (d-120, read with
  `projects.ts`'s `chatTagsOf`) only when the brain's projects port
  lists that slug, else null; a build reads one pane list and the
  projects once, at the same time as its other reads, and logs no tag value. One change at a time; a fault is its
  code only. A read asks the turn ends once for all the waiting chats,
  and lists that cross share one build that has not started to read (a
  list during a read gets the next build); an act moves a version when
  it is called, so a list after it builds again (`inbox.test.ts`,
  NCC-138).
- `sideAnswers.ts` keeps side answers in memory as they come from the
  port: one question of a chat at a time and three in all (`busy`),
  each stopped after 120 s (`timedOut`) or by the owner's stop
  (`stopped`, which aborts the port's run), text cut at `maxEntryText`,
  and the last 20 answers kept, never a running one
  (`sideAnswers.test.ts`).
- No polling (d-112): a service reads a port when a request or a
  subscription asks. `liveEvents.ts` shares one port subscription among
  all clients of `/api/events`, so with no client open (and no push
  subscription stored) no herdr stream is open. It sends `inbox.changed`
  after each `chat.status` and `workspaces.changed`, after each owner's mark (`inboxChanged`) and
  on each change that the Inbox watch tells, and `projects.changed` on each
  change of the projects' watch, and `architecture.changed` at each
  diagram run's end; it opens the watches with the first
  client and closes them with the last (`liveEvents.test.ts`).
- `fileStore.ts` is the port of git's tracked files in a root; `files.ts` gives each an ID and reads text only from the index (`files.test.ts`).
- `projects.ts` is the Projects app (f-008) and its ports: the brain's
  projects and idea records (read only), the pins, the open PRs of a
  GitHub repository, the layout check and the last drift run of each
  project. The pinned cards come first, each part by name; the PRs of a
  project's repositories newest first; each repository's last PRs are
  kept, and requests that cross share one run (`keptPulls`, a failed
  first run is not kept). A read gets the kept answer at once, at any age;
  one older than 30 s also starts one run in the background, and other PRs
  from it call the `watch` listeners, so `/api/events` sends
  `projects.changed` (NCC-156, `projectsPulls.test.ts`). A run that throws
  is a failed one. A failed background run keeps the old answer at any
  age, and the page cannot tell: while gh fails, a merged PR still shows. A drift run keeps only the check's
  lines about the project (`findingsFor`: a path in `projects/<slug>`,
  "project <slug>" or one of its repositories named alone), one check runs at a time, and a failed check is a
  `failed` run. One store change at a time (`projectDrift.test.ts`,
  `../routes/projects.test.ts`). A project's chats join the port's
  `chatTags()` with its workspace list, by each chat's pane, and keep the
  chats tagged `project=<slug>` in the workspaces' order; of a pane's
  tags only `project`, `area` and `role` with a slug-shaped value are
  kept (`chatTagsOf`), and no tag value goes into a log. The slug is
  checked against the brain's list before any read. The Repositories tab
  (increment two) joins each repository of `project.yaml` with its GitHub
  facts (kept 5 minutes, `keptFacts`), its open PR count and its worktree
  count; a part that does not read is named in `unread`, never a fault
  (`projectsPulls.test.ts`, `../routes/projects.test.ts`). A repository's
  CI numbers (`repositoryCi.ts`) count a CI run as the push or
  pull_request workflow runs of one commit, the newest run of each
  workflow only (a PR title edit runs the title check again), timed by
  its longest workflow run, and take the job medians from the newest 10
  green ones (`repositoryCi.test.ts`). A request gets the kept answer at
  once, from memory or the `CiStore` (so a restart does not make the
  read cold); with none, or one 10 minutes old, it also starts one read
  in the background for that repository. A read that throws is `threw`,
  and a failed read keeps the old answer; no read of the repository starts
  for 10 minutes after a failed one, so a GitHub fault and its event never
  loop. The watchers hear of each read that ends, good or failed, so a
  page that showed `reading` reads the end and the new `readAt`. After a
  save, the store is pruned to the repositories of a project list read
  that succeeded, never after a failed one. Each part's time goes to
  `ciLog`, with no owner or name (`../routes/projects.test.ts`). A
  repository's drift run syncs its snapshot and runs the `agents-md` check under one
  lock for each snapshot (`snapshotLock.ts`, shared with the Architecture
  runner), so a sync never changes files a check reads;
  a second run of that snapshot while one waits or runs gets its answer.
  A repository off GitHub, a sync fault or a check fault is a `failed`
  run with its code for the log, never a fault (`../routes/projects.test.ts`).
- The Architecture tab (f-008 increment two, `architecture.ts`): a
  project's scopes are `@system` and each repository of `project.yaml`.
  One run goes at a time over all projects: a regenerate of the running
  scope joins it, another scope is `busy`. The service cleans control
  characters from each text, keeps only a model the contract takes with
  a 40-hex commit, prunes after a list read that succeeded and tells the
  watchers at each run end. `running` is in memory only. A log keeps the
  code only (`architecture.test.ts`). `architectureRunner.ts` syncs a
  repository scope's snapshot and reads it with a `SnapshotReader`, both
  under that snapshot's lock; `@system` fails `not-built` until A2, and a
  repository off GitHub `no-github` (`architectureRunner.test.ts`).
- The QA tab (f-008 increment three): `qaAsk.ts` reads the newest Linear
  comment whose first line is `QA check` as data. Its `Repository:` counts
  only when `project.yaml` lists it, and its `PR:` only as a positive
  integer of that repository; its numbered lines are the steps, cut to the
  contract's limits. `QA answer: <Approved|Changes requested|Denied>` is an
  answer, and any other word none, and only when its comment ID is one the
  server recorded when it posted it: the key is the owner's, as is each
  agent chat's Linear access, so the author cannot tell them apart. Submit
  (build plan PR 11) records them; until then the record is empty, so no
  issue has an answer: each row waits, and "After merge" lists each `Main`
  issue in Done (`qaAsk.test.ts`). No comment text goes into a log.
- `qa.ts` lists the `Branch` issues in QA and the `Main` issues in Done
  with no answer of the project's `linearTeam`, through the Linear port
  (`LinearIssues`). A read is kept 30 s from its end and shared while it
  runs; a failed or thrown one is not kept. A comment time that is not ISO
  is left out; with no port (no key) a read is `unavailable`. One row that
  `QaItem` refuses makes the list `badReply` (502), never a dropped row:
  the adapter checks the reply first, so such a row is its fault, and a
  dropped row would hide an issue that waits for the owner
  (`../routes/qa.test.ts`, a fake Linear).
