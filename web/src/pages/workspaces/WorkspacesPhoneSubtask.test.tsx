import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// Subtask on the phone (M20): the chat actions' Subtask opens a sheet over the chat with the model, the task in focus,
// the note and Start subtask; × closes it, and the chat stays as it was.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('start a subtask on the phone', () => {
  it('shows the model, the task with the focus, the note and Start subtask', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneSubtask
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const sheet = page.getByRole('dialog', { name: 'Start a subtask' })
    await expect.element(sheet).toBeVisible()
    await expect.element(sheet.getByRole('button', { name: 'MODEL: Sonnet 5.5 · high effort' })).toBeVisible()
    const task = sheet.getByRole('textbox', { name: 'WHAT SHOULD THE SUBTASK DO?' })
    await expect.element(task).toHaveValue('Draft layout notes for the three directions.')
    await expect.element(task).toHaveFocus()
    await expect.element(sheet.getByText('Gets this chat’s full context. Returns its result here.')).toBeVisible()
    await expect.element(sheet.getByRole('button', { name: 'Start subtask' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })

  it('draws Start subtask in Medium 12 and the note in Regular 12, as Figma does', async () => {
    // M20 422:607: "Start subtask" is Geist Medium 12 (`labelXs`); 422:608: the note is Regular 12 on one line (`small`).
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneSubtask
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const sheet = page.getByRole('dialog', { name: 'Start a subtask' })
    await expect.element(sheet).toBeVisible()
    const start = getComputedStyle(sheet.getByRole('button', { name: 'Start subtask' }).element())
    expect(`${start.fontSize}/${start.fontWeight}`).toBe('12px/500')
    const note = getComputedStyle(sheet.getByText('Gets this chat’s full context. Returns its result here.').element())
    expect(`${note.fontSize}/${note.fontWeight}/${note.lineHeight}`).toMatch(/^12px\/400\/16(\.\d+)?px$/)
  })

  it('opens from the chat actions and closes with ×', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneSubtask
    view = await testRender(<WorkspacesScreen data={data} ui={{ ...ui, chatDialog: null }} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'bridge themes actions' }))
    await userEvent.click(page.getByRole('dialog', { name: 'bridge themes' }).getByText('Subtask', { exact: true }))
    await expect.element(page.getByRole('dialog', { name: 'Start a subtask' })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Close' }))
    await expect.element(page.getByRole('dialog', { name: 'Start a subtask' })).not.toBeInTheDocument()
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
  })
})
