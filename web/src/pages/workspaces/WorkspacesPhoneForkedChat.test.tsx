import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// The fork on the phone (M19): it opens Idle, with no Stop, and Back returns to the list, where it is under bridge
// themes with the fork mark (D16).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('a forked chat on the phone', () => {
  it('opens Idle, with no Stop and an empty message box', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneForkedChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await expect.element(page.getByRole('heading', { name: 'bridge themes · fork' })).toBeVisible()
    await expect.element(page.getByText('omni-brain · forked')).toBeVisible()
    await expect.element(page.getByText('Idle', { exact: true })).toBeVisible()
    await expect.element(page.getByText('Forked from bridge themes here')).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Stop' })).not.toBeInTheDocument()
    await expect.element(page.getByRole('textbox')).toHaveValue('')
  })

  it('goes back to the list, where the fork is under bridge themes with its mark', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneForkedChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'Back to Workspaces' }))
    await expect.element(page.getByRole('heading', { name: 'bridge themes · fork' })).not.toBeInTheDocument()
    const original = page.getByText('bridge themes', { exact: true })
    const fork = page.getByText('bridge themes · fork', { exact: true })
    await expect.element(original).toBeVisible()
    await expect.element(fork).toBeVisible()
    await expect.element(page.getByRole('img', { name: 'Fork of bridge themes' })).toBeVisible()
    const above = original.element().getBoundingClientRect().top
    expect(fork.element().getBoundingClientRect().top).toBeGreaterThan(above)
  })
})
