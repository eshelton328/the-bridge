// The loading standard's timing (2026-11-23): a page's loading layout shows only after 200 ms with no data, and then
// for 300 ms at least, so a quick load shows no skeleton and a slow one never blinks. The router gives it to each
// route's pendingComponent (app/router.ts); the Workspaces page, which draws its loading layout in its own tree
// (pages/workspaces/useSettledState.ts, NCC-181), uses the same.
export const pendingTiming = { defaultPendingMs: 200, defaultPendingMinMs: 300 } as const
