import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// A chat's subagents on the phone (M6): the view that Subagents in the chat actions opens.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe("a chat's subagents on the phone", () => {
  it('shows each subagent with its state, time and tokens, Stop while it runs, and a chevron', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneSubagents
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const list = page.getByRole('region', { name: 'Subagents' })
    await expect.element(list.getByRole('heading', { name: 'Subagents' })).toBeVisible()
    await expect.element(list.getByText('3 · 2 running')).toBeVisible()
    await expect.element(list.getByText('Explore agent · 0:41 · 18k tokens')).toBeVisible()
    await expect.element(list.getByText('› Writing layout-notes.md')).toBeVisible()
    await expect.element(list.getByRole('button', { name: 'Stop' }).nth(1)).toBeVisible()
    await expect
      .element(list.getByRole('button', { name: 'Open the transcript of Subtask: theme tokens' }))
      .toBeVisible()
    await expect.element(page.getByRole('navigation')).not.toBeInTheDocument()
  })

  it('hides a transcript, goes back to the chat, and Subagents in the chat actions opens the view again', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneSubagents
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const list = page.getByRole('region', { name: 'Subagents' })
    await userEvent.click(list.getByRole('button', { name: 'Hide transcript' }))
    await expect.element(list.getByText('› Writing layout-notes.md')).not.toBeInTheDocument()
    await userEvent.click(page.getByRole('button', { name: 'Back to bridge themes' }))
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'bridge themes actions' }))
    await userEvent.click(page.getByRole('dialog', { name: 'bridge themes' }).getByText('Subagents · 2'))
    await expect.element(page.getByRole('region', { name: 'Subagents' })).toBeVisible()
  })
})
