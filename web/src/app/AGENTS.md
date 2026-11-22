# app

The app's start: `main.ts` calls `mountApp()` (`mountApp.ts`), which
installs the global error handlers, creates the React root with the root
error hooks (`errors/rootErrorOptions.ts`) and renders `AppBoundary` >
`RouterProvider`, with the dev `ErrorTray` beside `AppBoundary` so it
still shows a crash that replaces the app (`mountApp.test.ts`, audit W-9,
W-11).
`router.ts` sets `RouteError` and `NotFound` as the default error and
not-found components, so no route needs a boundary of its own (d-084).

- Only this folder and page entries read stores (`web/src/structure.ts`).
- [push/AGENTS.md](push/AGENTS.md): read before you change the service
  worker's registration, the "seen" beat or how a notification opens a
  chat (d-118).
- Tests that render a page through the real route tree, loader and page
  store sit here; the Inbox ones share `inboxRouteHelpers.ts`.

## Page bounce and page zoom

The owner's decision (2026-11-18): in the installed app the page never
bounces past the screen and never zooms, on any platform.

- The lock in `src/index.css` applies only under `html[data-app]`, which
  `markApp()` sets before the first render. Storybook and the fidelity
  screenshots load `index.css` without it, so a tall story still
  scrolls (`DocumentScroll.test.tsx`).
- Under `html[data-app]`, `#root` is `position: fixed; inset: 0`, so
  the document has no scroll range and only a ScrollFrame body or a shell
  pane scrolls; iOS scrolls the document for a focused field otherwise
  (`RouteScroll.test.tsx`).
- iOS ignores `user-scalable=no`, so `blockPageZoom()` cancels gesture
  events on iOS. A part that zooms itself with a pinch marks itself
  `data-allow-pinch` (`pageZoom.test.ts`, `ToolkitMapZoom.test.tsx`).

## Keyboard trace

`?keyboard-trace` and the dev server's switch record the phone keyboard
for the owner's phone review. Read [README.md](README.md) when you turn
tracing on or off, or change what a trace records.

- `main.ts` starts it only when `import.meta.env.DEV` is true, and
  imports the trace modules dynamically, so a build has none of them.
- The trace only reads: it changes no frame, navigation or AppShell
  behaviour.
- A trace never records message text, a chat title, a name or a field's
  value (`keyboardChatTrace.test.ts`), and no search param but `state`
  and a short `kb-experiment` key (`keyboardTrace.test.ts`).
- Under automation (`navigator.webdriver`) the switch starts no trace;
  the param still traces, marked `automated` (`keyboardTraceSwitch.test.ts`).
- Trace fields are additive: add a field, never rename or drop one, and
  keep the sample read free of new layout reads (`keyboardTop` and
  `dockInset` read only `visualViewport` and the last dock event).
- `keyboardProxy.ts` gives the composer the focus through a proxy field on
  iOS, in every build (screen reviews R27 and R37). It acts only on a
  touch tap on a composer field or its box, never on Send, Stop, Attach or
  another control, and never on a long press; it moves the focus only
  a frame after AppShell's dock has stopped (`keyboardProxy.test.ts`).
  The composer expands as the dock starts to rise, on the library's
  `appShellDockEvent`, never at the tap (R39,
  `WorkspacesComposerCollapsed.test.tsx`).
