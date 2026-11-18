import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// Edit mode on the phone's list (M2): Done, the handles, the fields that rename a chat or a workspace in place.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('the phone list in edit mode', () => {
  it('shows Done, turns + off and puts the focus in the chat field', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneEdit
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await expect.element(page.getByRole('button', { name: 'Done' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'New chat or workspace' })).toBeDisabled()
    await expect.element(page.getByRole('button', { name: 'Close omni-brain' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'drift check actions' })).not.toBeInTheDocument()
    const chatField = page.getByRole('searchbox', { name: 'Rename bridge themes' })
    await expect.element(chatField).toHaveValue('theme explorations')
    await expect.element(chatField).toHaveFocus()
    await expect.element(page.getByRole('searchbox', { name: 'Rename the-bridge' })).toHaveValue('the-bridge')
  })

  it('saves the typed name on Done and goes back to Edit', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneEdit
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await expect.element(page.getByRole('searchbox', { name: 'Rename bridge themes' })).toHaveFocus()
    await userEvent.click(page.getByRole('button', { name: 'Done' }))
    await expect.element(page.getByRole('button', { name: 'Edit' })).toBeVisible()
    await expect.element(page.getByText('theme explorations', { exact: true })).toBeVisible()
    await expect.element(page.getByRole('searchbox')).not.toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: 'New chat or workspace' })).toBeEnabled()
  })

  it("undoes a chat's rename with ×, and a tap on a chat's name opens its field", async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneEdit
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await expect.element(page.getByRole('searchbox', { name: 'Rename bridge themes' })).toHaveFocus()
    await userEvent.click(page.getByRole('button', { name: 'Undo the rename' }).first())
    await expect.element(page.getByRole('button', { name: 'bridge themes' })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'drift check' }))
    await expect.element(page.getByRole('searchbox', { name: 'Rename drift check' })).toHaveValue('drift check')
  })

  it('starts edit mode from Edit on the home', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneEdit
    view = await testRender(
      <WorkspacesScreen
        data={data}
        ui={{ ...ui, editing: false, renamingChats: {}, renamingWorkspaces: {} }}
        viewport="phone"
      />,
    )
    await userEvent.click(page.getByRole('button', { name: 'Edit' }))
    await expect.element(page.getByRole('button', { name: 'Done' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Close omni' })).toBeVisible()
  })

  it("reports whether a renamed workspace's chats show, and its chevron keeps its bare border while they do", async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneEdit
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const hide = page.getByRole('button', { name: 'Hide the chats of the-bridge' })
    await expect.element(hide).toHaveAttribute('aria-expanded', 'true')
    // A `text` button's own border is transparent; a disclosure toggle keeps it while expanded (not border.active).
    expect(getComputedStyle(hide.element()).borderTopColor).toBe('rgba(0, 0, 0, 0)')
    await view.unmount()
    // A tap on the chevron also ends the rename (the field loses the focus), so the closed group is its own render.
    view = await testRender(
      <WorkspacesScreen data={data} ui={{ ...ui, collapsed: [...ui.collapsed, 'the-bridge'] }} viewport="phone" />,
    )
    const show = page.getByRole('button', { name: 'Show the chats of the-bridge' })
    await expect.element(show).toHaveAttribute('aria-expanded', 'false')
    expect(getComputedStyle(show.element()).borderTopColor).toBe('rgba(0, 0, 0, 0)')
  })
})
