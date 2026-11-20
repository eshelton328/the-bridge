# adapters

One real adapter and one fake for each port in
[../services/](../services/AGENTS.md). A real adapter's name starts with
what it talks to (`herdr…`) and its fake's with `fake…`; a low-level
client of a socket or a file sits beside them.

- herdr pane IDs, key presses and terminal text never leave this folder;
  an adapter turns them into the app's terms (d-110).
- An adapter reads only when a request or a subscription asks; no timer
  polls herdr or the disk (d-112).
- Each port has one contract suite (`<port>Contract.ts`). Both the real
  adapter's test and the fake's test run it, and `e2e/` runs it on a
  real herdr session. A new behaviour of a port goes into the suite, not
  into one adapter's test.
- Every herdr pane is a chat: a Claude or Codex pane is an agent chat,
  and any other pane a shell chat with its program as the model
  (`pane.process_info`; no model when herdr gives none). A shell sends
  only process names, never an argument or its terminal title, which can
  hold a token or a path (`herdrAgents.test.ts`).
- A layout names each pane by the chat ID that the list gives it; a
  pane leaf's folder from `layout.export` stays here, and a tree that
  the contract cannot hold is `badReply` (`herdrAgents.test.ts`).
- Tests here use a fake socket, never a real herdr.
- A herdr reply that the contract cannot hold is `badReply`, never a
  throw; a status herdr adds later is the chat's `unknown`, logged once
  (`herdrAgents.test.ts`, audit S-2 and S-3).
