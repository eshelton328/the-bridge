import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// New chat on the phone (M7): the form fills the screen, with no tab bar.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('New chat on the phone', () => {
  it('shows each field, the summary of the choices and Start chat, with the focus in the first message', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneNewChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const form = page.getByRole('region', { name: 'New chat' })
    await expect.element(form.getByRole('heading', { name: 'New chat' })).toBeVisible()
    await expect.element(form.getByPlaceholder('quiet-nebula')).toBeVisible()
    await expect.element(form.getByRole('button', { name: 'Claude Code' })).toHaveAttribute('aria-pressed', 'true')
    await expect.element(form.getByRole('button', { name: 'Codex' })).toHaveAttribute('aria-pressed', 'false')
    await expect.element(form.getByRole('button', { name: 'WORKSPACE: the-bridge' })).toBeVisible()
    await expect.element(form.getByRole('button', { name: 'Remove ~/omni' })).toBeVisible()
    await expect.element(form.getByText('Runs in the-bridge · Sonnet 5.5 · 2 folders')).toBeVisible()
    await expect.element(form.getByRole('button', { name: 'Start chat' })).toBeVisible()
    await expect.element(form.getByRole('textbox', { name: 'FIRST MESSAGE' })).toHaveFocus()
    await expect.element(page.getByRole('navigation')).not.toBeInTheDocument()
  })

  it('closes with Cancel and shows the workspaces again', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneNewChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'Cancel' }))
    await expect.element(page.getByRole('region', { name: 'New chat' })).not.toBeInTheDocument()
    await expect.element(page.getByRole('heading', { name: 'Workspaces' })).toBeVisible()
  })

  it('keeps the typed name in focus and Start chat alone in the start bar with the keyboard up (M11)', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneNewChatKeyboard
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const form = page.getByRole('region', { name: 'New chat' })
    const name = form.getByRole('textbox', { name: 'NAME · OPTIONAL' })
    await expect.element(name).toHaveValue('theme tokens')
    await expect.element(name).toHaveFocus()
    await expect.element(form.getByText('random if blank')).not.toBeInTheDocument()
    await expect.element(form.getByRole('button', { name: 'FOLDERS: ~/omni-brain, ~/the-bridge' })).toBeVisible()
    await expect.element(form.getByRole('button', { name: 'shell' })).not.toBeInTheDocument()
    await expect.element(form.getByText(/^Runs in /)).not.toBeInTheDocument()
    await expect.element(form.getByRole('button', { name: 'Start chat' })).toBeVisible()
  })
})
