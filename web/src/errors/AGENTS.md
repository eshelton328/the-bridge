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

- Only this folder imports react-error-boundary, listens for `error` or
  `unhandledrejection`, or logs; the lint enforces it.
- Each boundary has a Vitest test and a crash story.
