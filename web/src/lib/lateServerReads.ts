// For a test file that stubs fetch in each test (vi.stubGlobal) and removes the stub in afterEach
// (vi.unstubAllGlobals). A page's router can start a read after its test ended: a live event's reload calls
// router.invalidate(), and the loader reads the server a few frames later, even after the view unmounted. With
// the test's stub gone, that read reached testSetup.ts's server guard and failed the test
// (WorkspacesLiveUnavailable.test.tsx, the-bridge #309 CI run 44852804622).
import { afterAll, beforeAll } from 'vitest'
import { serverReadError } from './serverGuard.ts'

/**
 * From the file's first test to its last, an `/api` read with no test stub gets no answer, as from a server that
 * is down (`TypeError`), never the real server. Each test's own `vi.stubGlobal('fetch')` replaces it while that
 * test runs, and `vi.unstubAllGlobals()` puts it back. Call it at the top of the file.
 */
export function answerLateServerReads(): void {
  let before: typeof globalThis.fetch | undefined
  beforeAll(() => {
    const real = globalThis.fetch
    before = real
    globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (serverReadError(url, window.location.origin) === undefined) return real(input, init)
      return Promise.reject(new TypeError('Failed to fetch: no server in this test'))
    }
  })
  afterAll(() => {
    if (before !== undefined) globalThis.fetch = before
  })
}
