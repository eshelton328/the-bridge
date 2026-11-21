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
// is set (the shell pane) and Composer while `crash.composer` is set (the chat panes). The transcript entries are
// memoised (review R28), so a keystroke renders a pane's composer and not its entries.
const crash = vi.hoisted(() => ({ shell: false, terminal: false, composer: false }))

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
    Composer: (props: Parameters<typeof real.Composer>[0]) => {
      if (crash.composer) throw new Error('the composer crashed on purpose')
      return real.Composer(props)
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
  crash.composer = false
  window.sessionStorage.clear()
  resetRetries()
  resetAllStores()
  vi.restoreAllMocks()
})

describe('the Workspaces route after a crash (audit W-10)', () => {
  it('offers Go to Inbox when the page crashes in an open chat, and the tap reaches the Inbox and its tab bar', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    view = await renderAt('/workspaces?source=fixtures')
    await page.getByText('bridge themes', { exact: true }).click()
    const composer = page.getByRole('textbox')
    await userEvent.type(composer, 'half a thought')
    crash.shell = true
    await userEvent.type(composer, '!')
    await expect.element(page.getByRole('heading', { name: 'This page failed to load' })).toBeVisible()
    crash.shell = false
    await page.getByRole('button', { name: 'Go to Inbox' }).click()
    await expect.element(page.getByRole('heading', { name: 'This page failed to load' })).not.toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: 'Home' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Workspaces' })).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'Inbox', exact: true })).toBeVisible()
  })

  it('keeps Retry in a chat pane after the shell pane used up its retries', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await page.viewport(1512, 982)
    crash.terminal = true
    view = await renderAt('/workspaces?state=threePanes')
    // The shell pane crashes again on each retry; two failed retries use up its allowance.
    await page.getByRole('button', { name: 'Retry' }).click()
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect.element(page.getByRole('button', { name: 'Reload app' })).toBeVisible()
    // Now a chat pane crashes when what the owner types renders its composer again.
    crash.composer = true
    await userEvent.type(page.getByRole('textbox').first(), 'a')
    await expect.element(page.getByRole('button', { name: 'Retry' }).first()).toBeVisible()
    expect(page.getByRole('button', { name: 'Reload app' }).elements()).toHaveLength(1)
  })

  it('brings the draft back after a reload', async () => {
    view = await renderAt('/workspaces?source=fixtures')
    await page.getByText('bridge themes', { exact: true }).click()
    await userEvent.type(page.getByRole('textbox'), 'keep this')
    await view.unmount()
    // A reload: memory starts empty, and sessionStorage keeps what the tab saved.
    const keys = Array.from({ length: window.sessionStorage.length }, (_, i) => window.sessionStorage.key(i) ?? '')
    const tab = keys.map((key) => [key, window.sessionStorage.getItem(key) ?? ''] as const)
    resetAllStores()
    for (const [key, value] of tab) window.sessionStorage.setItem(key, value)
    view = await renderAt('/workspaces?source=fixtures')
    await page.getByText('bridge themes', { exact: true }).click()
    await expect.element(page.getByRole('textbox')).toHaveValue('keep this')
  })

  it('keeps the keystroke that crashed the page for the reload', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    view = await renderAt('/workspaces?source=fixtures')
    await page.getByText('bridge themes', { exact: true }).click()
    await userEvent.type(page.getByRole('textbox'), 'almost')
    crash.shell = true
    await userEvent.type(page.getByRole('textbox'), '!')
    await expect.element(page.getByRole('heading', { name: 'This page failed to load' })).toBeVisible()
    crash.shell = false
    await view.unmount()
    const saved = window.sessionStorage.getItem('bridge/workspaces/drafts') ?? ''
    expect(saved).toContain('almost!')
  })

  it('saves only the composer text by chat id and the state, and drops a draft once it is sent', async () => {
    view = await renderAt('/workspaces?source=fixtures')
    await page.getByText('bridge themes', { exact: true }).click()
    await userEvent.type(page.getByRole('textbox'), 'send me')
    const saved: unknown = JSON.parse(window.sessionStorage.getItem('bridge/workspaces/drafts') ?? 'null')
    expect(saved).toEqual({ state: null, drafts: { 'bridge-themes': 'send me' } })
    expect(Object.keys(saved ?? {}).sort()).toEqual(['drafts', 'state'])
    await page.getByRole('button', { name: 'Send' }).click()
    await expect.element(page.getByRole('textbox')).toHaveValue('')
    expect(window.sessionStorage.getItem('bridge/workspaces/drafts')).toBeNull()
  })
})
