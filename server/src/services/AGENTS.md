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
- No polling (d-112): a service reads a port when a request or a
  subscription asks. `liveEvents.ts` shares one port subscription among
  all clients of `/api/events`, so with no client open no herdr stream
  is open.
