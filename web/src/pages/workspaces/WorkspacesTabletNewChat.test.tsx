import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// New chat on the tablet (T7): D3's form in a dialog over the tablet's chat, which stays under it.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('New chat on the tablet', () => {
  it('draws the form over the chat, with the focus in the first message', async () => {
    await page.viewport(756, 1129)
    const { data, ui } = workspacesStates.tabletNewChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="tablet" />)
    const dialog = page.getByRole('dialog', { name: 'New chat' })
    await expect.element(dialog).toBeVisible()
    await expect.element(dialog.getByRole('button', { name: 'WORKSPACE: the-bridge' })).toBeVisible()
    await expect.element(dialog.getByRole('textbox', { name: 'FIRST MESSAGE' })).toHaveFocus()
    // The dialog hides the chat from assistive technology, so the chat is found by its text.
    await expect
      .element(page.getByText('Brainstorm layouts for the-bridge that go beyond a sidebar and a chat.'))
      .toBeInTheDocument()
  })

  it("opens from the chat actions' New chat in the chat's workspace, and Cancel returns to the chat", async () => {
    await page.viewport(756, 1129)
    // T7's state before New chat: the chat actions open under the ⋯, as in T2b.
    const { data, ui } = workspacesStates.tabletNewChat
    view = await testRender(
      <WorkspacesScreen data={data} ui={{ ...ui, newChatOpen: false, menuFor: 'bridge-themes' }} viewport="tablet" />,
    )
    await userEvent.click(page.getByRole('menuitem', { name: 'New chat' }))
    const dialog = page.getByRole('dialog', { name: 'New chat' })
    await expect.element(dialog.getByRole('button', { name: 'WORKSPACE: omni-brain' })).toBeVisible()
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }))
    await expect.element(dialog).not.toBeInTheDocument()
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
  })
})
