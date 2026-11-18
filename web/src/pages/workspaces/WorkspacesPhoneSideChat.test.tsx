import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// The side chat on the phone (M5): a sheet over the main chat, which the chat actions' Side chat opens.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('the side chat on the phone', () => {
  it('shows the side chat in a sheet, with the focus in its message box', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneSideChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const sheet = page.getByRole('dialog', { name: 'Side chat' })
    await expect.element(sheet).toBeVisible()
    await expect.element(sheet.getByRole('heading', { name: 'Side chat' })).toBeVisible()
    await expect
      .element(sheet.getByText('Nothing here enters bridge themes. Close it and the main chat carries on.'))
      .toBeVisible()
    await expect.element(sheet.getByText('Can Panda CSS switch themes while the app runs?')).toBeVisible()
    const box = sheet.getByRole('textbox', { name: 'Ask a side question' })
    await expect.element(box).toHaveFocus()
  })

  it('closes with × and leaves the main chat, and Side chat in the chat actions opens it again', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneSideChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const sheet = page.getByRole('dialog', { name: 'Side chat' })
    await userEvent.click(sheet.getByRole('button', { name: 'Close the side chat' }))
    await expect.element(sheet).not.toBeInTheDocument()
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: 'bridge themes actions' }))
    await userEvent.click(page.getByRole('dialog', { name: 'bridge themes' }).getByText('Side chat'))
    await expect.element(page.getByRole('dialog', { name: 'Side chat' })).toBeVisible()
  })
})
