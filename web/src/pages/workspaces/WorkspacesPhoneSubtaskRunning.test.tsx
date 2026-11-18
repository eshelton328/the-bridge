import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// A subtask running on the phone (M21): the chat keeps working with Stop, a line marks where the subtask started, the
// chat actions count 3 subagents, and Back returns to the list, where layout notes is under bridge themes (D18).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('a subtask running on the phone', () => {
  it('keeps the chat working, with the line where the subtask started', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneSubtaskRunning
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect.element(page.getByText('Working', { exact: true })).toBeVisible()
    await expect.element(page.getByText('Subtask layout notes started · returns here')).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Stop' })).toBeVisible()
    await expect.element(page.getByRole('textbox')).toHaveValue('')
  })

  it('counts 3 subagents in the chat actions', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneSubtaskRunning
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'bridge themes actions' }))
    await expect.element(page.getByRole('dialog', { name: 'bridge themes' }).getByText('Subagents · 3')).toBeVisible()
  })

  it('goes back to the list, where layout notes is under bridge themes', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneSubtaskRunning
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'Back to Workspaces' }))
    const parent = page.getByText('bridge themes', { exact: true })
    const subtask = page.getByText('layout notes', { exact: true })
    await expect.element(parent).toBeVisible()
    await expect.element(subtask).toBeVisible()
    expect(subtask.element().getBoundingClientRect().top).toBeGreaterThan(parent.element().getBoundingClientRect().top)
  })
})
