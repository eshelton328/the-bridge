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
  message and a task report come the same way). Only text the owner
  typed or pasted is a prompt (R46): a user line with `origin.kind`
  "human", or an older line with no origin and no `isMeta`. A harness
  input is a `note` entry, by the line's marks and never by words in
  its text: `origin.kind` "task-notification" is "Background task
  finished: <summary>" for the status `completed` ("failed" for
  `failed`, "update" for any other or none; the summary of its
  whole-message wrapper, one line of at most 160 characters, never cut
  inside a surrogate pair), `origin.kind` "peer" is "Message from <origin.name>" with a
  `message` of `origin.body`, else of the inner text of its
  `<cross-session-message>` wrapper (R55); a user line whose whole text,
  or one whole paste, is `<agent-prompt from="NAME">…</agent-prompt>`
  (NAME of a chat name's form) is the same note from NAME, `via`
  `prompt`, and any other text with the tag stays the owner's; and an
  `isMeta` line with no origin that starts "Stop hook feedback:" is
  "Stop hook: reply rewritten". The last reply of the turn before that
  note is a draft: its `replacedBy` is the last reply after the note and
  before the next prompt or hook note, and a draft with no such reply
  (a stop) has none (R62). A queued line of a task or a peer gives
  the same note. Any other meta line or origin (an idle notice, a skill
  body) shows nothing. A slash command's own line shows as
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
  `settings.json`, then each `.claude/settings.json` from the root
  down, then the `settings.local.json` of the root, which in a worktree
  is the main checkout's). The prefix is the manifest's `name`
  (`.claude-plugin/plugin.json`), else the entry name; its `skills`
  paths add to `skills/`, and its `commands` replace `commands/`.
  The files are only read (`claudeSkills.test.ts`).
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
- A rename (R41, R42) calls `workspace.rename` only for a workspace
  that `workspace.list` names, as herdr also takes a workspace's number
  as its ID, or `pane.rename` (for
  any chat, never `agent.rename`, so an agent's herdr name stays as it
  started). The list gives a pane's label as its chat's title before the
  agent's own title. An order calls `workspace.move_block` once with
  every workspace and no `before_workspace_id`, so herdr shows them in
  that order; an order that misses or repeats one is `stale`, with no
  call (`herdrAgents.test.ts`).
- A move to another workspace calls `pane.move` with the destination
  `{ type: 'new_tab', workspace_id }` and `focus: false`, only for a
  workspace that `workspace.list` names and a chat that is `idle` or
  `done` (a shell is idle). herdr gives the pane a new pane ID but keeps
  its terminal, so the chat ID and the API's pane ID stay (probe in a
  test herdr session, 2026-11-23); a workspace whose last pane leaves
  closes, and herdr names it (`closed_workspace_id`, `sourceClosed`).
  A pane of a workspace that the close guard calls `holdsServer` does
  not move (the same name and process checks). A pane of an agent the adapter does not drive (such as gemini)
  lists as a shell, but no write finds it (`herdrAgents.test.ts`).
- A workspace close (R41) reads the workspace, agent and pane lists and
  calls `workspace.close` with `close_group: false`, never herdr's
  group close (`group` when herdr asks for it). It refuses a workspace
  with another pane count than the owner saw (`panesChanged`), and
  `holdsServer` for a pane whose chat's herdr name, label or terminal
  title (Claude's session name; a herdr name clears when its agent
  ends) is guarded (`bridge-coord`, from `main.ts`), or a pane whose shell or foreground process is the
  server or a process above it (`pane.process_info` and
  `processAncestors.ts`, which runs `ps` with an argument list; a walk
  that fails refuses too). Then it reads the lists again, as another
  client can add a pane or start a turn during those reads, and refuses
  another pane set, a chat that waits (`needsYou`) or works or has a
  state herdr cannot tell (`working`), all with no close
  (`herdrAgents.test.ts`).
- A new chat (slice W3) starts in a new pane: `pane.split` beside a
  chat in its folder, or `tab.create` in the folder of the workspace's
  first pane, both with no focus change. The folder must be in the chat
  root (`BRIDGE_CHAT_ROOT`) once both are real paths, so a link or
  ".." cannot leave it (`folderNotAllowed`, nothing made); a name in
  use is `nameTaken`. Then `agent.start` with an argument list of
  `-n <name>` and `--model <alias>` only, never a flag that skips a
  permission (again every 200 ms, at most 10 times, while herdr says
  the new shell is busy: `agent_pane_busy`), and `agent.wait` (30 s)
  for idle, done or blocked; herdr's `timeout` is `starting`, and any
  other wait failure (the agent ended) an error. A root of "/" holds
  every folder. A
  blocked start is `needsYou` and stays so: the adapter sends no key
  and answers no prompt of it, such as Claude's folder trust question
  (`herdrAgents.test.ts`). A fork starts so beside a Claude chat, adding
  only `--resume <session> --fork-session`; a Codex chat, a shell and a
  session with no saved file (no turn yet, so `--resume` starts nothing)
  are `noSession`, with no pane made. The default name is the first
  free of `<name>-fork`, `-fork-2` to `-fork-9`. A side question finds the
  session as a fork does (`noSession` likewise, also for a chat with no
  folder) and gives the session, the folder and the question to the
  `runSide` option, with the chat's record: `codeMode` when the session file's newest
  `repl-mode` line (in its last 1 MiB, else its first 64 KiB) says so, and
  the chat's transcript entries on call; with no option it is
  `unreachable`. `main.ts` gives
  `claudeSideRunner` (`claudeSide.ts`): `claude -p --resume <session>
  --fork-session --no-session-persistence` with the model `sonnet`, the
  tools `Read,Grep,Glob` only, stream-json output and an empty MCP
  config (`--strict-mcp-config`), with `--restricted` (no user, project
  or local settings file, so none of the owner's hooks, allow rules or
  plugins, and the file tools stay in the working folder), in the chat's folder with an argument
  list, never a shell, with only the named variables of the server's
  environment that `claude` needs (`PATH`, `HOME`, `USER`, the locale,
  `TMPDIR`, the proxy and CA variables, `CLAUDE_CONFIG_DIR`), so no
  `HERDR_` variable (in a herdr pane, Claude Code's herdr hook would
  report the side session as the server pane's) and no token. A
  session started in Code Mode does not resume with these tools (Claude
  Code 2.1.331 refuses it, d-123), so its run has no `--resume` and
  gets on stdin the chat's record before the question: its newest whole
  entries in at most 64 KB (a tool with its name and target only), in a
  fence of tildes longer than any in the record, marked as the chat's
  record and as data. The question goes on stdin. The answer is the
  text of each top-level assistant message; an error result, an exit
  with no result, a command that does not start or a run past its 120 s
  limit is `failed` and logs `side run failed` with the exit, the
  signal and the last 4 KB of stderr (never the question), and an
  abort ends the process (SIGTERM, then SIGKILL after 5 s) (`claudeSide.test.ts`, a fake `claude`). The fake answers
  from `setSideAnswer`, and `hang` waits for the stop. The contract suite has no start or fork (a real Claude).
- An effort change (slice W10) goes to an idle Claude chat with an
  empty box only, as Claude Code's effort keys (`shift+up` and
  `shift+down` in one `agent.send_keys`), never as `/effort` or
  `/model`, which save the owner's default. The keys change the
  session's effort only and stop at `low` and `xhigh`. The adapter
  reads the mark on or above the box's top rule ("◐ medium ·
  /effort"; none can mean `low`), steps from it, or presses
  `shift+down` four times first when it sees none or `max`, and then
  reads the screen up to 4 times in 1.5 s: `set` when it shows the
  level, else `effortNotConfirmed`. A `low` target goes through
  `medium` first, so a chat whose keys change nothing
  (`CLAUDE_CODE_EFFORT_LEVEL`) is not `set`
  (probe in a test herdr session, 2026-11-21; `claudeInput.test.ts`,
  `herdrAgents.test.ts`). The keys write nothing to the session file,
  so after a `set` the list gives the set level until the file's
  change time moves (the next turn names its own effort), and each open
  list stream gets `workspacesChanged` at once.
- A model restart (slice W10) reads the chat's command line as an
  argument list (`claudeArgs.ts`), so a value with a space stays one
  token: the program must be `claude`, and each token a flag on its
  list. It keeps the name, permission mode, added folders, agent,
  settings, plugin folders, effort and `--chrome`, drops the model and
  session flags, and refuses any other token, a flag that skips a
  permission and the `bypassPermissions` mode. A chat with no name on its line gets its herdr name
  (`claudeArgs.test.ts`). The herdr adapter restarts only an idle or
  done Claude chat with an empty box whose session file names another
  model. It reads the arguments and the folder of the pane's `claude`
  process from herdr's `pane.process_info` (never its environment),
  and refuses a folder that is not the agent's (`folderChanged`). It reads the status and the box once more, then
  sends ctrl+c twice and waits up to 5 s for the process to end and for
  herdr to list no agent on the pane, as herdr keeps the name for a
  moment (`agent_name_taken`; else `badReply`: nothing ended). Then it starts Claude in the same pane,
  as a new chat starts, with the kept flags, `--resume <session>` and
  `--model`. Once the old chat has ended, a failed start or another
  session is `failed` with the session, and nothing starts again. The
  log line `chat restarted` holds flag names and herdr's failure code
  only. The session file names the old model until the next turn, so
  the list gives the new model (and drops a kept effort) until the
  file's change time moves, and each open list stream gets
  `workspacesChanged` (probe in test herdr session w10r, 2026-11-21;
  `herdrAgents.test.ts`).
- An input clear empties a Claude chat's box with ctrl+u, for text that
  another client typed there, and reads it again: `cleared` or
  `inputNotEmpty`. A Codex chat gets `noCommands` and no key; the text
  is never returned or logged (`agentPortContract.ts`).
- The Claude artifacts (R27, `claudeArtifacts.ts`) come from the
  session files: an `Artifact` tool call with action `publish` and its
  result. A result that is an error, or whose `toolUseResult.url` is not
  an https claude.ai artifact link, is skipped. A Code Mode chat calls
  the tool inside a script and writes no such record, so its artifacts
  are not found. Each scan reads only the bytes written since the last
  one, splits lines on the byte 0x0a, decodes and parses only a line
  whose bytes name `Artifact` or a result it waits for, and stops at
  1.5 s or 1 GiB (the next scan goes on, and the scan says `partial`).
  The time cap is the limit that counts: a projects folder of 6.8 GiB
  took about 213 lists at the old 32 MiB cap. The scan saves how far it
  read each file (its offset, a line's start) in `scan.json`, 0600 in
  the artifacts folder, so a server restart reads on from there; a file
  that is now shorter is read from the start, and a missing or bad cursor
  file means a read of every file. The cursor is saved only when the
  service calls the scan's `keep`, after the library save, so a failed
  save and a restart find those artifacts again. A file with a publish
  call that waits for its result is saved at that call's line (at most
  64 MiB back), so a restart reads the call and then its result. Each scan reads at
  least one chunk, a line not finished stays for the next scan, and one
  scan runs at a time. A line over 8 MiB is skipped, and a file that
  became shorter is read again. It reads only
  when asked and logs nothing (`claudeArtifacts.test.ts`, from
  made-up lines). The finder of the artifacts service
  (`createClaudeArtifactFinder`) gives each artifact's project in place
  of its folder: the name after `<chat root>/projects/`, else none.
- The artifacts store (`diskArtifacts.ts`) keeps `library.json` in a
  0700 folder beside the database, 0600 and replaced in one rename. A
  missing file is an empty library; a file that the schema does not take
  is the fault `EBADDATA`, never an empty library, so no save writes
  over it. A fault gives its errno code only (`diskArtifacts.test.ts`).
- `projectWorkspaces` (R49) maps a project to the first listed workspace
  with a pane whose real folder is under `<chat root>/projects/<project>/`;
  no chat root maps none, and no path leaves the adapter
  (`herdrAgents.test.ts`).
- A Claude chat's `turnEnd` is its session file's change time; a Codex
  chat, a shell and a chat with no file get null (`agentPortContract.ts`).
- `diskInbox.ts` (R20) lists the open and snoozed attention requests in
  `<brain>/projects/<project>/inbox/*.md` from their front matter: plain
  files of at most 256 KiB whose real path stays in that folder, never a
  symlink; a record it cannot decode is skipped. `origin_session` (a
  UUID) gives the request's origin chat (R49), with `origin_machine`
  when the record has it (the machine ID rule); a session alone is a
  chat of this server's machine, and a bad value or no session gives none. The body goes only to a
  detail. The marks are `inbox.json`, 0600, as `diskArtifacts.ts` keeps
  its file. `watchBrainInbox` watches `projects`, each project folder
  and each real inbox folder with `fs.watch`, and tells once after
  100 ms of quiet; a change in `projects` or a project folder watches
  them again, and it tells once when its watches are ready
  (`diskInbox.test.ts`).
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
  with Node's crypto, keeps at most 10 subscriptions with each one's
  `preview` choice (a file from before the choice reads as none, which
  is on), and a fault gives its errno code only (`diskPush.test.ts`).
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
