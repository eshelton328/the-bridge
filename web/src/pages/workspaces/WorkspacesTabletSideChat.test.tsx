import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// The side chat on the tablet (T2): the chat fills the screen as on the phone, with no tab bar and no rail, and the
// side chat opens in a sheet over it.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('the side chat on the tablet', () => {
  it('shows the chat with no tab bar and the side chat in a sheet, with the focus in its message box', async () => {
    await page.viewport(756, 1129)
    const { data, ui } = workspacesStates.tabletSideChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="tablet" />)
    const sheet = page.getByRole('dialog', { name: 'Side chat' })
    await expect.element(sheet).toBeVisible()
    await expect
      .element(sheet.getByText('Nothing here enters bridge themes. Close the sheet and the main chat carries on.'))
      .toBeVisible()
    await expect.element(sheet.getByRole('textbox', { name: 'Ask a side question' })).toHaveFocus()
    await expect.element(page.getByRole('button', { name: 'Home' })).not.toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: 'Hide the workspace sidebar' })).not.toBeInTheDocument()
  })

  it('closes with × and leaves the main chat, and Back returns to the list with the tab bar', async () => {
    await page.viewport(756, 1129)
    const { data, ui } = workspacesStates.tabletSideChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="tablet" />)
    const sheet = page.getByRole('dialog', { name: 'Side chat' })
    await userEvent.click(sheet.getByRole('button', { name: 'Close the side chat' }))
    await expect.element(sheet).not.toBeInTheDocument()
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: data.phone.back }))
    await expect.element(page.getByRole('button', { name: 'Home' })).toBeVisible()
  })
})
