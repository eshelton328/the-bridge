import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// A chat's subagents on the tablet (T3): the phone's view at a tablet's width, with the chat it started from in the
// count line and Start a subtask under the cards.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe("a chat's subagents on the tablet", () => {
  it('shows each subagent with Stop while it runs, no chevrons and no tab bar, and Start a subtask', async () => {
    await page.viewport(756, 1129)
    const { data, ui } = workspacesStates.tabletSubagents
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="tablet" />)
    const list = page.getByRole('region', { name: 'Subagents' })
    await expect.element(list.getByText('3 · 2 running · started from bridge themes')).toBeVisible()
    await expect.element(list.getByText('subtask · full chat context · 1:12 · 26k tokens')).toBeVisible()
    await expect.element(list.getByText('› Writing layout-notes.md')).toBeVisible()
    await expect.element(list.getByRole('button', { name: 'Stop' }).nth(1)).toBeVisible()
    await expect.element(list.getByRole('button', { name: /^Open the transcript of/ })).not.toBeInTheDocument()
    await expect.element(list.getByRole('button', { name: 'Start a subtask' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Home' })).not.toBeInTheDocument()
  })

  it('opens the Subtask form over the chat from Start a subtask, and Back returns to the chat', async () => {
    await page.viewport(756, 1129)
    const { data, ui } = workspacesStates.tabletSubagents
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="tablet" />)
    await userEvent.click(page.getByRole('button', { name: 'Start a subtask' }))
    await expect.element(page.getByRole('dialog', { name: 'Start a subtask' })).toBeVisible()
    await view.unmount()
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="tablet" />)
    await userEvent.click(page.getByRole('button', { name: 'Back to bridge themes' }))
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect.element(page.getByRole('region', { name: 'Subagents' })).not.toBeInTheDocument()
  })
})
