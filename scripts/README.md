# scripts

The Node scripts behind the root `package.json` scripts: generators,
checks, `pnpm new`, the CI helpers and the keyboard check. Agents read
[AGENTS.md](AGENTS.md) for the rules.

- [fidelity/](fidelity/README.md): `pnpm fidelity`, the checks that
  compare a rendered state with its Figma frame. Open it to run the
  fidelity loop for one frame.
- [secrets/](secrets/AGENTS.md): the tests of the secret and privacy
  scan, which only the CI job `secrets` runs.
- `templates/`: the files `pnpm new` starts from.

## pnpm new

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
`?keyboard-trace` mode ([../web/src/app/README.md](../web/src/app/README.md)) and writes it to
`<traces>/<startedAt>.json`, replacing the file on each POST. The server
makes the file name from the parsed `startedAt`, which must be within the
last day; no client text reaches the path. It takes only `POST` with
`application/json` (405, 415), at most 10 MB (413), and a body of
`{ startedAt, userAgent, samples[] }` (400). A body may also have
`displayMode` (`standalone` or `browser`), `screenHeight`, `screenWidth`,
`devicePixelRatio` (numbers), `safeArea` (`{ top, right, bottom, left }`,
numbers), `reducedMotion` and `automated` (booleans), `kbExperiment` (a
key of letters, digits, `_` and `-`, at most 32, or null), `route` (`{ pathname, state }`: a path of `/`-separated
letters, digits, `_` and `-`, and a state key of letters and digits or
null) and `chat` (`{ state, device }`: a state key or null, and `phone`
or `tablet`); `route` and `chat` take no other keys. Each is checked when
present (400) and may be missing, so a trace from an older client is
still taken. Each chat session has its own `startedAt`, so its own file. A trace whose last
sample is older than the one already written gets 409 and does not
replace it, since a hidden page POSTs while an earlier POST may still be
out. The traces folder is
`KEYBOARD_TRACE_DIR` when set, else `engine/_local/phone-review/traces/`
in the first folder above the repository that has `engine/` (the
ncc-1701 root); it answers 500 when there is none.

`GET /__keyboard-trace/enabled` is the switch for the installed Home
Screen app, where no one can add the URL param. It answers
`{ "enabled": true }` while the file `ENABLED` is in the traces folder,
else `{ "enabled": false }` (also when there is no traces folder), with
`Cache-Control: no-store`. It takes only `GET` and `HEAD` (405), reads no
input and only checks whether that one file exists. The plugin adds it
before the trace endpoint, as connect matches `/__keyboard-trace` as a
prefix of it.

`GET /__keyboard-trace/experiment` is the same kind of switch for the
keyboard experiments (`web/src/app/README.md`). It answers
`{ "experiment": "proxy" }` or `"prevent"` when the file `EXPERIMENT` in
the traces folder holds that name, else `{ "experiment": null }`, with
`Cache-Control: no-store`. It reads at most the file's first 32 bytes and
never sends the file's text.

`pnpm keyboard:slide <trace.json>...` checks traces for a moved page: a
sample with `scrollY`, `scrollTop`, `rootTop` or `vvOffsetTop` off 0 by
more than 1 px, or an `innerHeight` under the one at the trace's start. It
prints one JSON line and exits 1 when a trace has such a sample.
