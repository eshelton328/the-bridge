import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// Slice 2: with `?source=live` each live event that changes the workspaces
// loads the route again (router.invalidate()). A load must keep what the
// owner types and where the focus is, so an event never costs a draft or
// drops the phone's keyboard.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

beforeEach(async () => {
  await page.viewport(1512, 982)
})

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
})

describe('a live reload of the Workspaces route', () => {
  it('keeps the typed draft and the focus in the composer', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/workspaces?state=twoPanes'] }),
    })
    view = await testRender(<RouterProvider router={router} />)
    const box = page.getByRole('region', { name: 'drift check' }).getByRole('textbox')
    await userEvent.click(box)
    await userEvent.keyboard('half a message')
    for (let i = 0; i < 3; i += 1) await router.invalidate()
    await expect.element(box).toHaveValue('half a message')
    expect(document.activeElement).toBe(box.element())
  })
})
