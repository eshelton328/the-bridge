import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The Inbox through the real route, loader and page store: what the
// props-only stories cannot show, because they have no state owner.
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

afterEach(() => {
  resetAllStores()
})

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
})
