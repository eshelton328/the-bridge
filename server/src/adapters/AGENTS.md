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
- herdr refuses an `events.subscribe` that names a pane that closed
  after the list read (`pane_not_found`; the owner closes panes, from
  herdr or the page). The list stream then reads the list again and
  subscribes to the panes that are left, at most 5 times in a row, and
  ends no stream; a transcript watch stops its status stream and keeps
  its file watch, so the chat's transcript stream ends only as `gone`
  when its chat leaves the list (`herdrAgents.test.ts`).
- A tab, focus or split event that names its workspace is `layoutChanged`
  for that workspace, once for each burst (100 ms quiet, at most 500 ms
  from its first event); one that names no
  workspace reads the list again (`herdrAgents.test.ts`).
- herdr sends no event when a pane's Claude session changes (a `/clear`
  typed in the terminal; probe in a test herdr session, 2026-11-20). So
  the list stream also watches the folder of each listed Claude session
  file: a new `.jsonl` file there that no listed chat has reads the
  list again (`workspacesChanged`), at once and 1.5 s later, as herdr
  can learn the new session after the file is there. Writes to a known
  file read nothing (`herdrAgents.test.ts`).
- A Claude chat's transcript comes from its own session file only, read
  from the end (`claudeTranscript.ts`): prompts, reply text and each
  tool call's name and target, never thinking, a tool's arguments or
  its result. A shell tool's target is its program names, a file tool's
  its path from the chat's folder or with "~", a web tool's its host
  (`toolTarget.ts`). Each tool entry also has a kind, a readable
  title ("Ran a command" for `Bash`, a title made from the name for
  another tool) and a label: the first line of the call's own
  `description` field, at most 120 characters, the only argument read
  (`toolLabel.ts`, R32). A prompt shows as the owner wrote it: the
  `pasted_content` tags that Claude Code puts around a paste are
  removed, and the file lines that `uploads.ts` adds below a prompt
  with files become the entry's `files`, the name of each file only
  (`claudeTranscript.test.ts`). A prompt sent while the chat works is
  a `queued_command` attachment line, with no user line; it is the
  owner's prompt, at its place, only with `origin.kind` "human",
  `commandMode` "prompt" and `humanTurn`, and no `isMeta` (a peer's
  message and a task report come the same way). A slash command's own line shows as
  the owner typed it (`/compact keep the plan`), its
  `<local-command-stderr>` line is an `error` entry with the text only
  (no tags, no colour codes, at most 500 characters), and its
  `<local-command-stdout>` line and a compact summary line are not
  entries. A line that is not JSON is skipped. Nothing logs
  transcript text. A transcript watch is an `fs.watch` on the session
  file itself (on macOS a folder watch can lose a write as it starts, a
  file watch cannot), with no timer, and a herdr status stream for the
  chat's pane: a tool stops running when its chat stops working, with
  no write to the file. Until the file is there, a watch of its folder,
  or of the projects folder, and each status change look for it; a
  watch that fails ends the stream as `unreachable`.
- A Claude chat's "/" list (`claudeSkills.ts`, R34): the built-in
  commands, then the owner's skills and commands (the owner's win a
  shared name), then those of each folder from the chat's folder up to
  its repository root (not home), at most 500. Only front matter is
  read (16 KB), again only when a change time moves. A plugin's skills
  and commands go by "<plugin>:<name>" (`claudePlugins.ts`): an install
  in `plugins/installed_plugins.json` of scope `user`, or one whose
  `projectPath` is a folder from the chat's folder up to its root, that
  the last settings file to name it turns on (the owner's
  `settings.json`, then each `.claude/settings.json` and
  `settings.local.json` from the root down); both files are only read
  (`claudeSkills.test.ts`).
- A Claude chat's `contextUsed` is its last request's input and cache
  tokens over the model's auto-compact window when Claude Code's
  settings set one (`modelSettings["<model>"].autoCompactWindow`, as
  the chat compacts there; capped at the model's own window, and a value
  such as "auto" drops only that model's), else over the model's
  context window, at most 1; a model that `sessionFile.ts` has no window for gets `null`
  (`sessionFile.test.ts`). `claudeSettings.ts` only reads the settings
  file (`BRIDGE_CLAUDE_SETTINGS`, else the `settings.json` beside the
  projects folder), again only when its size or change time moves
  (`claudeSettings.test.ts`). The read goes
  back from the end of the session file in chunks of 64 KB to the newest
  reply, up to 16 MB, as Claude Code can write lines of 80 KB and more
  after a reply; a file with the same size and change time is not read
  again (`sessionFile.test.ts`). Its `effort`
  is the newest `perTurnEffort` (else `effort`) that a session line
  names, and its `modelId` the family of its model ID ("opus"); a Codex
  chat and a shell get `null` for both.
- Each chat's `pane` is a hash of herdr's terminal ID with the machine
  before it: never herdr's own ID, and the same for the pane's life, so
  it stays when `/clear` gives the pane a new session and so a new chat
  ID (`herdrAgents.test.ts`).
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
  (`claudeInput.ts`): a box with text is `inputNotEmpty`, and a screen
  where it finds no box (a dialog, or a draft with a line of "─") is
  `inputUnreadable`, with nothing sent. The top rule of a named chat
  ends with its name ("──── bridge-coord ─"). After
  its own stop, Claude Code puts the stopped prompt back in the box; the
  adapter clears it with ctrl+u only when the box holds the last prompt
  it sent, which it keeps as a SHA-256 hash of its words with one space
  between them, never as text; each line end of the box joins with a
  space or with nothing. Other text
  stays (`agentPortContract.ts`, `herdrAgents.test.ts`).
- After a prompt to a Claude chat, the adapter reads the box again, up
  to 11 times, the first after 30 ms and the waits adding up to 1.3 s.
  An empty box counts as the prompt taken only after a read showed the
  prompt there, or from 150 ms on, as an earlier read can come before
  the prompt shows.
  Each send logs `prompt sent` with the ms of each step (list read,
  box read, `agent.prompt`, the check) and its outcome, never text.
  While a list stream is open, a prompt takes its chat's pane and
  status from the stream's own list read and status events, with no
  list read; a list, layout or session change, or the end of the last
  stream, empties that cache. A cached pane that fails before any text
  is typed (a box read, or herdr's `pane_not_found` on
  `agent.prompt`) reads the list once and sends again
  (`herdrAgents.test.ts`). When each read still shows that prompt, the
  chat did not take its Enter: the adapter empties the box with ctrl+u
  and answers `notSubmitted` once a read shows it empty. Text it cannot
  match to the prompt (a box of more lines than it joins) or cannot
  remove is `inputNotEmpty`, so the page offers the input clear. A
  prompt that a working chat queues leaves the box, so it is `sent`.
- `/model <name>` on a chat with history opens Claude Code's "Switch
  model?" dialog, also while it works (probe in a test herdr session,
  2026-11-21). After such a prompt the adapter reads the screen: when
  the dialog shows with "Yes, switch" picked, it sends one Enter, and
  answers `sent` only once the dialog is gone and the box shows again,
  else `inputUnreadable`. It never types into an open dialog: a
  screen with no box sends nothing (`herdrAgents.test.ts`).
- A command (`/compact` with its instructions on one line, or
  `/clear`) goes to an idle Claude chat only, as a prompt does, with
  the same box checks; a chat that is not idle or done (working, or a
  state herdr does not name) gets `working` and a Codex chat
  `noCommands`, with nothing typed (`herdrAgents.test.ts`).
- A layout write (slice W2) finds a chat's pane, a shell's too, and
  calls herdr `pane.focus`, `pane.zoom` (`on` or `off`), `pane.swap`
  (two panes of one tab only) or `pane.close`. A close refuses a chat
  that works, waits for the owner or has a state herdr cannot tell; a
  pane that closed first is `notFound` (`herdrAgents.test.ts`). Never
  call `layout.apply`: herdr replaces the tab and its terminals, so
  each shell and agent in it ends. A split calls `pane.split` in the
  chat's folder with no focus, and the new pane's shell chat ID comes
  from its terminal; a ratio calls `layout.set_split_ratio` with the
  path as booleans (true for the second part), and herdr's
  `tab_not_found` and `split_not_found` are `notFound`
  (`herdrAgents.test.ts`). A move calls `pane.move` to a tab of the
  chat's own workspace (the part of herdr's tab ID before the colon),
  with no focus, split beside the `beside` chat's pane (else the tab's
  focused pane); the moved pane takes the second part, its terminal and
  agent run on, and a tab whose last pane moves out closes (probe in a
  test herdr session, 2026-11-21). `pane.move` inside one tab does nothing
  (`same_tab`), so the adapter answers `sameTab` with no call, and a
  pane goes to another place in its own tab only by a swap.
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
  name with its extension, and a fault gives only its errno code. A
  HEIC photo gets a JPEG copy beside it at complete (`sipsConvert.ts`:
  macOS `sips` with an argument list, never a shell), and the chat
  gets the copy's path. Each start removes an unfinished upload after
  24 hours and a complete one after 7 days, with no timer
  (`diskUploads.test.ts`).
- The push store (`diskPush.ts`) keeps `vapid.json` and
  `subscriptions.json` in a 0700 folder beside the database, each file
  0600 and replaced in one rename; it makes the P-256 VAPID keys once
  with Node's crypto, keeps at most 10 subscriptions, and a fault gives
  its errno code only (`diskPush.test.ts`).
- `webPushSender.ts` sends a push with the `web-push` package: the
  payload encrypted for the browser's keys, a VAPID JWT whose contact
  is `BRIDGE_PUSH_SUBJECT` (else the public repository's URL; never a
  personal address, as each push service reads it), a TTL of
  1 hour; 404 and 410 are `gone`, any other fault its HTTP status or
  errno code (`webPushSender.test.ts`).
- Tests here use a fake socket, never a real herdr.
- A herdr reply that the contract cannot hold is `badReply`, never a
  throw; a status herdr adds later is the chat's `unknown`, logged once
  (`herdrAgents.test.ts`, audit S-2 and S-3).
