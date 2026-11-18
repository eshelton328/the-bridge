import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// A chat held in the phone's list (M9): the hold opens the chat's actions in a sheet and lifts the row.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Presses a pointer on the element, moves it `drift` px down after 100 ms, and lets go after `ms`. */
async function press(element: Element, ms: number, drift = 0) {
  const box = element.getBoundingClientRect()
  const at = { bubbles: true, button: 0, pointerId: 1, clientX: box.x + 20, clientY: box.y + 20 }
  element.dispatchEvent(new PointerEvent('pointerdown', at))
  await wait(100)
  if (drift > 0) element.dispatchEvent(new PointerEvent('pointermove', { ...at, clientY: at.clientY + drift }))
  await wait(ms - 100)
  element.dispatchEvent(new PointerEvent('pointerup', at))
}

// The M1 list with M9's actions, so a hold can open them.
const withActions = {
  data: { ...workspacesStates.phoneHome.data, phone: workspacesStates.phoneHoldChat.data.phone },
  ui: workspacesStates.phoneHome.ui,
}

describe('a chat held in the phone list', () => {
  it('shows the held chat lifted and its actions, Rename first and highlighted', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneHoldChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const sheet = page.getByRole('dialog', { name: 'drift check' })
    await expect.element(sheet).toBeVisible()
    const labels = ['Rename', 'Fork', 'Side chat', 'Subtask', 'Subagents · 2', 'Folders · 2', 'Move to workspace']
    for (const label of labels)
      await expect.element(sheet.getByRole('radio', { name: label, exact: true })).toBeVisible()
    await expect.element(sheet.getByRole('radio', { name: 'Rename' })).toBeChecked()
    await expect.element(sheet.getByRole('radio', { name: 'Close chat' })).toBeVisible()
    // Move to workspace is closed: no workspace shows under it.
    await expect.element(sheet.getByText('New workspace…')).not.toBeInTheDocument()
    await expect.element(page.getByText('drift check').first()).toBeInTheDocument()
    expect(document.querySelector('[data-figma="146:252"]')).not.toBeNull()
  })

  it('opens the actions after a still hold, and the release does not open the chat', async () => {
    await page.viewport(390, 806)
    view = await testRender(<WorkspacesScreen data={withActions.data} ui={withActions.ui} viewport="phone" />)
    const row = page.getByRole('button', { name: /drift check/ }).first()
    await expect.element(row).toBeVisible()
    await press(row.element(), 700)
    await expect.element(page.getByRole('dialog', { name: 'drift check' })).toBeVisible()
    await expect.element(page.getByRole('radio', { name: 'Rename' })).toBeChecked()
    await expect.element(page.getByRole('button', { name: 'Back to Workspaces' })).not.toBeInTheDocument()
  })

  it('does not open the actions when the finger moves', async () => {
    await page.viewport(390, 806)
    view = await testRender(<WorkspacesScreen data={withActions.data} ui={withActions.ui} viewport="phone" />)
    const row = page.getByRole('button', { name: /drift check/ }).first()
    await expect.element(row).toBeVisible()
    await press(row.element(), 700, 20)
    await wait(100)
    await expect.element(page.getByRole('dialog', { name: 'drift check' })).not.toBeInTheDocument()
  })

  it("opens the same actions from the row's ⋯", async () => {
    await page.viewport(390, 806)
    view = await testRender(<WorkspacesScreen data={withActions.data} ui={withActions.ui} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'drift check actions' }))
    const sheet = page.getByRole('dialog', { name: 'drift check' })
    await expect.element(sheet).toBeVisible()
    await userEvent.click(sheet.getByText('Move to workspace'))
    await expect.element(sheet.getByText('New workspace…')).toBeVisible()
  })
})
