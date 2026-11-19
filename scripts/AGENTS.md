# scripts

Node scripts the `package.json` scripts run. Each is TypeScript that Node
24 runs directly (type stripping), and each check prints one JSON line
and exits 1 on a problem.

| Script                   | What it does                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `new.ts`                 | `pnpm new page\|screen\|block\|state`: starts a file from `templates/`                                                                                       |
| `stateIndex.ts`          | Adds a state to a page's `states/index.ts` for `pnpm new state`, at the end, keeping the order and comments                                                  |
| `genRoutes.ts`           | Writes `web/src/app/routeTree.gen.ts`; `--check` fails when it is stale                                                                                      |
| `genRegistry.ts`         | Writes `web/src/design/registry.gen.ts`, one canvas board per state file; `--check`                                                                          |
| `checkStates.ts`         | Every state file is in its `states/index.ts` and has a story (d-082)                                                                                         |
| `checkStructure.ts`      | Folders match `web/src/structure.ts`; each page has its files; a component file exports its own name; each store has a test                                  |
| `checkCycles.ts`         | No import cycle in `web/src` or `shared/src` (ported from the library)                                                                                       |
| `checkAgentsMd.ts`       | Every folder has an AGENTS.md, a CLAUDE.md shim, and a link from its parent (ported)                                                                         |
| `testShards.ts`          | Splits test files into CI shards by measured time (longest first, to the shard with the least time); `testSequencer.ts` is the Vitest sequencer that uses it |
| `shardTimes.ts`          | `pnpm shard:times <run-id>`: writes `testShardTimes.json`, each file's time in the test-unit shard jobs of a CI run                                          |
| `ciPlan.ts`              | The plan job of `ci.yml`: whether a PR's changed files can change the fidelity result                                                                        |
| `keyboardCheck.ts`       | `pnpm keyboard:served`: the keyboard check of screen review R20 to R22 on the served app (below); `keyboardCheckLib.ts` holds its pure parts                 |
| `keyboardTracePlugin.ts` | The dev server's `/__keyboard-trace` endpoint (below)                                                                                                        |

[fidelity/AGENTS.md](fidelity/AGENTS.md): `pnpm fidelity`, the text, position
and rule checks of the fidelity loop, and `pnpm fidelity:refs`.

[secrets/AGENTS.md](secrets/AGENTS.md): the tests of the secret and privacy
scan (`.gitleaks.toml`), which only the CI job `secrets` runs.

`pnpm new`:

```sh
pnpm new page toolkit --state overview --frame T1   # a page, its route and first state
pnpm new screen InboxFilterScreen --page inbox       # a second screen of a page
pnpm new block InboxRow --page inbox                 # a page block; leave out --page for a shared block
pnpm new state filterOpen --page inbox --frame D4    # a state file, its index entry and its story
```

It leaves `TODO` markers; the tests fail until each is filled in.

## The served keyboard check

`pnpm keyboard:served` checks the keyboard on the served app, before
bridge-coord tells the owner that a chat screen is ready. It opens the
Workspaces chat (`?state=phoneChatFull`, R20), the Inbox chat
(`?state=chat`, R21) and the Inbox discussion (`?state=discussionPage`
and `?state=changeProposedPage`, Discuss) in Playwright's WebKit with the iPhone 15 profile at
393 × 852, the installed app's screen. For each chat it:

1. puts a fake `window.visualViewport` in the page before the app loads,
   as `WorkspacesChatDock.test.tsx` does;
2. blurs a focused field and waits 600 ms (a state can open with the
   composer focused), then taps the composer, scrolls the window by the keyboard's height as iOS
   does for a focused field, and shrinks the fake viewport by 336 px on
   the library's keyboard curve (250 ms, `cubic-bezier(0.38, 0.7, 0.125,
   1)`), one step each frame;
3. blurs the field and grows the viewport back on the same curve;
4. samples every animation frame and checks the owner's acceptance rules
   (R22): the header's top is the same in every frame, `window.scrollY`
   is 0, the lowest text of the message list stays above the composer,
   the shell, the chat and its header, list and composer keep an
   opacity of 1, and with the keyboard all the way open the composer
   ends above it.

It writes `<chat>-frames.json` and `<chat>-sheet.png` (24 frames of a
recording, the keyboard drawn grey) to `reports/keyboard/<time>/`, which
git ignores, prints one JSON line and exits 1 when a check fails. The
repo holds no host: the app's URL comes from `--url <url>` or the
`SERVED_APP_URL` environment variable (the served-app facts in the brain
give its value), and with neither set the check stops with exit 2 and a
message that names both. Flags: `--url`, `--keyboard <px>`, `--only workspaces|inbox|discuss|discussThread`, `--out <dir>` and
`--no-focus-scroll`. It needs WebKit (`pnpm exec playwright install
webkit`) and `ffmpeg` on the PATH. Desktop WebKit is not iOS: the fake
keyboard stands in for iOS's, and desktop WebKit scrolls the window
only when the document is taller than the screen, where iOS also pans
a page that fits. So `window.scrollY` catches a document that grew past
the screen, not iOS's pan, and a pass here comes before the owner's phone
recording, not in its place.

## The keyboard trace endpoint

`keyboardTracePlugin.ts` is a Vite plugin that `web/vite.config.ts` adds,
with `apply: 'serve'`, so only the dev server has it and a build does
not. Its `POST /__keyboard-trace` takes the trace of the app's
`?keyboard-trace` mode (`web/src/app/AGENTS.md`) and writes it to
`<traces>/<startedAt>.json`, replacing the file on each POST. The server
makes the file name from the parsed `startedAt`, which must be within the
last day; no client text reaches the path. It takes only `POST` with
`application/json` (405, 415), at most 10 MB (413), and a body of
`{ startedAt, userAgent, samples[] }` (400). A trace whose last
sample is older than the one already written gets 409 and does not
replace it, since a hidden page POSTs while an earlier POST may still be
out. The traces folder is
`KEYBOARD_TRACE_DIR` when set, else `engine/_local/phone-review/traces/`
in the first folder above the repository that has `engine/` (the
ncc-1701 root); it answers 500 when there is none.

## Rules

- A generator writes only `*.gen.ts` files and has a `--check` mode that
  `pnpm verify` runs.
- Test pure functions in a `*.test.ts` beside the script (`node --test`).
- `skillQuery.test.ts` tests a web helper's speed in Node, as Chromium's
  regex engine hides the backtracking that Safari and Node show.
- Change a template and its use in `new.ts` together, and run each
  `pnpm new` kind once in a scratch copy to prove the result passes
  `tsc` and the lint.
