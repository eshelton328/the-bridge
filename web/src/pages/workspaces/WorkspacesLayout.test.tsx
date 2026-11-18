import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// The screen takes its layout from its width, not from the `viewport` prop,
// which only applies until the first measure (M1).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const tabBar = () => page.getByRole('button', { name: 'Home' })
const edit = () => page.getByRole('button', { name: 'Edit' })

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('the Workspaces screen by width', () => {
  it('draws the phone home, with the tab bar and no rail, at a phone width', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneHome
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
    await expect.element(edit()).toBeVisible()
    await expect.element(tabBar()).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'release notes actions' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Hide the workspace sidebar' })).not.toBeInTheDocument()
  })

  it('draws the sidebar and the chat alone, with no tab bar, at the desktop width', async () => {
    await page.viewport(1512, 982)
    const { data, ui } = workspacesStates.phoneHome
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await expect.element(page.getByRole('button', { name: 'Hide the workspace sidebar' })).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect.element(edit()).not.toBeInTheDocument()
    await expect.element(tabBar()).not.toBeInTheDocument()
  })

  it('keeps the desktop layout at a phone width for a state without the phone labels (D1 to D21)', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.renameChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await expect.element(page.getByRole('button', { name: 'Undo the rename' })).toBeInTheDocument()
    await expect.element(tabBar()).not.toBeInTheDocument()
  })

  it('keeps a closed workspace closed when the width changes the layout', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneHome
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const releaseNotes = () => page.getByText('release notes', { exact: true })
    await expect.element(releaseNotes()).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: /^omni\s*1$/ }))
    await expect.element(releaseNotes()).not.toBeInTheDocument()
    await page.viewport(1512, 982)
    await expect.element(page.getByRole('button', { name: 'Hide the workspace sidebar' })).toBeVisible()
    await expect.element(releaseNotes()).not.toBeInTheDocument()
  })

  it("opens the More drawer from the phone tab bar's More, and Toolkit goes to its page", async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneHome
    const pages: string[] = []
    view = await testRender(
      <WorkspacesScreen
        data={data}
        ui={ui}
        viewport="phone"
        onNavigate={(next) => {
          pages.push(next)
        }}
      />,
    )
    // The Inbox tab's name has its count.
    await userEvent.click(page.getByRole('button', { name: /^Inbox/ }))
    expect(pages).toEqual(['inbox'])
    await userEvent.click(page.getByRole('button', { name: 'More' }))
    const drawer = page.getByRole('dialog', { name: 'More' })
    await expect.element(drawer.getByText('Agents, skills, workflows, rules and hooks')).toBeVisible()
    await userEvent.click(drawer.getByRole('button', { name: /Toolkit/ }))
    expect(pages).toEqual(['inbox', 'toolkit'])
    await expect.element(drawer).not.toBeInTheDocument()
  })
})
