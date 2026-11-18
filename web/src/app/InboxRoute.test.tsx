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
  /** The WCAG contrast ratio of two `rgb()` colours. */
  function contrast(a: string, b: string): number {
    const lum = (c: string) => {
      const [r = 0, g = 0, bl = 0] = (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
      const lin = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4)
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl)
    }
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
    return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05)
  }

  it('keeps the Filter counts and the Run in placeholder at WCAG AA on the raised popovers', async () => {
    await page.viewport(1512, 982)
    const { router, rendered } = renderInbox('filterOpen')
    const view = await rendered
    const popover = (figma: string) => document.querySelector(`[data-figma="${figma}"]`)
    await expect.poll(() => popover('filter popover')).not.toBeNull()
    const filter = popover('filter popover') ?? document.body
    const filterBg = getComputedStyle(filter).backgroundColor
    const counts = [...filter.querySelectorAll('[data-part="root"] span')].filter((el) => /^\d+$/.test(el.textContent))
    expect(counts.length).toBeGreaterThan(0)
    for (const el of counts) expect(contrast(getComputedStyle(el).color, filterBg)).toBeGreaterThanOrEqual(4.5)
    await showState(router, 'promptEditing')
    await expect.poll(() => popover('run in picker')).not.toBeNull()
    const picker = popover('run in picker') ?? document.body
    const input = picker.querySelector('input')
    expect(input).not.toBeNull()
    if (input !== null) {
      const placeholder = getComputedStyle(input, '::placeholder').color
      expect(contrast(placeholder, getComputedStyle(picker).backgroundColor)).toBeGreaterThanOrEqual(4.5)
    }
    await view.unmount()
  })

  it('opens the Toolkit and Artifacts pages from the rail', async () => {
    await page.viewport(1512, 982)
    const { router, rendered } = renderInbox('nextStep')
    const view = await rendered
    await page.getByRole('button', { name: 'Toolkit' }).click()
    await expect.element(page.getByRole('heading', { name: 'Toolkit' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/toolkit')
    await showState(router, 'nextStep')
    await page.getByRole('button', { name: 'Artifacts' }).click()
    await expect.element(page.getByRole('heading', { name: 'Artifacts' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/artifacts')
    await view.unmount()
  })

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

  it('returns from the chat that Reply here opens to the task, with View task or the task row, on the desktop', async () => {
    await page.viewport(1512, 982)
    const view = await renderInbox('runningTask').rendered
    const reply = () => page.getByRole('textbox', { name: 'Reply' })
    await page.getByRole('button', { name: 'Reply here' }).click()
    await expect.element(reply()).toBeVisible()
    await page.getByRole('button', { name: 'View task' }).click()
    await expect.element(reply()).not.toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: 'Reply here' })).toBeVisible()
    await page.getByRole('button', { name: 'Reply here' }).click()
    await expect.element(reply()).toBeVisible()
    await page.getByRole('button', { name: /^Write the tickets for increment one/ }).click()
    await expect.element(reply()).not.toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: 'Reply here' })).toBeVisible()
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

  it('starts the task with Start on the desktop: its run card replaces Start, and Reply here opens the chat', async () => {
    await page.viewport(1512, 982)
    const view = await renderInbox('nextStep').rendered
    await page.getByRole('button', { name: 'Start in the-bridge' }).click()
    await expect.element(page.getByText('Running in quiet-nebula')).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Start in the-bridge' })).not.toBeInTheDocument()
    await page.getByRole('button', { name: 'Reply here' }).click()
    await expect.element(page.getByRole('textbox', { name: 'Reply' })).toBeVisible()
    await view.unmount()
  })

  it('closes the prompt editor when Start sends the prompt', async () => {
    await page.viewport(1512, 982)
    const view = await renderInbox('nextStep').rendered
    await page.getByRole('button', { name: 'Edit' }).click()
    await expect.element(page.getByRole('textbox', { name: 'Suggested prompt' })).toBeVisible()
    await page.getByRole('button', { name: 'Start in the-bridge' }).click()
    await expect.element(page.getByText('Running in quiet-nebula')).toBeVisible()
    await expect.element(page.getByRole('textbox', { name: 'Suggested prompt' })).not.toBeInTheDocument()
    await view.unmount()
  })

  it("opens the finished task's chat with Open chat in D7", async () => {
    await page.viewport(1512, 982)
    const view = await renderInbox('done').rendered
    await page.getByRole('button', { name: 'Open chat' }).click()
    await expect.element(page.getByRole('textbox', { name: 'Reply' })).toBeVisible()
    await expect.element(page.getByText('Wait for increment two.')).toBeVisible()
    await page.getByRole('button', { name: 'View task' }).click()
    await expect.element(page.getByText('Finished in quiet-nebula')).toBeVisible()
    await view.unmount()
  })

  it('takes the new tasks out with Undo in the toast in D18 and T21', async () => {
    for (const [state, width, height] of [
      ['tasksCreated', 1512, 982],
      ['tasksCreatedList', 756, 1158],
    ] as const) {
      await page.viewport(width, height)
      const view = await renderInbox(state).rendered
      await expect.element(page.getByText('Write the Workbench tickets')).toBeVisible()
      await page.getByRole('button', { name: 'Undo' }).click()
      await expect.element(page.getByText('Write the Workbench tickets')).not.toBeInTheDocument()
      await expect.element(page.getByText('Created 3 tasks from a discussion')).not.toBeInTheDocument()
      await view.unmount()
      resetAllStores()
    }
  })

  it('adds the message Erik sends to the desktop discussion and empties the reply box', async () => {
    await page.viewport(1512, 982)
    const view = await renderInbox('discussOpen').rendered
    const box = page.getByRole('textbox', { name: 'Ask about this task' })
    await userEvent.type(box, 'Can it wait a week?')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect.element(page.getByText('Can it wait a week?')).toBeVisible()
    await expect.element(box).toHaveValue('')
    await expect.element(page.getByRole('heading', { name: 'Talk this task through' })).not.toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: 'Attach a file' })).not.toBeInTheDocument()
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

  it("selects the Done chip with the search hint's Show it, which lists the match in Done", async () => {
    await tablet('searchList')
    await page.getByRole('link', { name: 'Show it' }).click()
    await expect.element(page.getByRole('radio', { name: /^Done/ })).toBeChecked()
    await expect.element(page.getByText('Save the Inbox frames as references')).toBeVisible()
    await expect.element(page.getByText('1 result for “f-005” in titles, IDs, prompts and notes')).toBeVisible()
    await expect.element(page.getByText('Done has 1 more match.')).not.toBeInTheDocument()
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

  it('dismisses the open task with Dismiss and shows the list on the tablet', async () => {
    await tablet('taskPage')
    await page.getByRole('button', { name: 'Dismiss', exact: true }).click()
    await expect.element(searchbox()).toBeVisible()
    await expect.element(page.getByText('Write the tickets for increment one')).not.toBeInTheDocument()
    // The header counts the tasks still to do: one fewer; Done holds one more.
    await expect.element(page.getByText('6 tasks')).toBeInTheDocument()
    await expect.element(page.getByRole('radio', { name: 'Done 5' })).toBeInTheDocument()
  })

  it('dismisses the shown task with Dismiss on the desktop', async () => {
    await page.viewport(1512, 982)
    view = await renderInbox('nextStep').rendered
    const list = page.getByRole('region', { name: 'Inbox list' })
    const row = () => list.getByText('Write the tickets for increment one')
    await expect.element(row()).toBeVisible()
    await page.getByRole('button', { name: 'Dismiss', exact: true }).click()
    await expect.element(row()).not.toBeInTheDocument()
    await expect.element(list.getByText('6 tasks')).toBeInTheDocument()
    // Pressed again, the item stays out of the list and Done holds it once.
    await page.getByRole('button', { name: 'Dismiss', exact: true }).click()
    await expect.element(page.getByRole('radio', { name: 'Done 5' })).toBeInTheDocument()
  })

  it('shows the dismissed task in Today under the Done chip, with how it ended', async () => {
    await page.viewport(1512, 982)
    view = await renderInbox('nextStep').rendered
    const list = page.getByRole('region', { name: 'Inbox list' })
    await page.getByRole('button', { name: 'Dismiss', exact: true }).click()
    await page.getByRole('radio', { name: 'Done 5' }).click()
    await expect.element(list.getByText('Needs you')).not.toBeInTheDocument()
    await list.getByRole('button', { name: /Today/ }).click()
    await expect.element(list.getByText('Write the tickets for increment one')).toBeVisible()
    await expect.element(list.getByText('Dismissed', { exact: true })).toBeVisible()
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

  it('keeps the edited prompt after a visit to the Toolkit page and Back', async () => {
    await page.viewport(1512, 982)
    const { router, rendered } = renderInbox('nextStep')
    const view = await rendered
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.getByRole('textbox', { name: 'Suggested prompt' }).fill('Write one ticket per screen.')
    await page.getByRole('button', { name: 'Done' }).click()
    await page.getByRole('button', { name: 'Toolkit' }).click()
    await expect.element(page.getByRole('heading', { name: 'Toolkit' })).toBeVisible()
    await act(async () => {
      router.history.back()
      await router.invalidate()
    })
    await expect.element(page.getByText('Write one ticket per screen.')).toBeVisible()
    await view.unmount()
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

  it('dims Reset while the prompt is the suggestion', async () => {
    await tablet('taskPage')
    await expect.element(page.getByRole('button', { name: 'Reset' })).toBeDisabled()
  })

  // Figma dims Reset after Apply as well (T19 402:11597, D16: the label in fg.muted, as T2's); Undo on the change
  // line takes the discussion's change back, and Reset only Erik's own edits.
  it('keeps Reset dim after a discussion changed the prompt, with Undo to take the change back', async () => {
    await tablet('changeAppliedPage')
    await expect.element(page.getByText('changed just now in a discussion')).toBeVisible()
    await expect.element(page.getByRole('link', { name: 'Undo' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Reset' })).toBeDisabled()
    await expect.element(page.getByText('Edited')).not.toBeInTheDocument()
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

  it('keeps the created tasks when the desktop discussion opens again after Create', async () => {
    await page.viewport(1512, 982)
    view = await renderInbox('tasksProposed').rendered
    await page.getByRole('button', { name: 'Create 3 tasks' }).click()
    await page.getByRole('button', { name: 'Discuss' }).click()
    const box = page.getByRole('checkbox', { name: 'Write the Workbench tickets' })
    await expect.element(box).toBeChecked()
    await expect.element(box).toBeDisabled()
    await page.getByRole('button', { name: 'Close the discussion' }).click()
    await expect.element(page.getByText('Created 3 tasks from a discussion')).toBeVisible()
  })

  describe('the discussion on the tablet', () => {
    const tabBar = () => page.getByRole('button', { name: 'Home' })
    const title = () => page.getByRole('heading', { level: 1, name: 'Write the tickets for increment one' })

    it('opens the discussion page with Discuss and returns to the task with Back', async () => {
      await tablet('discussTask')
      await page.getByRole('button', { name: 'Discuss' }).click()
      await expect.element(page.getByRole('heading', { name: 'Talk this task through' })).toBeVisible()
      await expect.element(tabBar()).not.toBeInTheDocument()
      await page.getByRole('button', { name: 'Back to the task' }).click()
      await expect.element(page.getByRole('heading', { name: 'Talk this task through' })).not.toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: 'Discuss' })).toBeVisible()
      await expect.element(tabBar()).toBeVisible()
    })

    it('keeps an unsent reply after Back and Discuss', async () => {
      await tablet('discussTask')
      const reply = () => page.getByRole('textbox', { name: 'Ask about this task' })
      await page.getByRole('button', { name: 'Discuss' }).click()
      await reply().fill('Which frames are missing?')
      await page.getByRole('button', { name: 'Back to the task' }).click()
      await page.getByRole('button', { name: 'Discuss' }).click()
      await expect.element(reply()).toHaveValue('Which frames are missing?')
    })

    it('applies a proposed update: the task shows the new prompt, and Undo takes it back', async () => {
      await tablet('changeProposedPage')
      await page.getByRole('button', { name: 'Apply' }).click()
      await expect.element(page.getByText(/Changed in a discussion · just now/)).toBeVisible()
      await expect.element(page.getByText('changed just now in a discussion')).toBeVisible()
      await page.getByRole('link', { name: 'Undo' }).click()
      await expect.element(page.getByText(/Changed in a discussion · just now/)).not.toBeInTheDocument()
      await expect.element(page.getByText('suggested 2h ago by the planning run')).toBeVisible()
    })

    it('shows the proposed prompt after Apply over an edited prompt, and Undo brings the edit back', async () => {
      await tablet('changeProposedPage')
      await page.getByRole('button', { name: 'Back to the task' }).click()
      await page.getByRole('button', { name: 'Edit' }).click()
      await page.getByRole('textbox', { name: 'Suggested prompt' }).fill('Write the tickets my way.')
      await page.getByRole('button', { name: 'Done' }).click()
      await page.getByRole('button', { name: 'Discuss' }).click()
      await page.getByRole('button', { name: 'Apply' }).click()
      await expect.element(page.getByText(/Before writing, check that each frame exists/)).toBeVisible()
      await expect.element(page.getByText('Write the tickets my way.')).not.toBeInTheDocument()
      await page.getByRole('link', { name: 'Undo' }).click()
      await expect.element(page.getByText('Write the tickets my way.')).toBeVisible()
      await expect.element(page.getByText('Edited')).toBeVisible()
    })

    it('discards a proposed update', async () => {
      await tablet('changeProposedPage')
      await page.getByRole('button', { name: 'Discard' }).click()
      await expect.element(page.getByRole('group', { name: 'Proposed · Update this task' })).not.toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: 'Back to the task' })).toBeVisible()
    })

    it('opens the prompt editor with the change filled in from Edit first', async () => {
      await tablet('changeProposedPage')
      await page.getByRole('button', { name: 'Edit first' }).click()
      await expect
        .element(page.getByRole('textbox', { name: 'Suggested prompt' }))
        .toHaveDisplayValue(/to its Figma frame from pages\.md.*Before writing, check that each frame exists/)
      await expect.element(page.getByText('Edited')).toBeVisible()
    })

    it('creates the checked tasks, shows them in the list with a toast, and Undo takes them out', async () => {
      await tablet('tasksProposedPage')
      await page.getByText('Write the Inbox tickets').click()
      await page.getByRole('button', { name: 'Create 2 tasks' }).click()
      await expect.element(page.getByText('Created 2 tasks from a discussion')).toBeVisible()
      await expect.element(page.getByText('Write the Workbench tickets')).toBeVisible()
      await expect.element(page.getByText('Write the Inbox tickets')).not.toBeInTheDocument()
      await expect.element(page.getByText('Write the tickets for increment one')).toBeVisible()
      await page.getByRole('button', { name: 'Undo' }).click()
      await expect.element(page.getByText('Write the Workbench tickets')).not.toBeInTheDocument()
      await expect.element(page.getByText('Created 2 tasks from a discussion')).not.toBeInTheDocument()
    })

    it('removes this task too when Also remove this task is checked', async () => {
      await tablet('tasksProposedPage')
      // The inline row's 24 px press area covers its box and label, so the click goes to the row (its `label`).
      const label = page.getByText('Also remove this task')
      await expect.element(label).toBeVisible()
      const row = label.element().closest('label')
      expect(row).not.toBeNull()
      if (row !== null) await userEvent.click(row)
      await page.getByRole('button', { name: 'Create 3 tasks' }).click()
      await expect.element(page.getByText('Write the App frame tickets')).toBeVisible()
      await expect.element(page.getByText('Write the tickets for increment one')).not.toBeInTheDocument()
    })

    it('removes the task after Remove… and Remove task, and shows the list', async () => {
      await tablet('removalProposedPage')
      await page.getByRole('button', { name: 'Remove…' }).click()
      await removeDialog().getByRole('button', { name: 'Remove task' }).click()
      await expect.element(removeDialog()).not.toBeInTheDocument()
      await expect.element(searchbox()).toBeVisible()
      await expect.element(title()).not.toBeInTheDocument()
      await expect.element(page.getByText('Write the tickets for increment one')).not.toBeInTheDocument()
    })

    it('keeps the task with Keep it', async () => {
      await tablet('removalProposedPage')
      await page.getByRole('button', { name: 'Keep it' }).click()
      await expect.element(page.getByRole('group', { name: 'Proposed · Remove this task' })).not.toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: 'Back to the task' })).toBeVisible()
    })
  })
})

// The phone (M1 to M8): what Erik does on a 390 px screen, through the route and the page store.
describe('the Inbox on the phone', () => {
  let view: { unmount: () => Promise<void> } | undefined

  afterEach(async () => {
    await view?.unmount()
    view = undefined
  })

  async function phone(state: string) {
    await page.viewport(390, 844)
    view = await renderInbox(state).rendered
  }

  const title = () => page.getByRole('heading', { level: 1, name: 'Write the tickets for increment one' })
  const sheet = (name: string) => page.getByRole('dialog', { name })
  /** The row of a list item, found by its title. */
  const row = (text: string) => page.getByText(text, { exact: true }).element()

  it('opens a task from the list and returns to the list with Back', async () => {
    await phone('list')
    await page.getByText('Write the tickets for increment one').click()
    await expect.element(title()).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Start in the-bridge' })).toBeVisible()
    await page.getByRole('button', { name: 'Back to Inbox' }).click()
    await expect.element(title()).not.toBeInTheDocument()
    await expect.element(searchbox()).toBeVisible()
  })

  it('opens a row’s actions with a long touch and snoozes it from the sheet', async () => {
    await phone('list')
    const target = row('Pick the header logo')
    target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }))
    await expect.element(sheet('Pick the header logo')).toBeVisible()
    target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' }))
    await expect.element(sheet('Pick the header logo').getByText('ncc-1701 · f-005 · NCC-36 · Review')).toBeVisible()
    await sheet('Pick the header logo').getByText('In 1 hour').click()
    await expect.element(sheet('Pick the header logo')).not.toBeInTheDocument()
    await expect.element(page.getByText('6 tasks')).toBeInTheDocument()
    await page.getByRole('button', { name: /Snoozed/ }).click()
    await expect.element(page.getByText('Snoozed until 11:40')).toBeVisible()
  })

  it('opens a row’s actions with the context menu and dismisses it into Done', async () => {
    await phone('list')
    row('Pick the header logo').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
    await sheet('Pick the header logo').getByText('Dismiss with a reason…').click()
    await expect.element(page.getByText('Pick the header logo')).not.toBeInTheDocument()
    await expect.element(page.getByRole('radio', { name: 'Done 5' })).toBeInTheDocument()
  })

  it('does not open the task when a long touch opened its actions', async () => {
    await phone('list')
    const target = row('Write the tickets for increment one')
    target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }))
    await expect.element(sheet('Write the tickets for increment one')).toBeVisible()
    target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' }))
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await userEvent.keyboard('{Escape}')
    await expect.element(sheet('Write the tickets for increment one')).not.toBeInTheDocument()
    await expect.element(title()).not.toBeInTheDocument()
    await expect.element(searchbox()).toBeVisible()
  })

  it('dismisses the open task with the icon in the nav and shows the list', async () => {
    await phone('taskPage')
    await page.getByRole('button', { name: 'Dismiss', exact: true }).click()
    await expect.element(searchbox()).toBeVisible()
    await expect.element(page.getByText('6 tasks')).toBeInTheDocument()
  })

  it('snoozes the open task from the clock in the nav', async () => {
    await phone('taskPage')
    await page.getByRole('button', { name: 'Snooze', exact: true }).click()
    await page.getByRole('menuitem', { name: /Tomorrow morning/ }).click()
    await expect.element(searchbox()).toBeVisible()
    await expect.element(page.getByText('6 tasks')).toBeInTheDocument()
  })

  it('opens the Run in sheet with the chevron and closes it with Done', async () => {
    await phone('taskPage')
    await page.getByRole('button', { name: 'Change' }).click()
    await expect.element(sheet('Run in').getByText('New Codex chat')).toBeVisible()
    await sheet('Run in').getByRole('button', { name: 'Done' }).click()
    await expect.element(sheet('Run in')).not.toBeInTheDocument()
  })

  it('opens the whole prompt read-only in a sheet', async () => {
    await phone('taskPage')
    await page.getByRole('link', { name: 'Read the whole prompt' }).click()
    await expect.element(dialog()).toBeVisible()
  })

  it('puts the focus in the prompt editor that Edit opens', async () => {
    await phone('taskPage')
    await page.getByRole('button', { name: 'Edit' }).click()
    await expect.element(page.getByRole('textbox', { name: 'Suggested prompt' })).toHaveFocus()
  })

  // R11 (Erik, on his phone): a tap on an item opens a page with its details, not its actions sheet.
  const rowPage = (text: string) => page.getByRole('heading', { level: 1, name: text })

  it('opens the page of each row without a detail with a tap, and Back returns to the list', async () => {
    await phone('list')
    const titles = ['drift check wants to run git mv', 'Pick the header logo', 'Commit the brain: 34 changes']
    for (const text of titles) {
      await page.getByText(text, { exact: true }).click()
      await expect.element(rowPage(text)).toBeVisible()
      expect(page.getByRole('dialog', { name: text }).elements()).toHaveLength(0)
      await page.getByRole('button', { name: 'Back to Inbox' }).click()
      await expect.element(rowPage(text)).not.toBeInTheDocument()
      await expect.element(searchbox()).toBeVisible()
    }
  })

  it('keeps the answer buttons of an approval on its page', async () => {
    await phone('list')
    await page.getByText('drift check wants to run git mv', { exact: true }).click()
    await expect.element(rowPage('drift check wants to run git mv')).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Allow once' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Deny' })).toBeVisible()
  })

  it('opens the page of a row without a detail from the keyboard', async () => {
    await phone('list')
    const control = page.getByRole('button', { name: /^Pick the header logo/ })
    control.element().focus()
    await expect.element(control).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect.element(rowPage('Pick the header logo')).toBeVisible()
  })

  it('opens a row Erik dismissed from Done with its outcome and no actions', async () => {
    await phone('list')
    await expect.element(page.getByText('Pick the header logo', { exact: true })).toBeVisible()
    row('Pick the header logo').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
    await sheet('Pick the header logo').getByText('Dismiss with a reason…').click()
    await expect.element(page.getByRole('radio', { name: 'Done 5' })).toBeInTheDocument()
    await page.getByRole('radio', { name: 'Done 5' }).click()
    await page.getByRole('button', { name: 'Today 1' }).click()
    await expect.element(page.getByText('Pick the header logo', { exact: true })).toBeVisible()
    await page.getByText('Pick the header logo', { exact: true }).click()
    await expect.element(rowPage('Pick the header logo')).toBeVisible()
    expect(page.getByRole('button', { name: 'More actions for Pick the header logo' }).elements()).toHaveLength(0)
  })

  it('opens the row’s actions from ⋯ on its page and snoozes it', async () => {
    await phone('list')
    await page.getByText('Pick the header logo', { exact: true }).click()
    await page.getByRole('button', { name: 'More actions for Pick the header logo' }).click()
    await expect.element(sheet('Pick the header logo')).toBeVisible()
    await sheet('Pick the header logo').getByText('In 1 hour').click()
    await expect.element(sheet('Pick the header logo')).not.toBeInTheDocument()
    await expect.element(searchbox()).toBeVisible()
    await expect.element(page.getByText('6 tasks')).toBeInTheDocument()
  })

  it('shows the list at the same scroll after Back from a row’s page', async () => {
    await page.viewport(390, 500)
    view = await renderInbox('list').rendered
    // The app's root fills the window, as `#root` does in index.css, so the shell's detail scrolls the list.
    await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
    const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
    if (!(root instanceof HTMLElement)) throw new Error('no root')
    root.style.height = '100%'
    const scroller = () => searchbox().element().closest('main')
    await expect.poll(() => (scroller()?.scrollHeight ?? 0) > (scroller()?.clientHeight ?? 0)).toBe(true)
    // Half way down the list; a DOM click opens the row without scrolling it into view first.
    const before = Math.floor(((scroller()?.scrollHeight ?? 0) - (scroller()?.clientHeight ?? 0)) / 2)
    expect(before).toBeGreaterThan(0)
    scroller()?.scrollTo({ top: before })
    await expect.poll(() => scroller()?.scrollTop).toBe(before)
    const target = row('Commit the brain: 34 changes')
    if (!(target instanceof HTMLElement)) throw new Error('no row')
    target.click()
    await expect.element(rowPage('Commit the brain: 34 changes')).toBeVisible()
    await page.getByRole('button', { name: 'Back to Inbox' }).click()
    await expect.element(searchbox()).toBeInTheDocument()
    await expect.poll(() => scroller()?.scrollTop).toBe(before)
  })

  it('opens a row’s page with a tap and its actions with a long touch on the tablet', async () => {
    await page.viewport(756, 1158)
    view = await renderInbox('list').rendered
    const target = row('Pick the header logo')
    target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }))
    await expect.element(sheet('Pick the header logo')).toBeVisible()
    target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' }))
    await userEvent.keyboard('{Escape}')
    await expect.element(sheet('Pick the header logo')).not.toBeInTheDocument()
    await page.getByText('Pick the header logo', { exact: true }).click()
    await expect.element(rowPage('Pick the header logo')).toBeVisible()
  })

  it('gives a finished row in Done no actions, so Done keeps its count', async () => {
    await phone('doneList')
    await expect.element(page.getByRole('radio', { name: 'Done 4' })).toBeInTheDocument()
    const target = row('Pick the header logo')
    target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
    target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }))
    await new Promise((resolve) => {
      window.setTimeout(resolve, 600)
    })
    target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' }))
    expect(page.getByRole('dialog', { name: 'Pick the header logo' }).elements()).toHaveLength(0)
    await expect.element(page.getByRole('radio', { name: 'Done 4' })).toBeInTheDocument()
  })

  it('hides the tab bar and Start while the prompt editor is open, and brings them back with Done', async () => {
    await phone('taskPage')
    const tabBar = () => page.getByRole('button', { name: 'Home' })
    const start = () => page.getByRole('button', { name: 'Start in the-bridge' })
    await page.getByRole('button', { name: 'Edit' }).click()
    await expect.element(page.getByRole('textbox', { name: 'Suggested prompt' })).toBeVisible()
    await expect.element(tabBar()).not.toBeInTheDocument()
    await expect.element(start()).not.toBeInTheDocument()
    await page.getByRole('button', { name: 'Done' }).click()
    await expect.element(tabBar()).toBeVisible()
    await expect.element(start()).toBeVisible()
  })

  it('filters the list in the Filter sheet, and Show closes it and applies the boxes', async () => {
    await phone('list')
    const readme = () => page.getByText('Run the readme cross-family round x2')
    await page.getByRole('button', { name: 'Filter', exact: true }).click()
    await sheet('Filter').getByText('skill-evals', { exact: true }).click()
    await sheet('Filter').getByRole('button', { name: 'Show 6 tasks' }).click()
    await expect.element(sheet('Filter')).not.toBeInTheDocument()
    await expect.element(readme()).not.toBeInTheDocument()
    await expect.element(page.getByText('1 task hidden by filters')).toBeVisible()
  })

  it('closes the prompt sheet with Edit prompt and puts the focus in the editor', async () => {
    await phone('promptSheet')
    await dialog().getByRole('button', { name: 'Edit prompt' }).click()
    await expect.element(dialog()).not.toBeInTheDocument()
    await expect.element(page.getByRole('textbox', { name: 'Suggested prompt' })).toHaveFocus()
  })

  it('copies the whole prompt with Copy', async () => {
    const copied: string[] = []
    const { clipboard } = navigator
    const writeText = clipboard.writeText.bind(clipboard)
    clipboard.writeText = (text) => {
      copied.push(text)
      return Promise.resolve()
    }
    try {
      await phone('promptSheet')
      await dialog().getByRole('button', { name: 'Copy' }).click()
      expect(copied).toHaveLength(1)
      expect(copied[0]).toMatch(/^Read f-005-the-bridge\/increment-1\.md .* with the reason\.$/)
    } finally {
      clipboard.writeText = writeText
    }
  })

  it('offers no Edit prompt for a sent prompt', async () => {
    await phone('runningTaskPage')
    await page.getByRole('link', { name: 'Read the whole prompt' }).click()
    await expect.element(dialog().getByRole('button', { name: 'Copy' })).toBeVisible()
    expect(dialog().getByRole('button', { name: 'Edit prompt' }).elements()).toHaveLength(0)
  })

  it('opens the chat with Reply here, and Back shows the list, whose row opens the task again', async () => {
    await phone('runningTaskPage')
    await page.getByRole('button', { name: 'Reply here' }).click()
    await expect.element(page.getByRole('textbox', { name: 'Reply' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Home' })).not.toBeInTheDocument()
    await page.getByRole('button', { name: 'Back to Inbox' }).click()
    await expect.element(searchbox()).toBeVisible()
    await page.getByRole('button', { name: /^Write the tickets for increment one/ }).click()
    await expect.element(title()).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Reply here' })).toBeVisible()
  })

  it('opens the task page, not the chat, from the row under Running', async () => {
    await phone('runningList')
    await page.getByRole('button', { name: /^Write the tickets for increment one/ }).click()
    await expect.element(title()).toBeVisible()
    await expect.element(page.getByRole('heading', { level: 2, name: 'Sent prompt' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Reply here' })).toBeVisible()
    await expect.element(page.getByRole('textbox', { name: 'Reply' })).not.toBeInTheDocument()
  })

  it('keeps Open in Workspaces disabled, with the reason, until the Workspaces page exists', async () => {
    await phone('runningTaskPage')
    const open = page.getByRole('button', { name: 'Open in Workspaces' })
    await expect.element(open).toHaveAttribute('aria-disabled', 'true')
    await expect.element(open).toHaveAccessibleDescription('Workspaces is not built yet')
    await open.click({ force: true })
    await expect.element(title()).toBeVisible()
    await page.getByRole('button', { name: 'Reply here' }).click()
    const nav = page.getByRole('button', { name: 'Workspaces', exact: true }).first()
    await expect.element(nav).toHaveAttribute('aria-disabled', 'true')
    await expect.element(nav).toHaveAccessibleDescription('Workspaces is not built yet')
  })

  it('opens the Sort sheet with the focus on the sheet, not on Done', async () => {
    await phone('list')
    await page.getByRole('button', { name: 'Sort', exact: true }).click()
    await expect.element(sheet('Sort')).toHaveFocus()
    await expect.element(sheet('Sort').getByRole('button', { name: 'Done' })).not.toHaveFocus()
  })

  it('sorts in the Sort sheet, names the sort under the tools, and Reset brings back Newest first', async () => {
    await phone('list')
    const sort = () => page.getByRole('button', { name: 'Sort', exact: true })
    await sort().click()
    await sheet('Sort').getByText('Project', { exact: true }).click()
    await expect.element(sheet('Sort')).not.toBeInTheDocument()
    await expect.element(page.getByText('Sorted by project')).toBeVisible()
    await expect.element(sort()).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('link', { name: 'Reset' }).click()
    await expect.element(page.getByText('Sorted by project')).not.toBeInTheDocument()
    await expect.element(sort()).not.toHaveAttribute('aria-pressed')
  })

  it('picks a sort in the Sort sheet from the keyboard', async () => {
    await phone('list')
    page.getByRole('button', { name: 'Sort', exact: true }).element().focus()
    await userEvent.keyboard('{Enter}')
    const kind = sheet('Sort').getByRole('radio', { name: /Kind/ })
    await expect.element(kind).toBeVisible()
    kind.element().focus()
    await userEvent.keyboard('{Enter}')
    await expect.element(sheet('Sort')).not.toBeInTheDocument()
    await expect.element(page.getByText('Sorted by kind')).toBeVisible()
  })

  it('moves the sort with an arrow key in the Sort sheet, and Done keeps it', async () => {
    await phone('list')
    await page.getByRole('button', { name: 'Sort', exact: true }).click()
    sheet('Sort')
      .getByRole('radio', { name: /Newest first/ })
      .element()
      .focus()
    await userEvent.keyboard('{ArrowDown}')
    await sheet('Sort').getByRole('button', { name: 'Done' }).click()
    await expect.element(sheet('Sort')).not.toBeInTheDocument()
    await expect.element(page.getByText('Sorted by oldest first')).toBeVisible()
  })

  it('scrolls the selected Done chip into view', async () => {
    await phone('doneList')
    const chip = page.getByRole('radio', { name: 'Done 4' }).element()
    const chips = page.getByRole('radiogroup', { name: 'Filter the inbox' }).element()
    await expect.poll(() => box(chip).right).toBeLessThanOrEqual(box(chips).right)
    expect(box(chip).left).toBeGreaterThanOrEqual(box(chips).left)
  })

  it('opens the discussion with Discuss in the nav, and a suggestion fills the reply box', async () => {
    await phone('discussTask')
    const nav = page.getByRole('button', { name: 'Back to Inbox' }).element().parentElement
    expect(nav?.textContent).toContain('Discuss')
    await page.getByRole('button', { name: 'Discuss' }).click()
    await expect.element(page.getByRole('heading', { name: 'Talk this task through' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Home' })).not.toBeInTheDocument()
    await page.getByRole('button', { name: 'Is this still worth doing?' }).click()
    await expect
      .element(page.getByRole('textbox', { name: 'Ask about this task' }))
      .toHaveValue('Is this still worth doing?')
    await page.getByRole('button', { name: 'Back to the task' }).click()
    await expect.element(title()).toBeVisible()
  })

  it('confirms a removal in a sheet that starts on Keep it, and Remove task puts the task in Done', async () => {
    await phone('removalProposedPage')
    await page.getByRole('button', { name: 'Remove…' }).click()
    const confirm = sheet('Remove this task?')
    await expect.element(confirm.getByRole('button', { name: 'Keep it' })).toHaveFocus()
    await confirm.getByRole('button', { name: 'Remove task' }).click()
    await expect.element(confirm).not.toBeInTheDocument()
    await expect.element(title()).not.toBeInTheDocument()
    await page.getByRole('radio', { name: 'Done 5' }).click()
    await page.getByRole('button', { name: /Today/ }).click()
    await expect.element(page.getByText('Removed in a discussion · split into 3')).toBeVisible()
  })

  it('restores a removed task from its page, from the keyboard, back into Next steps', async () => {
    await phone('removedPhone')
    await page.getByText('Write the tickets for increment one').click()
    await expect.element(page.getByText('removed today at 14:40 in a discussion')).toBeVisible()
    const restore = page.getByRole('button', { name: 'Restore' })
    restore.element().focus()
    await userEvent.keyboard('{Enter}')
    await expect.element(page.getByRole('button', { name: 'Restore' })).not.toBeInTheDocument()
    await expect.element(page.getByText('suggested 2h ago by the planning run')).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Start in the-bridge' })).toBeVisible()
    await page.getByRole('button', { name: 'Back to Inbox' }).click()
    await expect.element(page.getByText('Removed in a discussion · split into 3')).not.toBeInTheDocument()
    await expect.element(page.getByRole('radio', { name: 'Done 3' })).toBeInTheDocument()
    await page.getByRole('radio', { name: 'Next steps 6' }).click()
    await expect.element(page.getByText('Write the tickets for increment one')).toBeVisible()
  })

  it('opens the discussion from a removed task’s Open discussion', async () => {
    await phone('removedPhone')
    await page.getByText('Write the tickets for increment one').click()
    await page.getByRole('button', { name: 'Open discussion' }).click()
    await expect.element(page.getByRole('group', { name: 'Proposed · Remove this task' })).toBeVisible()
  })

  it('starts the task with the pinned Start: the run card takes its place above the tab bar', async () => {
    await phone('taskPage')
    await page.getByRole('button', { name: 'Start in the-bridge' }).click()
    await expect.element(page.getByText('Running in quiet-nebula')).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Start in the-bridge' })).not.toBeInTheDocument()
    await page.getByRole('button', { name: 'Reply here' }).click()
    await expect.element(page.getByRole('textbox', { name: 'Reply' })).toBeVisible()
  })

  it('adds the message Erik sends in the discussion page to it', async () => {
    await phone('tasksProposedPage')
    await userEvent.type(page.getByRole('textbox', { name: 'Ask about this task' }), 'Keep the Inbox one.{Enter}')
    await expect.element(page.getByText('Keep the Inbox one.')).toBeVisible()
    await expect.element(page.getByRole('textbox', { name: 'Ask about this task' })).toHaveValue('')
  })

  it('places the toast just above the tab bar', async () => {
    await phone('tasksCreatedPhone')
    const toast = document.querySelector('[data-figma="toast · created"]')
    const tabBar = document.querySelector('[data-figma="tab bar"]')
    expect(toast).not.toBeNull()
    expect(tabBar).not.toBeNull()
    if (toast !== null && tabBar !== null) expect(box(tabBar).top - box(toast).bottom).toBe(12)
  })

  it('takes the new tasks out with Undo in the toast', async () => {
    await phone('tasksCreatedPhone')
    await expect.element(page.getByText('Write the Workbench tickets')).toBeVisible()
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect.element(page.getByText('Write the Workbench tickets')).not.toBeInTheDocument()
    await expect.element(page.getByText('Created 3 tasks from a discussion')).not.toBeInTheDocument()
  })

  it('keeps the reply Erik types in the chat', async () => {
    await phone('chat')
    const reply = page.getByRole('textbox', { name: 'Reply' })
    await userEvent.type(reply, 'Wait for the review')
    await expect.element(reply).toHaveValue('Wait for the review')
    await expect.element(page.getByRole('button', { name: 'Home' })).not.toBeInTheDocument()
  })
})
