# routes

TanStack Router file routes. The file names follow the router, not the
camelCase rule: `__root.tsx`, `index.tsx`, a URL segment such as
`inbox.tsx`, `$id` for a param.

A route is thin: it imports one page's `index.ts` and wires its search
schema, loader and entry component. Nothing else.

```tsx
export const Route = createFileRoute('/inbox')({
  validateSearch: inboxSearch,
  loaderDeps: ({ search }) => ({ state: search.state, source: search.source }),
  loader: ({ deps }) => loadInboxState(deps.state, deps.source),
  component: InboxPage,
})
```

After you add or rename a route, run `pnpm gen:routes` (`pnpm new page`
does). Errors and unknown paths fall to the router's defaults in
`../app/router.ts`.
