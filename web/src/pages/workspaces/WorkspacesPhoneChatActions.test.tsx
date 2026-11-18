import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// The chat actions on the phone (M4): the sheet that the ⋯ of a chat's header opens.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('the chat actions on the phone', () => {
  it('lists every action on the chat, with Move to workspace open on the-bridge', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneChatActions
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const sheet = page.getByRole('dialog', { name: 'bridge themes' })
    await expect.element(sheet).toBeVisible()
    for (const label of ['Fork', 'Side chat', 'Subtask', 'Subagents · 2', 'Folders · 2', 'Rename', 'Close chat'])
      await expect.element(sheet.getByRole('radio', { name: label, exact: true })).toBeInTheDocument()
    await expect.element(sheet.getByRole('radio', { name: 'the-bridge' })).toBeChecked()
    await expect.element(sheet.getByRole('radio', { name: 'New workspace…' })).toBeInTheDocument()
  })

  it('closes Move to workspace, then the sheet, and the ⋯ opens it again', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneChatActions
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const sheet = page.getByRole('dialog', { name: 'bridge themes' })
    await userEvent.click(sheet.getByText('Move to workspace'))
    await expect.element(sheet.getByText('skill-evals')).not.toBeInTheDocument()
    await userEvent.click(sheet.getByText('Fork'))
    await expect.element(sheet).not.toBeInTheDocument()
    const more = page.getByRole('button', { name: 'bridge themes actions' })
    await expect.element(more).toHaveFocus()
    await userEvent.click(more)
    await expect.element(page.getByRole('dialog', { name: 'bridge themes' })).toBeVisible()
  })
})
