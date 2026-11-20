import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { resetRetries } from '../../errors/retryGuard.ts'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// Audit W-4: a throw in one AppShell slot shows the slot's fallback, and the
// rail, the tab bar and the other slots stay on screen. The blocks throw
// while `crash` names them.
const crash = vi.hoisted(() => ({ mainChat: false, list: false }))

vi.mock('./blocks/MainChat.tsx', async (importOriginal) => {
  const real = await importOriginal<typeof import('./blocks/MainChat.tsx')>()
  return {
    MainChat: (props: Parameters<typeof real.MainChat>[0]) => {
      if (crash.mainChat) throw new Error('the chat crashed on purpose')
      return real.MainChat(props)
    },
  }
})

vi.mock('./blocks/PhoneWorkspaceList.tsx', async (importOriginal) => {
  const real = await importOriginal<typeof import('./blocks/PhoneWorkspaceList.tsx')>()
  return {
    PhoneWorkspaceList: (props: Parameters<typeof real.PhoneWorkspaceList>[0]) => {
      if (crash.list) throw new Error('the list crashed on purpose')
      return real.PhoneWorkspaceList(props)
    },
  }
})

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const fallback = () => page.getByRole('heading', { name: 'This part of the page failed to render' })

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  crash.mainChat = false
  crash.list = false
  resetRetries()
  vi.restoreAllMocks()
  await page.viewport(1512, 982)
})

describe('the Workspaces AppShell slots', () => {
  it('keeps the rail and the workspace list when the chat in the detail slot throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await page.viewport(1512, 982)
    crash.mainChat = true
    const { data, ui } = workspacesStates.phoneHome
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
    await expect.element(fallback()).toBeVisible()
    await expect.element(page.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Hide the workspace sidebar' })).toBeVisible()
    await expect.element(page.getByText('release notes', { exact: true })).toBeVisible()
    crash.mainChat = false
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect.element(fallback()).not.toBeInTheDocument()
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
  })

  it('keeps the tab bar when the phone list throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await page.viewport(390, 806)
    crash.list = true
    const { data, ui } = workspacesStates.phoneHome
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await expect.element(fallback()).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Home' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Projects' })).toBeVisible()
  })
})
