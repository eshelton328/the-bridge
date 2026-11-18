import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// The chat fills the phone's screen (M17): no tab bar, the focus in the message box with no skill list, and Back
// returns to the list, where the other chats keep running.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('a chat full screen on the phone', () => {
  it('has no tab bar and the focus in the message box, with the skills closed', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneChatFull
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Home' })).not.toBeInTheDocument()
    await expect.element(page.getByRole('radio', { name: /\/writer/ })).not.toBeInTheDocument()
    const box = page.getByRole('textbox')
    await expect.element(box).toHaveValue('/')
    await expect.element(box).toHaveFocus()
  })

  it('goes back to the list, where the other chats keep running', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneChatFull
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'Back to Workspaces' }))
    await expect.element(page.getByRole('button', { name: 'Home' })).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).not.toBeInTheDocument()
    await expect.element(page.getByText('drift check', { exact: true })).toBeVisible()
    await expect.element(page.getByText('hono server', { exact: true })).toBeVisible()
  })
})
