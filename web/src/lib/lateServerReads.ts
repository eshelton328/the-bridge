// For a test file that stubs fetch in each test (vi.stubGlobal) and removes the stub in afterEach
// (vi.unstubAllGlobals). A page's router can start a read after its test ended: a live event's reload calls
// router.invalidate(), and the loader reads the server a few frames later, even after the view unmounted. With
// the test's stub gone, that read reached testSetup.ts's server guard and failed the test
// (WorkspacesLiveUnavailable.test.tsx, the-bridge #309 CI run 44852804622).
import { afterAll, beforeAll, beforeEach } from 'vitest'
import { serverReadError } from './serverGuard.ts'

/**
 * Whether `answerLateServerReads` answers a read of `url` itself: an `/api` read on the page's origin (`serverReadError`)
 * when no test body runs. A read while the body runs (`testState` 'run') goes on to the server guard.
 */
export function answersLateRead(url: string, origin: string, testState: string | undefined): boolean {
  return serverReadError(url, origin) !== undefined && testState !== 'run'
}

/**
 * From the file's first test to its last, an `/api` read with no test stub that starts after a test body ended (in
 * `afterEach`, or before the next test's stub) gets no answer, as from a server that is down (`TypeError`), never
 * the real server. While a test body runs, such a read still goes to the server guard and fails the test. Each test's
 * own `vi.stubGlobal('fetch')` replaces this fetch while that test runs, and `vi.unstubAllGlobals()` puts it back.
 * Call it at the top of the file.
 */
export function answerLateServerReads(): void {
  let before: typeof globalThis.fetch | undefined
  // The state of the test that runs now: 'run' while its body runs; Vitest sets 'pass' or 'fail' before afterEach.
  let testState: () => string | undefined = () => undefined
  beforeEach((context) => {
    testState = () => context.task.result?.state
  })
  beforeAll(() => {
    const real = globalThis.fetch
    before = real
    globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (!answersLateRead(url, window.location.origin, testState())) return real(input, init)
      return Promise.reject(new TypeError('Failed to fetch: no server in this test'))
    }
  })
  afterAll(() => {
    if (before !== undefined) globalThis.fetch = before
  })
}
