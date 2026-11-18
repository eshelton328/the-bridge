import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// Edit mode on the tablet (T1): the phone's list at the tablet's width, with the tab bar, and Move to… on drift check.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('the tablet list in edit mode', () => {
  it('draws the list with the tab bar and no rail at a tablet width', async () => {
    await page.viewport(756, 1129)
    const { data, ui } = workspacesStates.tabletEdit
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
    await expect.element(page.getByRole('button', { name: 'Done' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'New chat or workspace' })).toBeDisabled()
    await expect.element(page.getByRole('button', { name: 'Home' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Hide the workspace sidebar' })).not.toBeInTheDocument()
    const field = page.getByRole('searchbox', { name: 'Rename the-bridge' })
    await expect.element(field).toHaveValue('the-bridge')
    await expect.element(field).toHaveFocus()
    await expect.element(page.getByText('Working', { exact: true })).toBeVisible()
  })

  it("opens drift check's actions with Move to workspace's list open from Move to…", async () => {
    await page.viewport(756, 1129)
    const { data, ui } = workspacesStates.tabletEdit
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="tablet" />)
    await userEvent.click(page.getByRole('button', { name: 'Move to…' }))
    const sheet = page.getByRole('dialog', { name: 'drift check' })
    await expect.element(sheet).toBeVisible()
    await expect.element(sheet.getByText('the-bridge', { exact: true })).toBeVisible()
  })

  it('keeps the desktop layout at a tablet width for a phone state without tabletList', async () => {
    await page.viewport(756, 1129)
    const { data, ui } = workspacesStates.phoneEdit
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="tablet" />)
    await expect.element(page.getByRole('button', { name: 'Hide the workspace sidebar' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Done' })).not.toBeInTheDocument()
  })
})
