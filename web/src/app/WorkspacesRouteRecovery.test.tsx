import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { NotFound } from '../errors/NotFound.tsx'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// Audit W-10, on the owner's path. A route crash leaves the owner a way to another page (Go to Inbox), Retry
// used up in one boundary leaves Retry in another, and the composer's draft outlives a reload. The library's
// AppShell throws while `crash.shell` is set (the whole page, so RouteError), TerminalLines while `crash.terminal`
// is set (the shell pane) and Message while `crash.message` is set (the chat panes).
const crash = vi.hoisted(() => ({ shell: false, terminal: false, message: false }))

vi.mock('@eshelton328/component-library-1701', async (importOriginal) => {
  const real = await importOriginal<typeof import('@eshelton328/component-library-1701')>()
  return {
    ...real,
    AppShell: (props: Parameters<typeof real.AppShell>[0]) => {
      if (crash.shell) throw new Error('the page crashed on purpose')
      return real.AppShell(props)
    },
    TerminalLines: (props: Parameters<typeof real.TerminalLines>[0]) => {
      if (crash.terminal) throw new Error('the terminal crashed on purpose')
      return real.TerminalLines(props)
    },
    Message: (props: Parameters<typeof real.Message>[0]) => {
      if (crash.message) throw new Error('an entry crashed on purpose')
      return real.Message(props)
    },
  }
})

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: NotFound,
  })
  return testRender(<RouterProvider router={router} />)
}

let view: { unmount: () => Promise<void> } | undefined

beforeEach(async () => {
  await page.viewport(390, 806)
})

afterEach(async () => {
  await view?.unmount()
  view = undefined
  crash.shell = false
  crash.terminal = false
  crash.message = false
  window.sessionStorage.clear()
  resetRetries()
  resetAllStores()
  vi.restoreAllMocks()
})

describe('the Workspaces route after a crash (audit W-10)', () => {
  it('keeps Retry in a chat pane after the shell pane used up its retries', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await page.viewport(1512, 982)
    crash.terminal = true
    view = await renderAt('/workspaces?state=threePanes')
    // The shell pane crashes again on each retry; two failed retries use up its allowance.
    await page.getByRole('button', { name: 'Retry' }).click()
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect.element(page.getByRole('button', { name: 'Reload app' })).toBeVisible()
    // Now a chat pane crashes when what the owner types renders it again.
    crash.message = true
    await userEvent.type(page.getByRole('textbox').first(), 'a')
    await expect.element(page.getByRole('button', { name: 'Retry' }).first()).toBeVisible()
    expect(page.getByRole('button', { name: 'Reload app' }).elements()).toHaveLength(1)
  })
})
