import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// Erik's review R6: a click on a workspace tab shows that workspace with the layout it had when he left it, and a
// workspace with no layout yet opens its last chat alone in one pane. Each workspace keeps its own layout (D1's open
// question 4).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const tab = (label: string) => page.getByRole('tab', { name: new RegExp(`^${label}(?![\\w-])`) })
const pane = (title: string) => page.getByRole('button', { name: `Maximise ${title}` })
const columns = () => page.getByRole('separator', { name: 'Resize columns' })
const composer = (title: string) => page.getByRole('region', { name: title }).getByRole('textbox')
const hideSidebar = () => page.getByRole('button', { name: 'Hide the workspace sidebar' })
const showSidebar = () => page.getByRole('button', { name: 'Show the workspace sidebar' })

let view: { unmount: () => Promise<void> } | undefined

beforeEach(async () => {
  await page.viewport(1512, 982)
})

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

describe('switching workspaces from their tabs', () => {
  it('keeps the pane sizes of a workspace when Erik switches to another tab and back', async () => {
    const { data, ui } = workspacesStates.twoPanes
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
    await expect.element(columns()).toHaveAttribute('aria-valuenow', '50')
    await userEvent.click(columns())
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    const resized = columns().element().getAttribute('aria-valuenow')
    expect(resized).not.toBe('50')
    await userEvent.click(tab('the-bridge'))
    await expect.element(pane('hono server')).toBeVisible()
    await expect.element(pane('bridge themes')).not.toBeInTheDocument()
    await userEvent.click(tab('omni-brain'))
    await expect.element(pane('bridge themes')).toBeVisible()
    await expect.element(pane('drift check')).toBeVisible()
    await expect.element(columns()).toHaveAttribute('aria-valuenow', resized)
  })

  it('keeps the top row of a rows-first split at 60 : 40 after a switch, without the drag readout', async () => {
    const { data, ui } = workspacesStates.resizedPanes
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
    await userEvent.click(tab('omni'))
    await expect.element(pane('release notes')).toBeVisible()
    await userEvent.click(tab('omni-brain'))
    await expect.element(pane('brain git')).toBeVisible()
    await expect.element(columns()).toHaveAttribute('aria-valuenow', '60')
    await expect.element(page.getByText('60 : 40')).not.toBeInTheDocument()
  })

  it('keeps a pane Erik closed closed when he switches to another tab and back', async () => {
    const { data, ui } = workspacesStates.emptiedPane
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
    await userEvent.click(page.getByRole('button', { name: 'Close pane', exact: true }))
    await expect.element(page.getByText('Empty pane', { exact: true })).not.toBeInTheDocument()
    await userEvent.click(tab('skill-evals'))
    await userEvent.click(tab('omni-brain'))
    await expect.element(pane('bridge themes')).toBeVisible()
    await expect.element(pane('brain git')).toBeVisible()
    await expect.element(page.getByText('Empty pane', { exact: true })).not.toBeInTheDocument()
  })

  it('opens a workspace with no layout on its last chat, alone in one pane', async () => {
    const { data, ui } = workspacesStates.twoPanes
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
    await userEvent.click(tab('omni'))
    await expect.element(tab('omni')).toHaveAttribute('aria-selected', 'true')
    await expect.element(pane('release notes')).toBeVisible()
    await expect.element(page.getByRole('button', { name: /^Maximise / })).toHaveLength(1)
    await expect.element(columns()).not.toBeInTheDocument()
    await expect.element(page.getByText('omni · 1 pane', { exact: true })).toBeVisible()
  })

  it('keeps a draft typed in a pane when Erik switches to another tab and back', async () => {
    const { data, ui } = workspacesStates.twoPanes
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
    await expect.element(pane('drift check')).toBeVisible()
    await userEvent.fill(composer('drift check'), 'keep this draft')
    await userEvent.click(tab('the-bridge'))
    await expect.element(pane('hono server')).toBeVisible()
    await userEvent.click(tab('omni-brain'))
    await expect.element(pane('drift check')).toBeVisible()
    await expect.element(composer('drift check')).toHaveValue('keep this draft')
  })

  it('shows the sidebar again after Erik hides it in D2 and selects the-bridge', async () => {
    const { data, ui } = workspacesStates.sideChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
    await userEvent.click(hideSidebar())
    await userEvent.click(tab('the-bridge'))
    await expect.element(pane('hono server')).toBeVisible()
    await userEvent.click(showSidebar())
    await expect.element(hideSidebar()).toBeVisible()
    await expect.element(showSidebar()).not.toBeInTheDocument()
  })

  it('opens omni-brain on a chat it kept after D20 moved bridge themes to the-bridge', async () => {
    const { data, ui } = workspacesStates.movedChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
    await userEvent.click(hideSidebar())
    await userEvent.click(tab('omni-brain'))
    await expect.element(tab('omni-brain')).toHaveAttribute('aria-selected', 'true')
    await expect.element(pane('drift check')).toBeVisible()
    await expect.element(pane('bridge themes')).not.toBeInTheDocument()
  })
})
