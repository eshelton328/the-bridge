import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The Artifacts page through the real route and page entry: what the
// props-only stories cannot show, because they do not navigate.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(() => {
  resetAllStores()
})

describe('the Artifacts route', () => {
  it('opens each page that has a route from the rail', async () => {
    await page.viewport(1512, 982)
    const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/artifacts'] }) })
    const view = await testRender(<RouterProvider router={router} />)
    for (const [name, path] of [
      ['Workspaces', '/workspaces'],
      ['Toolkit', '/toolkit'],
      ['Inbox', '/inbox'],
    ] as const) {
      await router.navigate({ to: '/artifacts' })
      await page
        .getByRole('navigation', { name: 'Main' })
        .getByRole('button', { name: new RegExp(`^${name}`) })
        .click()
      await expect.poll(() => router.state.location.pathname).toBe(path)
    }
    await view.unmount()
  })

  it('opens the Filter sheet from T1 and returns to T1 with the boxes on Show or Escape (T3)', async () => {
    await page.viewport(756, 1158)
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/artifacts?state=libraryTablet'] }),
    })
    const view = await testRender(<RouterProvider router={router} />)
    const filter = page.getByRole('button', { name: 'Filter', exact: true })
    const sheet = page.getByRole('dialog', { name: 'Filter' })
    await filter.click()
    await expect.element(sheet).toBeVisible()
    await sheet.getByText('Codex sites').click()
    await sheet.getByRole('button', { name: 'Show 7 artifacts' }).click()
    await expect.element(sheet).not.toBeInTheDocument()
    // Back on T1, the box stays checked: the sheet opens with it again.
    await filter.click()
    await expect.element(sheet.getByRole('checkbox', { name: 'Codex sites' })).toBeChecked()
    await sheet.getByRole('button', { name: 'Clear' }).click()
    await expect.element(sheet.getByRole('checkbox', { name: 'Codex sites' })).not.toBeChecked()
    await sheet.getByText('omni', { exact: true }).click()
    // Escape, as the sheet's dismiss layer hears it on the document.
    sheet.element().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await expect.element(sheet).not.toBeInTheDocument()
    await filter.click()
    await expect.element(sheet.getByRole('checkbox', { name: 'omni', exact: true })).toBeChecked()
    await view.unmount()
  })
})
