import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// The chat moved to the-bridge on the phone (M22): its header names the-bridge, a toast over the composer offers Undo,
// which closes it, and Back returns to the list, where bridge themes and theme tokens head the-bridge (D20).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('a chat moved to another workspace on the phone', () => {
  it('names the new workspace and shows the toast over the composer', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneMovedChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect.element(page.getByText('the-bridge', { exact: true })).toBeVisible()
    const toast = page.getByRole('status')
    await expect.element(toast.getByText('Moved to the-bridge')).toBeVisible()
    const box = page.getByRole('textbox')
    await expect.element(box).toHaveValue('')
    expect(toast.element().getBoundingClientRect().bottom).toBeLessThanOrEqual(
      box.element().getBoundingClientRect().top,
    )
  })

  it('closes the toast with Undo', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneMovedChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('status').getByRole('button', { name: 'Undo' }))
    await expect.element(page.getByText('Moved to the-bridge')).not.toBeInTheDocument()
  })

  it('goes back to the list, where the chat heads the-bridge', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneMovedChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'Back to Workspaces' }))
    const header = page.getByRole('button', { name: /the-bridge/i, expanded: true })
    await expect.element(header).toBeVisible()
    const rows = document.getElementById(header.element().getAttribute('aria-controls') ?? '')
    expect(rows?.textContent).toContain('bridge themes')
    expect(rows?.textContent).toContain('theme tokens')
  })
})
