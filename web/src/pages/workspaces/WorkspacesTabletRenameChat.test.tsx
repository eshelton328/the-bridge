import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// The chat renamed on the tablet (T14): Rename chat in the chat actions menu turns the name in the header into D21's
// field, 300 wide, with the focus; a tap outside saves the name, × undoes the change and closes the field, as in M23.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('a chat renamed on the tablet', () => {
  it('draws the name as a 300 px field in the header, with the focus', async () => {
    await page.viewport(756, 1129)
    const { data, ui } = workspacesStates.tabletRenameChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="tablet" />)
    const field = page.getByRole('searchbox', { name: 'Rename bridge themes' })
    await expect.element(field).toHaveFocus()
    await expect.element(field).toHaveValue('bridge themes')
    const box = field.element().closest('[data-figma="rename field · chat"]')
    expect(box?.getBoundingClientRect().width).toBe(300)
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).not.toBeInTheDocument()
  })

  it('saves the name with a tap outside the field', async () => {
    await page.viewport(756, 1129)
    const { data, ui } = workspacesStates.tabletRenameChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="tablet" />)
    const field = page.getByRole('searchbox', { name: 'Rename bridge themes' })
    await expect.element(field).toHaveFocus()
    await userEvent.fill(field, 'theme explorations')
    await userEvent.click(page.getByText('Three directions', { exact: false }))
    await expect.element(page.getByRole('heading', { name: 'theme explorations' })).toBeVisible()
    await expect.element(page.getByRole('textbox')).not.toHaveFocus()
  })

  it('undoes the change with ×', async () => {
    await page.viewport(756, 1129)
    const { data, ui } = workspacesStates.tabletRenameChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="tablet" />)
    const field = page.getByRole('searchbox', { name: 'Rename bridge themes' })
    await expect.element(field).toHaveFocus()
    await userEvent.fill(field, 'theme explorations')
    await userEvent.click(page.getByRole('button', { name: 'Undo the rename' }))
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect.element(field).not.toBeInTheDocument()
  })

  it("opens from the chat actions' Rename chat and gives the focus back to the message box that had it", async () => {
    await page.viewport(756, 1129)
    // T11's chat: the message box has the focus before the menu opens.
    const { data, ui } = workspacesStates.tabletSubtaskRunning
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="tablet" />)
    await userEvent.click(page.getByRole('button', { name: 'bridge themes actions' }))
    await userEvent.click(page.getByRole('menuitem', { name: 'Rename chat' }))
    const field = page.getByRole('searchbox', { name: 'Rename bridge themes' })
    await expect.element(field).toHaveFocus()
    await userEvent.fill(field, 'theme explorations')
    await userEvent.click(page.getByText('Three directions', { exact: false }))
    await expect.element(page.getByRole('heading', { name: 'theme explorations' })).toBeVisible()
    await expect.element(page.getByRole('textbox')).toHaveFocus()
  })
})
