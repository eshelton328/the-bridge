import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { resetAllStores } from '../state/resetStores.ts'
import { renderInbox, showState, dialog, removeDialog, searchbox, box } from './inboxRouteHelpers.ts'
import { stubLiveServer } from './liveServerStub.ts'

// A tap on Artifacts opens its home, which reads the live library in development.
stubLiveServer()

// The Inbox through the real route, loader and page store: what the
// props-only stories cannot show, because they have no state owner. The
// list tools and the task bar are in InboxListTools.test.tsx, the phone in
// InboxPhone.test.tsx; the helpers are in inboxRouteHelpers.ts.

afterEach(async () => {
  resetAllStores()
  await page.viewport(1512, 982)
})

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

  it('adds the message the owner sends to the desktop discussion and empties the reply box', async () => {
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
