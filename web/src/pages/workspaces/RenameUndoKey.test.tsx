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

describe('Enter on the name field’s × (D21)', () => {
  it('undoes the rename and keeps the old name', async () => {
    // The desktop frame's size, so that the backdrop fits the window.
    await page.viewport(1512, 982)
    view = await testRender(<WorkspacesScreen data={renameChat.data} ui={renameChat.ui} viewport="desktop" />)
    const field = page.getByRole('searchbox', { name: 'Rename bridge themes' })
    await expect.element(field).toHaveFocus()
    await userEvent.fill(field, 'bridge palettes')
    const undo = page.getByRole('button', { name: 'Undo the rename' })
    await userEvent.keyboard('{Tab}')
    await expect.element(undo).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect.element(field).not.toBeInTheDocument()
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'bridge palettes' })).not.toBeInTheDocument()
  })
})
