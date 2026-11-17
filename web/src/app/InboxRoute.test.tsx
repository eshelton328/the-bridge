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

  it('returns to the list with Back on the tablet, and opens the item again in a state that has it open', async () => {
    await page.viewport(756, 1158)
    const { router, rendered } = renderInbox('taskPage')
    const view = await rendered
    const title = () => page.getByRole('heading', { level: 1, name: 'Write the tickets for increment one' })
    await expect.element(title()).toBeVisible()
    await page.getByRole('button', { name: 'Back to Inbox' }).click()
    await expect.element(title()).not.toBeInTheDocument()
    await expect.element(searchbox()).toBeVisible()
    await showState(router, 'list')
    await showState(router, 'taskPage')
    await expect.element(title()).toBeVisible()
    await view.unmount()
  })

  it("returns to the list with Back from a started task's chat on the tablet", async () => {
    await page.viewport(756, 1158)
    const { rendered } = renderInbox('chat')
    const view = await rendered
    await expect.element(page.getByText('Wait for increment two.')).toBeVisible()
    await page.getByRole('button', { name: 'Back to Inbox' }).click()
    await expect.element(page.getByText('Wait for increment two.')).not.toBeInTheDocument()
    await expect.element(searchbox()).toBeVisible()
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

  it('keeps every suggestion button inside the discussion panel at 1280 px', async () => {
    await page.viewport(1280, 832)
    const { rendered } = renderInbox('discussOpen')
    const view = await rendered
    await expect.element(page.getByRole('button', { name: 'Make the prompt shorter' })).toBeVisible()
    const panel = page.getByRole('complementary').element()
    const suggestions = panel.querySelector('[data-figma="suggestions"]')
    expect(suggestions).not.toBeNull()
    const buttons = [...(suggestions?.querySelectorAll('button') ?? [])]
    expect(buttons).toHaveLength(3)
    const p = box(panel)
    for (const button of buttons) {
      const b = box(button)
      expect(b.left, button.textContent).toBeGreaterThanOrEqual(p.left)
      expect(b.right, button.textContent).toBeLessThanOrEqual(p.right)
      expect(button.scrollWidth, button.textContent).toBeLessThanOrEqual(button.clientWidth)
    }
    await view.unmount()
  })

  it('keeps the suggestion buttons on one row at 1512 px, as in Figma', async () => {
    await page.viewport(1512, 982)
    const { rendered } = renderInbox('discussOpen')
    const view = await rendered
    await expect.element(page.getByRole('button', { name: 'Make the prompt shorter' })).toBeVisible()
    const suggestions = document.querySelector('[data-figma="suggestions"]')
    const tops = [...(suggestions?.querySelectorAll('button') ?? [])].map((b) => box(b).top)
    expect(tops).toHaveLength(3)
    expect(new Set(tops).size).toBe(1)
    await view.unmount()
  })
})

describe('the Inbox list tools and task bar', () => {
  let view: { unmount: () => Promise<void> } | undefined

  // The view unmounts after each test, even one that fails, so the next test sees only its own.
  afterEach(async () => {
    await view?.unmount()
    view = undefined
  })

  /** Renders a state at the tablet width. */
  async function tablet(state: string) {
    await page.viewport(756, 1158)
    view = await renderInbox(state).rendered
  }

  /** How far down the page a text is. */
  const top = (text: string) => box(page.getByText(text).element()).top

  it('sorts the list with the Sort menu, and names the sort on the button', async () => {
    await tablet('list')
    await page.getByRole('button', { name: 'Newest' }).click()
    await page.getByRole('menuitemradio', { name: /Oldest first/ }).click()
    await expect.element(page.getByRole('menu')).not.toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: 'Oldest' })).toHaveAttribute('aria-pressed', 'true')
    await expect.element(page.getByText('Commit the brain: 34 changes')).toBeVisible()
    expect(top('Commit the brain: 34 changes')).toBeLessThan(top('Write the tickets for increment one'))
    await page.getByRole('button', { name: 'Oldest' }).click()
    await page.getByRole('menuitemradio', { name: /Project/ }).click()
    const list = page.getByRole('region', { name: 'Inbox list' })
    await expect.element(list.getByText('skill-evals', { exact: true })).toBeVisible()
  })

  it('keeps only the rows that match the search', async () => {
    await tablet('list')
    await searchbox().fill('commit')
    await expect.element(page.getByText('1 result for “commit” in titles, IDs, prompts and notes')).toBeVisible()
    await expect.element(page.getByText('Commit the brain: 34 changes')).toBeVisible()
    await expect.element(page.getByText('Pick the header logo')).not.toBeInTheDocument()
  })

  it('applies the Filter menu when it closes, and Clear under the tools removes the filter', async () => {
    await tablet('list')
    const readme = () => page.getByText('Run the readme cross-family round x2')
    await page.getByRole('button', { name: 'Filter' }).click()
    await page.getByRole('dialog', { name: 'Filter the inbox' }).getByText('skill-evals', { exact: true }).click()
    await expect.element(page.getByText('Showing 6 of 7')).toBeVisible()
    await expect.element(readme()).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await expect.element(readme()).not.toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: 'Filter · 1' })).toBeVisible()
    await expect.element(page.getByText('1 task hidden by filters')).toBeVisible()
    await page.getByRole('link', { name: 'Clear' }).click()
    await expect.element(readme()).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Filter', exact: true })).toBeVisible()
  })

  it('removes one filter with its button under the tools', async () => {
    await tablet('filteredList')
    await expect.element(page.getByText('drift check wants to run git mv')).toBeVisible()
    await page.getByRole('button', { name: 'Remove omni-brain' }).click()
    await expect.element(page.getByText('drift check wants to run git mv')).not.toBeInTheDocument()
    await expect.element(page.getByText('2 tasks hidden by filters')).toBeVisible()
  })

  it('snoozes the open task from the Snooze menu and shows the list on the tablet', async () => {
    await tablet('snoozePage')
    await page.getByRole('menuitem', { name: /In 1 hour/ }).click()
    await expect.element(searchbox()).toBeVisible()
    await page.getByRole('button', { name: /Snoozed/ }).click()
    await expect.element(page.getByText('Snoozed until 11:40')).toBeVisible()
    // The header counts the tasks still to do: one fewer.
    await expect.element(page.getByText('6 tasks')).toBeInTheDocument()
  })

  it('marks the open task done from the Snooze menu', async () => {
    await tablet('taskPage')
    await page.getByRole('button', { name: 'Snooze' }).click()
    await page.getByRole('menuitem', { name: 'Mark done' }).click()
    await expect.element(searchbox()).toBeVisible()
    await expect.element(page.getByText('Write the tickets for increment one')).not.toBeInTheDocument()
  })

  // After Back on the tablet nothing is selected, but the desktop shows the state's item: its actions act on it.
  it('marks the shown task done on the desktop after Back on the tablet and a resize', async () => {
    await tablet('taskPage')
    await page.getByRole('button', { name: 'Back to Inbox' }).click()
    await page.viewport(1512, 982)
    const list = page.getByRole('region', { name: 'Inbox list' })
    const row = () => list.getByText('Write the tickets for increment one')
    await expect.element(row()).toBeVisible()
    await page.getByRole('button', { name: 'Snooze' }).click()
    await page.getByRole('menuitem', { name: 'Mark done' }).click()
    await expect.element(page.getByRole('menu')).not.toBeInTheDocument()
    await expect.element(row()).not.toBeInTheDocument()
  })

  it('snoozes the shown question on the desktop after Back on the tablet and a resize', async () => {
    await tablet('question')
    await page.getByRole('button', { name: 'Back to Inbox' }).click()
    await page.viewport(1512, 982)
    await expect.element(page.getByRole('heading', { level: 1, name: /Hono RPC client/ })).toBeVisible()
    await page.getByRole('button', { name: 'Snooze' }).click()
    await page.getByRole('menuitem', { name: /In 1 hour/ }).click()
    await page.getByRole('button', { name: /Snoozed/ }).click()
    await expect.element(page.getByText('Snoozed until 11:40')).toBeVisible()
  })

  it('keeps one Snoozed row when the desktop snoozes the shown task twice', async () => {
    await page.viewport(1512, 982)
    view = await renderInbox('nextStep').rendered
    const snoozeForAnHour = async () => {
      await page.getByRole('button', { name: 'Snooze' }).click()
      await page.getByRole('menuitem', { name: /In 1 hour/ }).click()
      await expect.element(page.getByRole('menu')).not.toBeInTheDocument()
    }
    await snoozeForAnHour()
    await snoozeForAnHour()
    await page.getByRole('button', { name: /Snoozed/ }).click()
    await expect.element(page.getByText('Snoozed until 11:40')).toBeVisible()
    expect(page.getByText('Snoozed until 11:40').elements()).toHaveLength(1)
  })

  it('edits the prompt with Edit and Done, and brings the suggestion back with Reset', async () => {
    await tablet('taskPage')
    const editor = () => page.getByRole('textbox', { name: 'Suggested prompt' })
    await page.getByRole('button', { name: 'Edit' }).click()
    await editor().fill('Write one ticket per screen.')
    await page.getByRole('button', { name: 'Done' }).click()
    await expect.element(editor()).not.toBeInTheDocument()
    await expect.element(page.getByText('Write one ticket per screen.')).toBeVisible()
    await expect.element(page.getByText('Edited')).toBeVisible()
    await page.getByRole('button', { name: 'Reset' }).click()
    await expect.element(page.getByText('Edited')).not.toBeInTheDocument()
    await expect.element(page.getByText('Write one ticket per screen.')).not.toBeInTheDocument()
  })

  it('ends the long suggestion that Reset brings back with Read the whole prompt', async () => {
    await tablet('promptEditingPage')
    await page.getByRole('button', { name: 'Reset' }).click()
    await page.getByRole('button', { name: 'Done' }).click()
    await expect.element(page.getByText('Edited')).not.toBeInTheDocument()
    await expect.element(page.getByRole('link', { name: 'Read the whole prompt' })).toBeVisible()
  })

  it('opens and closes the Run in picker with Change', async () => {
    await tablet('taskPage')
    const picker = () => page.getByRole('dialog', { name: 'Run in' })
    await page.getByRole('button', { name: 'Change' }).click()
    await expect.element(picker()).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await expect.element(picker()).not.toBeInTheDocument()
  })
})
