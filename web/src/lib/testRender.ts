// Renders React into the page for a browser-mode Vitest test and returns
// its unmount. Query the result with `page` from 'vitest/browser'. Tests
// only; React's act() wants IS_REACT_ACT_ENVIRONMENT set.
import { act, type ReactElement } from 'react'
import { createRoot, type RootOptions } from 'react-dom/client'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

const mounted = new Set<() => Promise<void>>()

/** The number of views that testRender mounted and that are still in the page. */
export function mountedViews(): number {
  return mounted.size
}

/**
 * Unmounts every view that testRender mounted and that is still in the page. Call it in afterEach before a viewport
 * change: a resize with the app still in the page lays the whole app out again, up to 1.9 s for each test.
 */

export async function unmountRendered(): Promise<void> {
  for (const unmount of [...mounted]) await unmount()
}

export async function testRender(ui: ReactElement, options?: RootOptions): Promise<{ unmount: () => Promise<void> }> {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container, options)
  await act(async () => {
    root.render(ui)
    await Promise.resolve()
  })
  const unmount = async () => {
    if (!mounted.delete(unmount)) return
    await act(async () => {
      root.unmount()
      await Promise.resolve()
    })
    container.remove()
  }
  mounted.add(unmount)
  return { unmount }
}
