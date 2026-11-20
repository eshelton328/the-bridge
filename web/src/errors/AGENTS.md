# errors

Every error path of the app (d-084).

- Throw `AppError` or `FixtureError` (`appError.ts`) only for a bug. An
  expected failure returns a `Result` from `@bridge/shared`.
- `report()` in `reporter.ts` is the one sink; the root hooks and
  `globalHandlers.ts` feed it.
- Render a pane only through `PaneSlot`, the one file that renders the
  library's `Pane`, so every pane has a `PaneBoundary` (`structure.ts`).
- Every boundary and `NotFound` render through `ErrorState.tsx`, which
  wraps the library's `ErrorState` (d-086).
- Every `AppShell` passes `reportShellDiagnostic` (`shellDiagnostic.ts`), one module-level function, as `onDiagnostic` (audit L-8, `app/ShellDiagnostic.test.tsx`).

## Rules

- Wrap the content of each `AppShell` `list`, `detail` and `side` slot in
  `SlotBoundary`, keyed by what it shows; never `rail` or `tabBar`, and
  leave an empty slot `undefined`, since `AppShell` draws a column for any
  element (`WorkspacesSlotBoundary.test.tsx`, audit W-4).
- A phone view that fills the screen has no tab bar, so its
  `SlotBoundary` takes a `secondary` way out
  (`app/WorkspacesSlotRoute.test.tsx`).
- Only this folder imports react-error-boundary, listens for `error` or
  `unhandledrejection`, or logs; the lint enforces it.
- Each boundary has a Vitest test and a crash story.
- `report()` keeps an error once: it drops the same object, and an
  equal one (source, name, message, first stack frame) within 2 s, and
  skips `redirect`, `notFound` and `AbortError` (`reporter.test.ts`,
  audit W-5).
- `RouteError` replaces the page with its rail and tab bar, so it offers
  Go to Inbox beside Retry, except on the Inbox
  (`app/WorkspacesRouteRecovery.test.tsx`, audit W-10).
- Each boundary passes `ErrorFallback` its own `retryScope` (`useId()`,
  or the path for `RouteError`), so used-up retries in one boundary leave
  Retry in another (`app/WorkspacesRouteRecovery.test.tsx`, audit W-10).
- `clientErrorSender.ts` posts each report to `POST /api/client-errors`
  (d-115), added by `main.ts` only in a build that reads the live server
  (`readsLiveServer`, d-117). A report holds the error's name, its own
  message, the stack frames with no header and the route's path. An
  error whose message can hold transcript, draft, tool or server text
  (`kindOnly`: the transcript, layout and live misses, ZodError,
  SyntaxError) sends its name and kind only; add a new such error there
  (`clientErrorSender.test.ts`, `pages/workspaces/liveTranscriptReport.test.ts`).
- The sender sends one report at a time from a short queue. A 429 stops
  it for the server's 60 s window, a 400 drops the report with one dev
  warning, and a network failure or a post with no answer in 8 s drops
  it. It never calls `report()` and
  never throws.
