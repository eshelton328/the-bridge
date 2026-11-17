import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The Inbox through the real route, loader and page store: what the
// props-only stories cannot show, because they have no state owner. The
// app's styles and fonts load as in main.ts, and the root has the theme
// and mode of index.html, so the layout tests measure the real layout.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderInbox(state: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/inbox?state=${state}`] }),
  })
  return { router, rendered: testRender(<RouterProvider router={router} />) }
}

async function showState(router: ReturnType<typeof renderInbox>['router'], state: string) {
  await act(async () => {
    await router.navigate({ to: '/inbox', search: { state } })
  })
}

const dialog = () => page.getByRole('dialog', { name: 'Suggested prompt' })
const removeDialog = () => page.getByRole('alertdialog', { name: 'Remove this task?' })
const searchbox = () => page.getByRole('searchbox', { name: 'Search the inbox' })

afterEach(async () => {
  resetAllStores()
  await page.viewport(1512, 982)
})

/** The box of an element found by a locator. */
const box = (el: Element) => el.getBoundingClientRect()

describe('the Inbox route', () => {
  it('closes the prompt dialog with Escape', async () => {
    const { rendered } = renderInbox('promptRead')
    const view = await rendered
    await expect.element(dialog()).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await expect.element(dialog()).not.toBeInTheDocument()
    await view.unmount()
  })

  it('closes the prompt dialog with Done, and opens it again in a state that has it open', async () => {
    const { router, rendered } = renderInbox('promptRead')
    const view = await rendered
    await dialog().getByRole('button', { name: 'Done' }).click()
    await expect.element(dialog()).not.toBeInTheDocument()
    await showState(router, 'nextStep')
    await showState(router, 'promptRead')
    await expect.element(dialog()).toBeVisible()
    await view.unmount()
  })

  it('closes the remove dialog with Escape', async () => {
    const { rendered } = renderInbox('removeConfirm')
    const view = await rendered
    await expect.element(removeDialog()).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await expect.element(removeDialog()).not.toBeInTheDocument()
    await view.unmount()
  })

  it('closes the remove dialog with Keep it, and opens it again in a state that has it open', async () => {
    const { router, rendered } = renderInbox('removeConfirm')
    const view = await rendered
    await removeDialog().getByRole('button', { name: 'Keep it' }).click()
    await expect.element(removeDialog()).not.toBeInTheDocument()
    await showState(router, 'removalProposed')
    await showState(router, 'removeConfirm')
    await expect.element(removeDialog()).toBeVisible()
    await view.unmount()
  })

  it("shows the state's query in the search field after the state changes", async () => {
    const { router, rendered } = renderInbox('nextStep')
    const view = await rendered
    await expect.element(searchbox()).toHaveValue('')
    await showState(router, 'search')
    await expect.element(searchbox()).toHaveValue('f-005')
    await showState(router, 'nextStep')
    await expect.element(searchbox()).toHaveValue('')
    await view.unmount()
  })

  it('keeps the typed search text in its state only', async () => {
    const { router, rendered } = renderInbox('search')
    const view = await rendered
    await searchbox().fill('f-006')
    await expect.element(searchbox()).toHaveValue('f-006')
    await showState(router, 'nextStep')
    await expect.element(searchbox()).toHaveValue('')
    await showState(router, 'search')
    await expect.element(searchbox()).toHaveValue('f-005')
    await view.unmount()
  })

  it('scrolls the Snoozed toggle clear of the toast in D18', async () => {
    await page.viewport(1512, 982)
    const { rendered } = renderInbox('tasksCreated')
    const view = await rendered
    await expect.element(page.getByText('Created 3 tasks from a discussion')).toBeVisible()
    const list = page.getByRole('region', { name: 'Inbox list' }).element()
    list.scrollTop = list.scrollHeight
    const toggle = page.getByRole('button', { name: /Snoozed/ }).element()
    const toast = page
      .getByText('Created 3 tasks from a discussion')
      .element()
      .closest('[data-figma="toast · created"]')
    expect(toast).not.toBeNull()
    const t = box(toggle)
    const hit = document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2)
    expect(hit !== null && toggle.contains(hit), 'the toggle is under the pointer').toBe(true)
    if (toast !== null) expect(t.bottom).toBeLessThanOrEqual(box(toast).top)
    await view.unmount()
  })
})
