import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { resetRetries } from '../errors/retryGuard.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// Audit W-4, on the owner's path: open /workspaces (its sample home, ?source=fixtures), then the open chat throws. On the desktop the detail slot shows
// its fallback and the rail and the sidebar stay; on the phone the owner taps a chat in the list, it throws, and the
// fallback's Back to the list returns to the list and the tab bar.
// The chat's composer throws while `crash.composer` is set: the chat renders it, the list and the sidebar do not.
const crash = vi.hoisted(() => ({ composer: false }))

vi.mock('@eshelton328/component-library-1701', async (importOriginal) => {
  const real = await importOriginal<typeof import('@eshelton328/component-library-1701')>()
  return {
    ...real,
    Composer: (props: Parameters<typeof real.Composer>[0]) => {
      if (crash.composer) throw new Error('the chat crashed on purpose')
      return real.Composer(props)
    },
  }
})

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  return testRender(<RouterProvider router={router} />)
}

const fallback = () => page.getByRole('heading', { name: 'This part of the page failed to render' })

let view: { unmount: () => Promise<void> } | undefined

beforeEach(async () => {
  await page.viewport(1512, 982)
})

afterEach(async () => {
  await view?.unmount()
  view = undefined
  crash.composer = false
  resetRetries()
  resetAllStores()
  vi.restoreAllMocks()
})

describe('the Workspaces route when the open chat throws', () => {
  it('keeps the rail and the sidebar on the desktop, and Retry brings the chat back', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    view = await renderAt('/workspaces?source=fixtures')
    const chat = () => page.getByRole('region', { name: 'bridge themes', exact: true })
    await expect.element(chat()).toBeVisible()
    crash.composer = true
    // What the owner types renders the chat again, which now throws.
    await userEvent.type(chat().getByRole('textbox'), 'a')
    await expect.element(fallback()).toBeVisible()
    await expect.element(page.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Hide the workspace sidebar' })).toBeVisible()
    await expect.element(page.getByText('drift check', { exact: true })).toBeVisible()
    crash.composer = false
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect.element(fallback()).not.toBeInTheDocument()
    await expect.element(chat()).toBeVisible()
  })

  it('goes back to the list and the tab bar on the phone when a chat tapped in the list throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await page.viewport(390, 806)
    view = await renderAt('/workspaces?source=fixtures')
    await expect.element(page.getByRole('button', { name: 'Home' })).toBeVisible()
    crash.composer = true
    await page.getByText('bridge themes', { exact: true }).click()
    await expect.element(fallback()).toBeVisible()
    crash.composer = false
    await page.getByRole('button', { name: 'Back to the list' }).click()
    await expect.element(fallback()).not.toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: 'Home' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Projects' })).toBeVisible()
    await expect.element(page.getByText('drift check', { exact: true })).toBeVisible()
  })
})
