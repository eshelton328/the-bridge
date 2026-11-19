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
- No polling (d-112): a service reads a port when a request or a
  subscription asks. `liveEvents.ts` shares one port subscription among
  all clients of `/api/events`, so with no client open no herdr stream
  is open.
