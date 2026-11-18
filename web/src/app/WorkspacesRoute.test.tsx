import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// Through the real route: the Workspaces page keeps what Erik changed in its view in the page store, so the page
// shows it again after he visits another page.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  return testRender(<RouterProvider router={router} />)
}

const columns = () => page.getByRole('separator', { name: 'Resize columns' })

let view: { unmount: () => Promise<void> } | undefined

beforeEach(async () => {
  await page.viewport(1512, 982)
})

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
})

describe('the Workspaces route', () => {
  it('keeps a resized column split at its size when the page unmounts and mounts again', async () => {
    view = await renderAt('/workspaces?state=twoPanes')
    await expect.element(columns()).toHaveAttribute('aria-valuenow', '50')
    await userEvent.click(columns())
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    const resized = columns().element().getAttribute('aria-valuenow')
    expect(resized).not.toBe('50')
    await view.unmount()
    view = await renderAt('/workspaces?state=twoPanes')
    await expect.element(columns()).toHaveAttribute('aria-valuenow', resized)
  })

  it('keeps a draft typed in a pane when the page unmounts and mounts again', async () => {
    view = await renderAt('/workspaces?state=twoPanes')
    const draft = () => page.getByRole('region', { name: 'drift check' }).getByRole('textbox')
    await userEvent.fill(draft(), 'keep this draft')
    await view.unmount()
    view = await renderAt('/workspaces?state=twoPanes')
    await expect.element(draft()).toHaveValue('keep this draft')
  })
})
