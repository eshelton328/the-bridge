import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// The side chat on the tablet (T2): the chat fills the screen as on the phone, with no tab bar and no rail, and the
// side chat opens in a sheet over it. Figma draws no scrim under T2's sheet (105:1914), so the chat above it keeps its
// full colour.
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

  it('draws no scrim, and a press on the chat above the sheet closes it and stays in the chat', async () => {
    // T2's frame size.
    await page.viewport(756, 1158)
    const { data, ui } = workspacesStates.tabletSideChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="tablet" />)
    const sheet = page.getByRole('dialog', { name: 'Side chat' })
    await expect.element(sheet).toBeVisible()
    expect(document.querySelectorAll('[data-scope="dialog"][data-part="backdrop"]')).toHaveLength(0)
    // The open sheet hides the chat behind it from assistive technology, so its roles need `includeHidden`.
    const title = page.getByRole('heading', { name: 'bridge themes', includeHidden: true })
    await expect.element(title).toBeVisible()
    await expect
      .element(page.getByText('Brainstorm layouts for the-bridge that go beyond a sidebar and a chat.'))
      .toBeVisible()
    // The sheet is open once the focus is in its message box and it has slid up; a press before then can come before
    // the sheet listens for presses outside it.
    await expect.element(sheet.getByRole('textbox', { name: 'Ask a side question' })).toHaveFocus()
    await Promise.all(document.getAnimations().map((animation) => animation.finished))
    // The sheet stays modal: the press closes it and does not reach the chat's Back under it.
    // The open sheet blocks the page's pointer events, so the press needs `force`.
    await userEvent.click(page.getByRole('button', { name: data.phone.back, includeHidden: true }), { force: true })
    await expect.element(sheet).not.toBeInTheDocument()
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Home' })).not.toBeInTheDocument()
  })
})
