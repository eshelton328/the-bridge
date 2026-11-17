# app

The app's start: `main.ts` installs the global error handlers, creates
the React root with the root error hooks (`errors/rootErrorOptions.ts`)
and renders `AppBoundary` > `RouterProvider` and the dev `ErrorTray`.

- `router.ts`: the router, with `RouteError` and `NotFound` as the
  default error and not-found components, so no route needs a boundary
  of its own (d-084).
- `routeTree.gen.ts`: generated from `routes/` by `pnpm gen:routes`. Never
  edit it; `pnpm check:routes` fails when it is stale.

Only this folder and page entries read stores.
