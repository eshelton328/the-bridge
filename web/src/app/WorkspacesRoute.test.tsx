import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// Through the real route: the Workspaces page keeps what Erik changed in its view in the page store, so the page
// shows it again after he visits another page.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  return testRender(<RouterProvider router={router} />)
}

const columns = () => page.getByRole('separator', { name: 'Resize columns' })
const tab = (label: string) => page.getByRole('tab', { name: new RegExp(`^${label}(?![\\w-])`) })
const pane = (title: string) => page.getByRole('button', { name: `Maximise ${title}` })

let view: { unmount: () => Promise<void> } | undefined

beforeEach(async () => {
  await page.viewport(1512, 982)
})

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
})

describe('the Workspaces route', () => {
  it('keeps a resized column split at its size when the page unmounts and mounts again', async () => {
    view = await renderAt('/workspaces?state=twoPanes')
    await expect.element(columns()).toHaveAttribute('aria-valuenow', '50')
    await userEvent.click(columns())
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    const resized = columns().element().getAttribute('aria-valuenow')
    expect(resized).not.toBe('50')
    await view.unmount()
    view = await renderAt('/workspaces?state=twoPanes')
    await expect.element(columns()).toHaveAttribute('aria-valuenow', resized)
  })

  it('keeps a draft typed in a pane when the page unmounts and mounts again', async () => {
    view = await renderAt('/workspaces?state=twoPanes')
    const draft = () => page.getByRole('region', { name: 'drift check' }).getByRole('textbox')
    await userEvent.fill(draft(), 'keep this draft')
    await view.unmount()
    view = await renderAt('/workspaces?state=twoPanes')
    await expect.element(draft()).toHaveValue('keep this draft')
  })

  it('keeps each draft with its chat when the sidebar switches the chat shown alone', async () => {
    view = await renderAt('/workspaces?state=forkedChat')
    const composer = (chat: string) => page.getByRole('region', { name: chat, exact: true }).getByRole('textbox')
    const open = (chat: string) => userEvent.click(page.getByRole('button', { name: chat, exact: true }))
    await userEvent.fill(composer('bridge themes · fork'), 'fork draft')
    await open('bridge themes')
    await expect.element(composer('bridge themes')).not.toHaveValue('fork draft')
    await userEvent.fill(composer('bridge themes'), 'original draft')
    await open('bridge themes · fork')
    await expect.element(composer('bridge themes · fork')).toHaveValue('fork draft')
    await open('bridge themes')
    await expect.element(composer('bridge themes')).toHaveValue('original draft')
  })

  // R6: each workspace keeps its own layout in the page store, so a tab switch and a page visit both keep it.
  it('keeps each workspace and its pane sizes across a tab switch and a page visit', async () => {
    view = await renderAt('/workspaces?state=twoPanes')
    await userEvent.click(columns())
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    const resized = columns().element().getAttribute('aria-valuenow')
    expect(resized).not.toBe('50')
    await userEvent.click(tab('the-bridge'))
    await expect.element(pane('hono server')).toBeVisible()
    await view.unmount()
    view = await renderAt('/workspaces?state=twoPanes')
    await expect.element(tab('the-bridge')).toHaveAttribute('aria-selected', 'true')
    await expect.element(pane('hono server')).toBeVisible()
    await userEvent.click(tab('omni-brain'))
    await expect.element(pane('drift check')).toBeVisible()
    await expect.element(columns()).toHaveAttribute('aria-valuenow', resized)
  })

  it('opens a workspace with no layout on its last chat, alone in one pane', async () => {
    view = await renderAt('/workspaces?state=twoPanes')
    await userEvent.click(tab('omni'))
    await expect.element(pane('release notes')).toBeVisible()
    await expect.element(page.getByRole('button', { name: /^Maximise / })).toHaveLength(1)
    await expect.element(columns()).not.toBeInTheDocument()
  })
})
