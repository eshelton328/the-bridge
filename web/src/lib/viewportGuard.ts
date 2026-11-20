// The rule behind testSetup.ts's viewport guard, apart so a Node-free unit test can call it.

/**
 * The error for a viewport change after a test body has passed while a view it rendered is still in the page, or
 * undefined when the change is allowed. Such a change (an afterEach size reset before the unmount) lays the whole app
 * out again for nothing: 0.4 to 1.9 s for each test in ToolkitWideScreen. A failed test is left alone, so the guard
 * never hides its real error.
 */
export function viewportChangeError(testState: string | undefined, mounted: number): Error | undefined {
  if (testState !== 'pass' || mounted === 0) return undefined
  return new Error(
    `page.viewport() after the test passed, with ${String(mounted)} rendered view(s) still in the page: call await unmountRendered() first in afterEach (lib/testRender.ts)`,
  )
}
