import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { resetRetries } from '../errors/retryGuard.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// Audit P-1, on the owner's path: open /workspaces (its sample home, ?source=fixtures), open a chat, and one transcript entry throws. The entry list shows
// its inline fallback, and the chat's header, its composer and the rest of the page stay. Every message entry renders
// the library's Message, which throws while `crash.message` is set.
const crash = vi.hoisted(() => ({ message: false }))

vi.mock('@eshelton328/component-library-1701', async (importOriginal) => {
  const real = await importOriginal<typeof import('@eshelton328/component-library-1701')>()
  return {
    ...real,
    Message: (props: Parameters<typeof real.Message>[0]) => {
      if (crash.message) throw new Error('an entry crashed on purpose')
      return real.Message(props)
    },
  }
})

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  return testRender(<RouterProvider router={router} />)
}

const entryFallback = () => page.getByRole('alert').filter({ hasText: 'This part failed to render.' })
const routeFallback = () => page.getByRole('heading', { name: 'This page failed to load' })

let view: { unmount: () => Promise<void> } | undefined

beforeEach(async () => {
  await page.viewport(1512, 982)
})

afterEach(async () => {
  await view?.unmount()
  view = undefined
  crash.message = false
  resetRetries()
  resetAllStores()
  vi.restoreAllMocks()
})

describe('the Workspaces route when a transcript entry throws', () => {
  it('keeps the chat header, its composer, the rail and the sidebar on the desktop', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    crash.message = true
    view = await renderAt('/workspaces?source=fixtures')
    const chat = page.getByRole('region', { name: 'bridge themes', exact: true })
    await expect.element(entryFallback()).toBeVisible()
    await expect.element(routeFallback()).not.toBeInTheDocument()
    await expect.element(chat.getByRole('textbox')).toBeVisible()
    await expect.element(page.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect.element(page.getByText('drift check', { exact: true })).toBeVisible()
  })

  it('keeps the chat a tapped row opens on the phone, and its back button returns to the list', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await page.viewport(390, 806)
    view = await renderAt('/workspaces?source=fixtures')
    await expect.element(page.getByRole('button', { name: 'Home' })).toBeVisible()
    crash.message = true
    await page.getByText('bridge themes', { exact: true }).click()
    await expect.element(entryFallback()).toBeVisible()
    await expect.element(routeFallback()).not.toBeInTheDocument()
    await expect.element(page.getByRole('textbox')).toBeVisible()
    crash.message = false
    await page.getByRole('button', { name: 'Workspaces', exact: true }).click()
    await expect.element(page.getByRole('button', { name: 'Home' })).toBeVisible()
    await expect.element(page.getByText('drift check', { exact: true })).toBeVisible()
  })
})
