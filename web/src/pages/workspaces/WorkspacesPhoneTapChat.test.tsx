import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// A tap on a chat in the phone list (M16) opens it full screen: no drag and no split panes on the phone.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('a tap on a chat in the phone list', () => {
  it('opens the chat full screen, with no tab bar and no split', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneTapChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await expect.element(page.getByRole('button', { name: 'Home' })).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).not.toBeInTheDocument()
    await userEvent.click(page.getByRole('button', { name: 'bridge themes', exact: true }))
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Back to Workspaces' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Home' })).not.toBeInTheDocument()
    await expect.element(page.getByRole('separator')).not.toBeInTheDocument()
  })
})
