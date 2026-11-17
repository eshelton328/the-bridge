# errors

Every error path of the app (d-084).

- Boundaries: `AppBoundary` at the root, `PaneBoundary` inside `PaneSlot`
  (the only place the library's `Pane` renders), `BlockBoundary` around
  rich blocks, and `RouteError` and `NotFound` as the router's defaults.
- `ErrorState.tsx`: the one module every boundary and `NotFound` render
  through. It renders the library's `ErrorState` (d-086) and moves focus
  to the heading of a `page` state, which has no live region.
- `ErrorFallback.tsx`: an error's title, retry and details on
  `ErrorState`. After two failed retries in ten seconds it offers Reload
  (`retryGuard.ts`).
- `reporter.ts`: `report()`, the one sink. It drops repeats, keeps the
  last 50 and logs in development. React's root hooks
  (`rootErrorOptions.ts`) and `globalHandlers.ts` feed it; `ErrorTray`
  shows it in development.
- `appError.ts`: `AppError` (with a `kind`) and `FixtureError`, for bugs.
  An expected failure returns a `Result` from `@bridge/shared`.
- `parseState.ts`: checks a state file against its Zod schema in
  development and tests.

## Rules

- Only this folder imports react-error-boundary, listens for `error` or
  `unhandledrejection`, or logs.
- Each boundary has a crash story and a Vitest test.
