import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// The menu that + opens on the phone (M15): New chat and New workspace.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

const { data, ui } = workspacesStates.phoneAddMenu
const closed = { ...ui, addMenuOpen: false }

describe('the menu that + opens on the phone', () => {
  it('shows New chat and New workspace under +, which draws border.active', async () => {
    await page.viewport(390, 806)
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await expect.element(page.getByRole('menuitem', { name: 'New chat' })).toBeVisible()
    await expect.element(page.getByRole('menuitem', { name: 'New workspace' })).toBeVisible()
    await expect
      .element(page.getByRole('button', { name: 'New chat or workspace' }))
      .toHaveAttribute('aria-expanded', 'true')
  })

  it('opens from +', async () => {
    await page.viewport(390, 806)
    view = await testRender(<WorkspacesScreen data={data} ui={closed} viewport="phone" />)
    await expect.element(page.getByRole('menuitem', { name: 'New chat' })).not.toBeInTheDocument()
    await userEvent.click(page.getByRole('button', { name: 'New chat or workspace' }))
    await expect.element(page.getByRole('menuitem', { name: 'New workspace' })).toBeVisible()
  })

  it('opens New chat with the current workspace chosen', async () => {
    await page.viewport(390, 806)
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('menuitem', { name: 'New chat' }))
    await expect.element(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: /omni-brain/ })).toBeVisible()
  })

  it('keeps the current workspace chosen in New chat when the window widens', async () => {
    await page.viewport(390, 806)
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('menuitem', { name: 'New chat' }))
    await expect.element(page.getByRole('button', { name: /: omni-brain$/ })).toBeVisible()
    await page.viewport(1512, 982)
    const dialog = page.getByRole('dialog', { name: data.newChat.title })
    await expect.element(dialog).toBeVisible()
    await expect.element(dialog.getByRole('button', { name: /: omni-brain$/ })).toBeVisible()
    await expect.element(dialog.getByRole('button', { name: /: the-bridge$/ })).not.toBeInTheDocument()
  })

  it('adds a workspace and opens its name as a field in edit mode', async () => {
    await page.viewport(390, 806)
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('menuitem', { name: 'New workspace' }))
    await expect.element(page.getByRole('menuitem', { name: 'New workspace' })).not.toBeInTheDocument()
    await expect.element(page.getByRole('searchbox', { name: 'Rename new workspace' })).toHaveValue('new workspace')
    await expect.element(page.getByRole('button', { name: 'Done' })).toBeVisible()
  })
})
