import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// A workspace's actions on the phone (M14): the ⋯ of its header opens them in a sheet.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

const { data, ui } = workspacesStates.phoneWorkspaceActions
const closed = { ...ui, workspaceMenuFor: null }

describe("a workspace's actions on the phone", () => {
  it('shows the workspace and its three actions, none highlighted', async () => {
    await page.viewport(390, 806)
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const sheet = page.getByRole('dialog', { name: 'omni-brain' })
    await expect.element(sheet).toBeVisible()
    for (const label of ['New chat in omni-brain', 'Rename workspace', 'Close workspace']) {
      const action = sheet.getByRole('radio', { name: label, exact: true })
      await expect.element(action).toBeVisible()
      await expect.element(action).not.toBeChecked()
    }
    await expect.element(sheet.getByText('Move to workspace')).not.toBeInTheDocument()
  })

  it("opens from the header's ⋯, for that workspace", async () => {
    await page.viewport(390, 806)
    view = await testRender(<WorkspacesScreen data={data} ui={closed} viewport="phone" />)
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(page.getByRole('button', { name: 'the-bridge actions' }))
    const sheet = page.getByRole('dialog', { name: 'the-bridge' })
    await expect.element(sheet).toBeVisible()
    await expect.element(sheet.getByRole('radio', { name: 'New chat in the-bridge' })).toBeVisible()
  })

  it("asks before it closes the workspace, with M13's dialog", async () => {
    await page.viewport(390, 806)
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('dialog', { name: 'omni-brain' }).getByText('Close workspace'))
    await expect.element(page.getByRole('alertdialog', { name: 'Close omni-brain?' })).toBeVisible()
    await expect.element(page.getByRole('dialog', { name: 'omni-brain' })).not.toBeInTheDocument()
  })

  it("opens the workspace's name as a field in edit mode on Rename", async () => {
    await page.viewport(390, 806)
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('dialog', { name: 'omni-brain' }).getByText('Rename workspace'))
    await expect.element(page.getByRole('dialog', { name: 'omni-brain' })).not.toBeInTheDocument()
    await expect.element(page.getByRole('searchbox', { name: 'Rename omni-brain' })).toHaveValue('omni-brain')
    await expect.element(page.getByRole('button', { name: 'Done' })).toBeVisible()
  })
})
