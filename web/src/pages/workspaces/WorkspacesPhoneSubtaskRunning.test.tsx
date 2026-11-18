import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// A subtask running on the phone (M21): the chat keeps working with Stop, a line marks where the subtask started, the
// chat actions count 3 subagents, and Back returns to the list, where layout notes is nested under bridge themes,
// Running (D18).
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

  it('goes back to the list, where layout notes is nested under bridge themes, Running', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneSubtaskRunning
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'Back to Workspaces' }))
    // omni-brain's header controls its rows; bridge themes' nested rows follow it there, layout notes after theme
    // tokens, as in D18.
    const header = page.getByRole('button', { name: /omni-brain/i, expanded: true })
    await expect.element(header).toBeVisible()
    const rowsElement = document.getElementById(header.element().getAttribute('aria-controls') ?? '')
    if (rowsElement === null) throw new Error("omni-brain's header controls no rows")
    const rows = page.elementLocator(rowsElement)
    const rowElements = [...rowsElement.children]
    // The row of a chat in omni-brain's rows, and where it stands among them.
    const row = (title: string) => {
      const text = rows.getByText(title, { exact: true }).element()
      const at = rowElements.findIndex((r) => r.contains(text))
      const element = rowElements[at]
      if (!(element instanceof HTMLElement)) throw new Error(`omni-brain has no row ${title}`)
      return { at, element }
    }
    const parent = row('bridge themes')
    const sibling = row('theme tokens')
    const subtask = row('layout notes')
    expect([parent.at, sibling.at, subtask.at]).toEqual([0, 1, 2])
    // A nested row is drawn a level in (ListRow's data-level), as theme tokens is; bridge themes is not.
    expect(parent.element.querySelector('[data-level]')).toBeNull()
    expect(sibling.element.querySelector('[data-level]')?.getAttribute('data-level')).toBe('1')
    expect(subtask.element.querySelector('[data-level]')?.getAttribute('data-level')).toBe('1')
    await expect.element(page.elementLocator(subtask.element).getByText('Running', { exact: true })).toBeVisible()
  })
})
