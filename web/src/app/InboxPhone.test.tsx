import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { resetAllStores } from '../state/resetStores.ts'
import { renderInbox, dialog, searchbox, box } from './inboxRouteHelpers.ts'

// The Inbox on the phone, through the real route, loader and page store
// (see InboxRoute.test.tsx).

afterEach(async () => {
  resetAllStores()
  await page.viewport(1512, 982)
})

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
  /**
   * Waits for the sheet's own first focus. The library sheet focuses itself after it opens, one frame or more
   * later on a busy machine; a focus the test moves before that is taken back, and the next key goes to the sheet.
   */
  const sheetFocused = async (name: string) => {
    await expect.poll(() => sheet(name).query()?.contains(document.activeElement) ?? false).toBe(true)
  }
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

  // R11 (the owner, on his phone): a tap on an item opens a page with its details, not its actions sheet.
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

  it('opens a row the owner dismissed from Done with its outcome and no actions', async () => {
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

  // Audit P-5: on plain HTTP the page has no Clipboard API, and a page may refuse the write. Copy then copies nothing,
  // with no uncaught error and no unhandled rejection (Vitest fails the run on either). Each opens the prompt as the owner
  // does: the task from the list, then Read the whole prompt.
  it('copies nothing, and throws nothing, on a page with no clipboard', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
    try {
      await phone('list')
      await page.getByText('Write the tickets for increment one').click()
      await page.getByRole('link', { name: 'Read the whole prompt' }).click()
      await dialog().getByRole('button', { name: 'Copy' }).click()
      await expect.element(dialog()).toBeVisible()
    } finally {
      Reflect.deleteProperty(navigator, 'clipboard')
    }
  })

  it('copies nothing, and leaves no unhandled rejection, when the page refuses the write', async () => {
    const { clipboard } = navigator
    const writeText = clipboard.writeText.bind(clipboard)
    let asked = 0
    clipboard.writeText = () => {
      asked += 1
      return Promise.reject(new DOMException('Write permission denied.', 'NotAllowedError'))
    }
    try {
      await phone('list')
      await page.getByText('Write the tickets for increment one').click()
      await page.getByRole('link', { name: 'Read the whole prompt' }).click()
      await dialog().getByRole('button', { name: 'Copy' }).click()
      expect(asked).toBe(1)
      await expect.element(dialog()).toBeVisible()
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
    await sheetFocused('Sort')
    kind.element().focus()
    await expect.element(kind).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect.element(sheet('Sort')).not.toBeInTheDocument()
    await expect.element(page.getByText('Sorted by kind')).toBeVisible()
  })

  it('moves the sort with an arrow key in the Sort sheet, and Done keeps it', async () => {
    await phone('list')
    await page.getByRole('button', { name: 'Sort', exact: true }).click()
    await sheetFocused('Sort')
    const newest = sheet('Sort').getByRole('radio', { name: /Newest first/ })
    newest.element().focus()
    await expect.element(newest).toHaveFocus()
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

  it('adds the message the owner sends in the discussion page to it', async () => {
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

  it('keeps the reply the owner types in the chat', async () => {
    await phone('chat')
    const reply = page.getByRole('textbox', { name: 'Reply' })
    await userEvent.type(reply, 'Wait for the review')
    await expect.element(reply).toHaveValue('Wait for the review')
    await expect.element(page.getByRole('button', { name: 'Home' })).not.toBeInTheDocument()
  })
})
