# state

App-wide Zustand 5 stores, named `<feature>Store.ts`, and the helpers
every store uses. A page's own view store sits in its page folder (d-088).

- `createAppStore.ts`: the only way to make a store. It adds `devtools`
  and registers the store with `resetStores.ts`, so tests and stories
  start clean (`resetAllStores()`).
- `settingsStore.ts`: the owner's settings on this device (d-119), kept
  in localStorage under one key (`bridge/settings`, `lib/deviceSettings.ts`)
  and never sent to the server. It starts at the defaults; only `main.ts`
  calls `startSettingsStorage()`, so a test or a story never reads or
  writes the owner's storage. A failed read or write goes to `report()`.

## Rules (d-083; the lint enforces most)

- R1. Only this folder imports `zustand`.
- R2. Outside tests, read a store through its exported hooks, one per
  value (`useShellSidebarOpen()`), and `use<Feature>Actions()` for
  actions; never the raw store.
- R3, R4. Never call a store hook without a selector, and never select a
  new object or array.
- R5, R6. No equality-function API; no immer, combine, redux or
  subscribeWithSelector without a decision record.
- R7. Every store goes through `createAppStore`.
- R8. Actions sit under an `actions` key and are never replaced.
- R9. No derived values or server data in a store. URL state goes in
  search params.
- R11. Update with `set`, never by changing what `get()` returns.
- R12. Each `*Store.ts` has a test beside it that drives its actions
  through `getState()`; `pnpm check:structure` checks it.
