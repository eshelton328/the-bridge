import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { movedChat } from './states/movedChat.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

describe('the toast after a move (D20)', () => {
  it('shows over the composer until the owner clicks Undo', async () => {
    // The desktop frame's size, so that the backdrop fits the window.
    await page.viewport(1512, 982)
    view = await testRender(<WorkspacesScreen data={movedChat.data} ui={movedChat.ui} viewport="desktop" />)
    const toast = page.getByRole('status').filter({ hasText: 'Moved bridge themes to the-bridge' })
    await expect.element(toast).toBeVisible()
    await userEvent.click(toast.getByRole('button', { name: 'Undo' }))
    await expect.element(toast).not.toBeInTheDocument()
  })
})
