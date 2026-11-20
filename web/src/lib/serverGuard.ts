// The rule behind testSetup.ts's server guard, apart so a unit test can call it.

/**
 * The error for a test's `fetch` of the-bridge server's API (`/api/…` on the page's origin), or undefined for any
 * other URL. The test server sends `/api` to a real server through the Vite proxy (vite.config.ts), so a test that
 * reads it with no stub gets that machine's data, or none: RouteScroll's `/workspaces?source=live` case failed
 * once in a full verify that way. A test stubs `fetch` (`vi.stubGlobal`) for each read it makes.
 */
export function serverReadError(url: string, origin: string): Error | undefined {
  const target = new URL(url, origin)
  if (target.origin !== origin) return undefined
  if (target.pathname !== '/api' && !target.pathname.startsWith('/api/')) return undefined
  return new Error(
    `fetch(${target.pathname}) read the real server: stub fetch for each server read in the test file, also for a read that an earlier test's page started (vi.stubGlobal, app/liveServerStub.ts)`,
  )
}
