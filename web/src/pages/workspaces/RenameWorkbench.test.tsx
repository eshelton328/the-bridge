import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { renameChat } from './states/renameChat.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

describe('a saved rename with the sidebar hidden (D21)', () => {
  it('shows the new name in the workbench', async () => {
    // The desktop frame's size, so that the backdrop fits the window.
    await page.viewport(1512, 982)
    view = await testRender(<WorkspacesScreen data={renameChat.data} ui={renameChat.ui} viewport="desktop" />)
    const field = page.getByRole('searchbox', { name: 'Rename bridge themes' })
    await expect.element(field).toHaveFocus()
    await userEvent.fill(field, 'bridge palettes')
    await userEvent.keyboard('{Enter}')
    await expect.element(page.getByRole('heading', { name: 'bridge palettes' })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    // The chat's pane in the workbench is headed by the new name, not the one in the data.
    await expect.element(page.getByRole('button', { name: 'Maximise bridge palettes' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Maximise bridge themes' })).not.toBeInTheDocument()
  })
})
