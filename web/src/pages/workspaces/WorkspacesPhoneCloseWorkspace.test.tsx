import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// The dialog that asks before a workspace closes (M13): × on a workspace in the phone's edit mode opens it.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('closing a workspace on the phone', () => {
  it('asks with the workspace and its chats, the focus on the box and Cancel next', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneCloseWorkspace
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const dialog = page.getByRole('alertdialog', { name: 'Close omni-brain?' })
    await expect.element(dialog).toBeVisible()
    await expect.element(dialog.getByText(/drift check and the brain git shell all end with it/)).toBeVisible()
    await expect.element(dialog).toHaveFocus()
    await userEvent.tab()
    await expect.element(dialog.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await expect.element(page.getByRole('searchbox')).not.toBeInTheDocument()
  })

  it('keeps the workspace on Cancel', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneCloseWorkspace
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'Cancel' }))
    await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: 'Close omni-brain' })).toBeVisible()
  })

  it('takes the workspace off the list on Close, and × opens the dialog again for another', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneCloseWorkspace
    view = await testRender(<WorkspacesScreen data={data} ui={{ ...ui, closing: null }} viewport="phone" />)
    await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument()
    await userEvent.click(page.getByRole('button', { name: 'Close omni-brain' }))
    const dialog = page.getByRole('alertdialog', { name: 'Close omni-brain?' })
    await expect.element(dialog).toBeVisible()
    await userEvent.click(dialog.getByRole('button', { name: 'Close', exact: true }))
    await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: 'Close omni-brain' })).not.toBeInTheDocument()
    await expect.element(page.getByText('drift check')).not.toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: 'Close the-bridge' })).toBeVisible()
  })

  it('asks about a renamed workspace by its new name', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneCloseWorkspace
    view = await testRender(
      <WorkspacesScreen
        data={data}
        ui={{ ...ui, closing: null, renamingWorkspaces: { 'omni-brain': 'omni-brain' } }}
        viewport="phone"
      />,
    )
    const field = page.getByRole('searchbox', { name: 'Rename omni-brain' })
    await userEvent.clear(field)
    await userEvent.type(field, 'brain notes{Enter}')
    await userEvent.click(page.getByRole('button', { name: 'Close brain notes' }))
    const dialog = page.getByRole('alertdialog', { name: 'Close brain notes?' })
    await expect.element(dialog).toBeVisible()
    await expect.element(dialog.getByRole('heading', { name: 'Close brain notes?' })).toBeVisible()
    expect(dialog.element().textContent).not.toContain('omni-brain')
  })
})
