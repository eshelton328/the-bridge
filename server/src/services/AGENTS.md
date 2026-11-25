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
  the same rules (`newChats.test.ts`).
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
  workspace for its project (`projectWorkspaces`), else null. One change at a time; a fault is its
  code only (`inbox.test.ts`).
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
  on each change that the Inbox watch tells; it opens that watch with the
  first client and closes it with the last (`liveEvents.test.ts`).
- `fileStore.ts` is the port of git's tracked files in a root; `files.ts` gives each an ID and reads text only from the index (`files.test.ts`).
