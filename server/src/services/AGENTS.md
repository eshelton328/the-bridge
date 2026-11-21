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
- `layoutWrites.ts` sends the layout writes of slice W2 (a move too) to the port;
  a close goes to the port only when its confirm names the chat, and a
  ratio only for a tab of the workspace in the path.
- `push.ts` is the port of the Web Push keys and subscriptions
  (d-118), the hosts a subscription may name, and `PushSeen`, when a
  page of the owner was last visible.
- `pushNotifier.ts` sends a Web Push (d-118) to each stored
  subscription when a chat's status changes to `needsYou`, or from
  `working` to `done`, unless a page was seen in the last 30 s; a
  subscription the push service no longer knows (404 or 410) is
  dropped. It watches the agents only while a subscription is stored,
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
  made nothing, so it frees the ID (`newChats.test.ts`).
- No polling (d-112): a service reads a port when a request or a
  subscription asks. `liveEvents.ts` shares one port subscription among
  all clients of `/api/events`, so with no client open (and no push
  subscription stored) no herdr stream is open.
