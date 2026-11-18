import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
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

/** Whether OptionList draws a choice as checked: its row's state, which follows the list's value, not the input's. */
const drawnChecked = (radio: { element: () => Element }) => radio.element().closest('label')?.dataset.state

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

  it("gives a screen reader each tablet card's source, which only its mark shows (T1)", async () => {
    await page.viewport(756, 1158)
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/artifacts?state=libraryTablet'] }),
    })
    const view = await testRender(<RouterProvider router={router} />)
    const card = page.getByText('Hono server spike', { exact: true })
    await expect.element(card).toBeVisible()
    const box = card.element().closest('[data-figma="artifact card · Hono server spike"]')
    expect(box?.textContent).toContain('Codex site')
    await view.unmount()
  })

  it('moves the sort with an arrow key and keeps the Sort sheet open (M4)', async () => {
    await page.viewport(390, 844)
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/artifacts?state=sortPhone'] }),
    })
    const view = await testRender(<RouterProvider router={router} />)
    const sheet = page.getByRole('dialog', { name: 'Sort by' })
    const newest = sheet.getByRole('radio', { name: /Newest first/ })
    await expect.element(newest).toBeChecked()
    // The sheet puts the focus on itself as it opens; then the checked choice takes it.
    await expect.poll(() => document.activeElement?.getAttribute('role')).toBe('dialog')
    newest.element().focus()
    await expect.poll(() => document.activeElement).toBe(newest.element())
    await userEvent.keyboard('{ArrowDown}')
    const oldest = sheet.getByRole('radio', { name: /Oldest first/ })
    await expect.poll(() => drawnChecked(oldest)).toBe('checked')
    expect(drawnChecked(newest)).toBe('unchecked')
    // The Sort button under the sheet's scrim names the sort it set.
    expect(document.querySelector('button[aria-label="Sort: Oldest"]')).not.toBeNull()
    await expect.element(sheet).toBeVisible()
    // A pick still closes the sheet.
    await sheet.getByText('Title', { exact: true }).click()
    await expect.element(sheet).not.toBeInTheDocument()
    await view.unmount()
  })

  it('moves the project with an arrow key in File in a project (M7)', async () => {
    await page.viewport(390, 844)
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/artifacts?state=filePhone'] }),
    })
    const view = await testRender(<RouterProvider router={router} />)
    const sheet = page.getByRole('dialog', { name: 'File in a project' })
    const skillEvals = sheet.getByRole('radio', { name: /skill-evals/ })
    await expect.element(skillEvals).toBeChecked()
    await expect.poll(() => document.activeElement?.getAttribute('role')).toBe('dialog')
    skillEvals.element().focus()
    await expect.poll(() => document.activeElement).toBe(skillEvals.element())
    await userEvent.keyboard('{ArrowUp}')
    await expect.poll(() => drawnChecked(sheet.getByRole('radio', { name: /omni-brain/ }))).toBe('checked')
    expect(drawnChecked(skillEvals)).toBe('unchecked')
    await expect.element(sheet).toBeVisible()
    await view.unmount()
  })
})
