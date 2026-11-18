import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { threePanes } from './states/threePanes.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

describe('the workbench beside the sidebar', () => {
  it('keeps the sidebar when Erik focuses a shell pane, and its toggle hides and shows it', async () => {
    // The desktop frame's size, so that the backdrop fits the window.
    await page.viewport(1512, 982)
    view = await testRender(<WorkspacesScreen data={threePanes.data} ui={threePanes.ui} viewport="desktop" />)
    const hide = page.getByRole('button', { name: 'Hide the workspace sidebar' })
    const show = page.getByRole('button', { name: 'Show the workspace sidebar' })
    await expect.element(hide).toBeInTheDocument()
    await userEvent.click(page.getByRole('log', { name: 'brain git' }))
    await expect.element(page.getByRole('region', { name: 'brain git' })).toHaveAttribute('aria-current', 'true')
    await expect.element(hide).toBeInTheDocument()
    await userEvent.click(hide)
    await expect.element(hide).not.toBeInTheDocument()
    await userEvent.click(show)
    await expect.element(hide).toBeInTheDocument()
    await expect.element(show).not.toBeInTheDocument()
  })
})
