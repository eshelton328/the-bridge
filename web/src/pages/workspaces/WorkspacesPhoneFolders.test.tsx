import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// The chat's folders on the phone (M8): a sheet that the folders chip in the chat's header opens, with the picker.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe("the chat's folders on the phone", () => {
  it('shows the folders and the picker in a sheet, with the focus in the search', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneFolders
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const sheet = page.getByRole('dialog', { name: 'Folders' })
    await expect.element(sheet).toBeVisible()
    await expect.element(sheet.getByText('working folder')).toBeVisible()
    await expect.element(sheet.getByRole('button', { name: 'Remove ~/omni' })).toBeVisible()
    await expect.element(sheet.getByRole('heading', { name: 'Add a folder' })).toBeVisible()
    await expect.element(sheet.getByRole('button', { name: 'Add ~/the-bridge' })).toBeVisible()
    await expect.element(sheet.getByRole('searchbox', { name: 'Search folders' })).toHaveFocus()
  })

  it('closes the picker with its ×, opens it again with Add folder, and the chip opens the sheet again', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneFolders
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const sheet = page.getByRole('dialog', { name: 'Folders' })
    await userEvent.click(sheet.getByRole('button', { name: 'Close the folder picker' }))
    await expect.element(sheet.getByRole('heading', { name: 'Add a folder' })).not.toBeInTheDocument()
    await userEvent.click(sheet.getByRole('button', { name: 'Add folder' }))
    await expect.element(sheet.getByRole('heading', { name: 'Add a folder' })).toBeVisible()
    await userEvent.click(sheet.getByRole('button', { name: 'Close', exact: true }))
    await expect.element(sheet).not.toBeInTheDocument()
    await expect.element(page.getByRole('heading', { name: 'drift check' })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: '2 folders' }))
    await expect.element(page.getByRole('dialog', { name: 'Folders' })).toBeVisible()
  })
})
