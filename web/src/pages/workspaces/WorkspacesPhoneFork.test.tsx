import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// Fork on the phone (M18): the chat actions' Fork opens a sheet over the chat with the copy's name, where it starts
// and Fork; × closes it, and the chat stays as it was.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('fork a chat on the phone', () => {
  it('shows the name, the start-from choice and Fork, with Whole chat chosen', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneFork
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const sheet = page.getByRole('dialog', { name: 'Fork bridge themes' })
    await expect.element(sheet).toBeVisible()
    await expect.element(sheet).toHaveFocus()
    await expect.element(page.getByRole('textbox', { name: 'NAME' })).toHaveValue('bridge themes · fork')
    await expect.element(page.getByRole('button', { name: 'Whole chat', pressed: true })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Up to a message…' }))
    await expect.element(page.getByRole('button', { name: 'Up to a message…', pressed: true })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Fork', exact: true })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })

  it('opens from the chat actions and closes with ×', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneFork
    view = await testRender(<WorkspacesScreen data={data} ui={{ ...ui, chatDialog: null }} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'bridge themes actions' }))
    await userEvent.click(page.getByRole('dialog', { name: 'bridge themes' }).getByText('Fork', { exact: true }))
    await expect.element(page.getByRole('dialog', { name: 'Fork bridge themes' })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Close' }))
    await expect.element(page.getByRole('dialog', { name: 'Fork bridge themes' })).not.toBeInTheDocument()
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
  })
})
