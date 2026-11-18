import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// A chat on the phone (M3): the header, the transcript, the skills after "/" and the composer, with no tab bar.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('a chat on the phone', () => {
  it('fills the screen with no tab bar, lists the skills and keeps the focus in the message box', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Back to Workspaces' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Home' })).not.toBeInTheDocument()
    await expect.element(page.getByRole('radio', { name: /\/writer/ })).toBeChecked()
    const box = page.getByRole('textbox')
    await expect.element(box).toHaveValue('/')
    await expect.element(box).toHaveFocus()
  })

  it('goes back to the list, and a tap on a chat opens it again', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'Back to Workspaces' }))
    await expect.element(page.getByRole('button', { name: 'Edit' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Home' })).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).not.toBeInTheDocument()
    await userEvent.click(page.getByRole('button', { name: 'bridge themes', exact: true }))
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect.element(page.getByRole('radio', { name: /\/writer/ })).not.toBeInTheDocument()
  })
})
