// Renders React into the page for a browser-mode Vitest test and returns
// its unmount. Query the result with `page` from 'vitest/browser'. Tests
// only; React's act() wants IS_REACT_ACT_ENVIRONMENT set.
import { act, type ReactElement } from 'react'
import { createRoot, type RootOptions } from 'react-dom/client'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

export async function testRender(ui: ReactElement, options?: RootOptions): Promise<{ unmount: () => Promise<void> }> {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container, options)
  await act(async () => {
    root.render(ui)
    await Promise.resolve()
  })
  return {
    unmount: async () => {
      await act(async () => {
        root.unmount()
        await Promise.resolve()
      })
      container.remove()
    },
  }
}
