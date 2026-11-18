import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// The chat renamed on the phone (M23): Rename in the chat actions sheet turns the name in the header into a field with
// the focus; a tap outside saves the name, × undoes the change and closes the field, as in M2.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('a chat renamed on the phone', () => {
  it('draws the name as a field in the header, with the focus', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneRenameChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const field = page.getByRole('searchbox', { name: 'Rename bridge themes' })
    await expect.element(field).toHaveFocus()
    await expect.element(field).toHaveValue('bridge themes')
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).not.toBeInTheDocument()
  })

  it('saves the name with a tap outside the field', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneRenameChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const field = page.getByRole('searchbox', { name: 'Rename bridge themes' })
    await expect.element(field).toHaveFocus()
    await userEvent.fill(field, 'theme explorations')
    await userEvent.click(page.getByText('Three directions', { exact: false }))
    await expect.element(page.getByRole('heading', { name: 'theme explorations' })).toBeVisible()
  })

  it('undoes the change with ×', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneRenameChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const field = page.getByRole('searchbox', { name: 'Rename bridge themes' })
    await expect.element(field).toHaveFocus()
    await userEvent.fill(field, 'theme explorations')
    await userEvent.click(page.getByRole('button', { name: 'Undo the rename' }))
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect.element(field).not.toBeInTheDocument()
  })

  it('opens the field from Rename in the chat actions sheet', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneRenameChat
    view = await testRender(<WorkspacesScreen data={data} ui={{ ...ui, renaming: false }} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'bridge themes actions' }))
    await userEvent.click(page.getByRole('dialog', { name: 'bridge themes' }).getByText('Rename', { exact: true }))
    const field = page.getByRole('searchbox', { name: 'Rename bridge themes' })
    await expect.element(field).toBeInTheDocument()
    await expect.element(field).toHaveFocus()
  })
})
