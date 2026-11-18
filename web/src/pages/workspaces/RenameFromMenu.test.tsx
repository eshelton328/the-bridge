import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { chatActions } from './states/chatActions.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

describe('Rename chat in the ⋯ menu (D2b to D21)', () => {
  it('opens the name field with the focus in it', async () => {
    // The desktop frame's size, so that the backdrop fits the window.
    await page.viewport(1512, 982)
    view = await testRender(<WorkspacesScreen data={chatActions.data} ui={chatActions.ui} viewport="desktop" />)
    await userEvent.click(page.getByRole('menuitem', { name: 'Rename chat' }))
    // The menu closes after the pick; that close must not undo the rename.
    const field = page.getByRole('searchbox', { name: 'Rename bridge themes' })
    await expect.element(field).toBeInTheDocument()
    await expect.element(field).toHaveFocus()
  })
})
