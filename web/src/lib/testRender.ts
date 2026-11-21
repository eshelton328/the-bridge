// Renders React into the page for a browser-mode Vitest test and returns
// its unmount. Query the result with `page` from 'vitest/browser'. Tests
// only.
//
// React's act() wants IS_REACT_ACT_ENVIRONMENT set, and while it is set React
// writes a warning with a component stack for each state update outside act().
// A browser test clicks and types with real events, outside act(), so with it
// always set one CI shard wrote 36 872 such warnings and every click paid for
// the stacks and for sending them to the runner: a click took 5 to 8 s and three
// files timed out (the-bridge #322, CI run 44877302138). So it is set only
// inside inAct().
import { act, type ReactElement } from 'react'
import { createRoot, type RootOptions } from 'react-dom/client'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', false)

/** Runs `work` inside React's act(), with IS_REACT_ACT_ENVIRONMENT set only while it runs. */
export async function inAct(work: () => Promise<void>): Promise<void> {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  try {
    await act(work)
  } finally {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', false)
  }
}

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
  await inAct(async () => {
    root.render(ui)
    await Promise.resolve()
  })
  const unmount = async () => {
    if (!mounted.delete(unmount)) return
    await inAct(async () => {
      root.unmount()
      await Promise.resolve()
    })
    container.remove()
  }
  mounted.add(unmount)
  return { unmount }
}
