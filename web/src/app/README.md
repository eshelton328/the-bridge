# app

The app's start (`main.ts`), the router and the tests that run a page
through the real route tree. Agents read [AGENTS.md](AGENTS.md) for the
rules.

## No page bounce, no page zoom

The owner's decision (2026-11-18): in the installed app, the page never pulls
past the screen and bounces, and the page never zooms, on any platform.
Before it, tapping the Inbox search on iOS zoomed the page (iOS Safari
zooms to a focused field whose font is under 16 px, and the app keeps the
Figma sizes), and a pinch on the Toolkit map zoomed the whole app.

- `src/index.css`: under `html[data-app]`, html and body fill the window
  with `overflow: hidden` and `overscroll-behavior: none`, so the document
  never scrolls and only the shell's own scroll areas do. `touch-action:
  pan-x pan-y` on html stops a pinch and a double tap from zooming the
  page. Only the running app sets `data-app` (`markApp()` in
  `appMarker.ts`). Storybook and the fidelity screenshots load
  `index.css` without it, so a story taller than its frame (Inbox >
  Screens > The list, 1158 px tall in a 982 px frame) still scrolls the
  document. `DocumentScroll.test.tsx` calls `markApp()` for the locked
  case and checks that the document scrolls without it.
- `index.html`: the viewport meta sets `maximum-scale=1,
  user-scalable=no` for every platform, and `viewport-fit=cover`, so iOS
  draws the app under the status bar and the home indicator and the
  library's AppShell pads its panes by `env(safe-area-inset-*)`.
- `pageZoom.ts`: iOS Safari ignores `user-scalable=no`, so on iOS (and
  iPadOS, which reports a Mac with touch points) a non-passive listener
  cancels each `gesturestart` and `gesturechange` on the document. A part
  that zooms itself with a pinch marks itself `data-allow-pinch`, and
  gestures that start inside it go through. The Toolkit phone map's
  window does (MapGraph `zoom`, `ToolkitMapZoom.test.tsx`); before it,
  the map's pinch was the page zoom.

`user-scalable=no` turns off browser zoom, which WCAG 1.4.4 (Resize Text)
asks apps to allow. That is the owner's decision for his own app.

## Keyboard trace

Open the dev or served app with `?keyboard-trace` (for example
`/workspaces?state=phoneChatFull&keyboard-trace`) to record what the
viewport and the shell do while the keyboard opens and closes.

The installed Home Screen app (standalone) has no URL bar, so the dev
server also has a switch. When the URL has no param, the app asks
`GET /__keyboard-trace/enabled` once on load, and runs the chat sessions
below, with no overlay, when it answers `{ "enabled": true }`, that is,
while the file `ENABLED` is in the traces folder ([../../../scripts/README.md](../../../scripts/README.md)).
bridge-coord turns tracing on with `touch <traces>/ENABLED` and off by
deleting the file; the app reads the switch on its next load. A failed
answer, an answer slower than 2 s or any answer but `{ "enabled": true }`
means off, with no error shown. Under automation (`navigator.webdriver`
is true, as Playwright sets it) the app does not ask the switch and
starts no trace, so a test run's traces stay apart from the owner's; the
param still traces, and its header says `automated: true`.

`main.ts` calls `startKeyboardTraceIfOn()` (`keyboardTraceSwitch.ts`)
only when `import.meta.env.DEV` is true, and that function imports
`keyboardTrace.ts` or `keyboardChatTrace.ts` dynamically only when the
param or the switch asks for it, so a build has none of them; with the
trace off nothing listens. The mode only reads: it changes no frame,
navigation or AppShell behaviour.

The param traces the whole page, from load, in one file. The switch runs
one short session per keyboard open in a Workspaces chat
(`keyboardChatTrace.ts`), so each file matches one open:

- Route: only `/workspaces`. `main.ts` passes the router's location and
  its `onResolved` event; on any other route that subscription is all
  there is, with no DOM listener, frame, timer or POST.
- Chat open: on `/workspaces` one capture `focusin` listener on the
  document waits for the chat's composer: a `textarea` in the
  `[data-keyboard-keep]` composer of the ScrollFrame footer that is the
  AppShell detail's own child, in a phone or tablet AppShell
  (`.app-shell__root--size_phone` or `--size_tablet`). WorkspacesPhone
  draws that frame only for an open chat (`ui.phoneView: 'chat'`,
  PhoneChat), so the desktop panes, New chat and the list start nothing
  (`WorkspacesChatTrace.test.tsx`).
- Session: it starts at that `focusin` and reads its own header then. The
  keyboard counts as closed once the composer has lost the focus and
  `visualViewport.height` is back to its height at the `focusin` (within
  1 px), a reading that does not depend on AppShell. The session stops
  2 s later with one last POST; a focus back in the composer within the
  2 s keeps the same session. Leaving `/workspaces` stops it at once.
- Its header adds `route` (`{ pathname, state }`: the path and the
  `state` search param only) and `chat` (`{ state, device }`: the
  Workspaces state key and `phone` or `tablet`). A `state` that is not a
  state key (letters and digits) is null. No message text, chat title or
  name is recorded.

Both modes record the same way:

- It records one sample on each animation frame (`raf`) and on `focusin`,
  `focusout`, `pointerdown`, `pointerup`, `resize` and `scroll` of the
  window (capture, so a scroll area's scroll counts) and `vv-resize` and
  `vv-scroll` of `window.visualViewport`. Each sample has `t`
  (`performance.now()`), `type`, `innerHeight`, `vvHeight`,
  `vvOffsetTop`, `vvPageTop`, `scrollY`, `scrollTop`
  (`document.scrollingElement.scrollTop`), `rootTop` (the top of `#root`,
  which is fixed at 0, so any other value is a moved page), `composerTop`
  (the top of the composer's `data-keyboard-keep` wrapper in a ScrollFrame
  footer; null with none) and `keyboard`, the computed
  `--app-shell-keyboard` of `.app-shell__root` (empty when AppShell has
  not set it). `pnpm keyboard:slide <trace.json>` lists the samples that
  show a moved page (screen review R27). A focus or pointer sample (`focusin`, `focusout`,
  `pointerdown`, `pointerup`) adds the target's `targetTag` and
  `targetRole`, never its text, value, name or id. The pointer target
  shows whether a tap landed on the composer's field or its box.
- The last 20000 samples stay in a ring buffer.
- The trace's header, read at its start (each session's own start), has `startedAt`,
  `userAgent`, `displayMode` (`standalone` when
  `matchMedia('(display-mode: standalone)')` matches or
  `navigator.standalone` is true, else `browser`), `screenHeight`,
  `screenWidth`, `devicePixelRatio` and `safeArea` (`top`, `right`,
  `bottom`, `left` in px: a fixed, hidden probe with
  `padding: env(safe-area-inset-*)` is appended, read two animation
  frames later and removed; no POST goes before it is read). The viewport
  meta in `index.html` has `viewport-fit=cover`, so on iOS `env()` gives
  the device's insets; without it every side is 0. The header also has
  `reducedMotion` (whether `prefers-reduced-motion: reduce` matches),
  `kbExperiment` (the `kb-experiment` search param when it is a key of
  letters, digits, `_` and `-`, at most 32, else the experiment that the
  dev server's switch put in force, else null; no other search param is
  recorded) and `automated` (`navigator.webdriver`).
- With the param, a fixed overlay in the top right corner shows the live
  values; from the switch there is none. It is
  `inert`, `aria-hidden` and `pointer-events: none`, so it takes no tap,
  no focus and no room. Its raw styles are a debug readout, not a design.
- Every 2 s (skipping a tick while a POST is out), at once when the
  page is hidden, and once when a chat session stops, it POSTs
  the header and `samples` to the dev server's
  `/__keyboard-trace` (`scripts/keyboardTracePlugin.ts`), which replaces
  the session's file `<startedAt>.json` in the brain's
  `engine/_local/phone-review/traces/`.

## Keyboard experiments

`keyboardExperiment.ts` (dev only) tries two ways to give the composer the
focus with no iOS scroll into view (screen reviews R26 and R27):

- `prevent`: a touch tap on a composer that has no focus cancels its
  `touchend`, calls `focus({ preventScroll: true })` in that same handler
  and puts the caret at the end. The tap may land on the field or on the
  composer box around it (the `data-keyboard-keep` wrapper), but not on a
  control in it: the field is one line in a box about 112 px tall, and
  iOS moves a tap near the field to the field and scrolls it into view
  itself. A tap in a focused composer and a long press (over 450 ms) keep
  their default, so the caret, the selection and the paste menu still
  work.
- `proxy`: the same tap focuses a transparent field at the place where
  the composer docks above the keyboard, then moves the focus and any
  typed text to the composer when the keyboard is up. An IME composition
  holds the move until it ends. The proxy is `aria-hidden` with
  `tabindex="-1"`.

`?kb-experiment=proxy` or `?kb-experiment=prevent` picks one in a
browser. With no param, the app asks `GET /__keyboard-trace/experiment` at
the start, every 5 s while it is visible and when it becomes visible.
bridge-coord writes `proxy` or `prevent` in the file `EXPERIMENT` in the
traces folder, and deletes the file to stop the experiment. Under
automation the app does not ask the switch.
