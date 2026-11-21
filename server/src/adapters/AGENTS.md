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
- A tab, focus or split event that names its workspace is `layoutChanged`
  for that workspace, once for each burst (100 ms quiet, at most 500 ms
  from its first event); one that names no
  workspace reads the list again (`herdrAgents.test.ts`).
- A Claude chat's transcript comes from its own session file only, read
  from the end (`claudeTranscript.ts`): prompts, reply text and each
  tool call's name and target, never thinking, a tool's arguments or
  its result. A shell tool's target is its program names, a file tool's
  its path from the chat's folder or with "~", a web tool's its host
  (`toolTarget.ts`). A line that is not JSON is skipped. Nothing logs
  transcript text. A transcript watch is an `fs.watch` on the session
  file itself (on macOS a folder watch can lose a write as it starts, a
  file watch cannot), with no timer, and a herdr status stream for the
  chat's pane: a tool stops running when its chat stops working, with
  no write to the file. Until the file is there, a watch of its folder,
  or of the projects folder, and each status change look for it; a
  watch that fails ends the stream as `unreachable`.
- A Claude chat's `contextUsed` is its last request's input and cache
  tokens over the model's context window; a model that `sessionFile.ts`
  has no window for gets `null` (`sessionFile.test.ts`).
- A prompt or a stop goes only to its own chat's pane, with herdr
  `agent.prompt` or one `esc` of `agent.send_keys`. A shell, a chat that
  waits for the owner (`blocked`) and, for a stop, a chat that does not
  work get nothing: a second Escape opens Claude Code's rewind menu, so
  a pane gets no other Escape for 2 s after one (two taps of Stop send
  one). A
  herdr error on an input keeps only its code, never its message, which
  could quote the prompt (`herdrAgents.test.ts`).
- A prompt never joins other text: before it sends to a Claude chat, the
  adapter reads the input box from the pane's screen
  (`claudeInput.ts`), and a box with text, or one it cannot read, is
  `inputNotEmpty`. After
  its own stop, Claude Code puts the stopped prompt back in the box; the
  adapter clears it with ctrl+u only when the box holds the last prompt
  it sent, which it keeps as a SHA-256 hash of its words with one space
  between them, never as text; each line end of the box joins with a
  space or with nothing. Other text
  stays (`agentPortContract.ts`, `herdrAgents.test.ts`).
- After a prompt to a Claude chat, the adapter reads the box again, up
  to 8 times 150 ms apart. When each read still shows that prompt, the
  chat did not take its Enter: the adapter empties the box with ctrl+u
  and answers `notSubmitted`. A prompt that a working chat queues
  leaves the box, so it is `sent`.
- An input clear empties a Claude chat's box with ctrl+u, for text that
  another client typed there, and reads it again: `cleared` or
  `inputNotEmpty`. A Codex chat gets `noCommands` and no key; the text
  is never returned or logged (`agentPortContract.ts`).
- The upload store (`diskUploads.ts`, fake `fakeUploads.ts`, suite
  `uploadStoreContract.ts`) keeps each upload in a 0700 folder with
  0600 files, under the folder beside the database. Each chunk goes to
  a temporary file and takes its place only when its length is right,
  so a short retry keeps the chunk that came; it stops at the first
  piece of a stream that goes past the chunk's length. The state file is
  replaced in one rename, and complete joins the chunks in turn with
  their renames,
  and never runs a file; it reads the bytes only to join the chunks. It keeps only a safe file
  name with its extension, and a fault gives only its errno code
  (`diskUploads.test.ts`).
- Tests here use a fake socket, never a real herdr.
- A herdr reply that the contract cannot hold is `badReply`, never a
  throw; a status herdr adds later is the chat's `unknown`, logged once
  (`herdrAgents.test.ts`, audit S-2 and S-3).
