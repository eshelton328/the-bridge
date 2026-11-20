import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { ClientErrorReport } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { installClientErrorSender } from '../errors/clientErrorSender.ts'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { clearReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { stubLiveServer } from './liveServerStub.ts'

// The client error sender on the owner's path (d-115, d-117): the app as
// main.ts starts it, opened at / with no URL parameters, and a tap on
// Workspaces. The stubbed server's workspace list breaks the contract, so
// the page crashes into RouteError, and the sender posts that one report.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const server = stubLiveServer({ workspaces: { machine: 'mac-mini', workspaces: 'not a list' } })

let view: { unmount: () => Promise<void> } | undefined
let removeSender: (() => void) | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  removeSender?.()
  removeSender = undefined
  resetRetries()
  queryClient.clear()
  clearReports()
  resetAllStores()
  server.clientErrors.length = 0
  await setViewport(1512, 982)
})

describe('client error reports on the owner path (d-115)', () => {
  it('posts one report of a Workspaces crash, which the contract reads, with the path only', async () => {
    removeSender = installClientErrorSender()
    await setViewport(390, 844)
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
      defaultErrorComponent: RouteError,
    })
    view = await testRender(
      <>
        <RouterProvider router={router} />
        <ErrorTray />
      </>,
      rootErrorOptions,
    )
    await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
    await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
    expect(router.state.location.searchStr).toBe('')
    await expect.element(page.getByText('This page failed to load')).toBeVisible()
    await expect.poll(() => server.clientErrors.length).toBe(1)
    const sent = ClientErrorReport.parse(JSON.parse(server.clientErrors[0] ?? ''))
    expect(sent).toMatchObject({ source: 'reactRoot', name: 'ZodError', message: 'invalid_type' })
    expect(sent.route).toBe(window.location.pathname)
    expect(sent.route).not.toMatch(/[?#]/)
    // No second post comes for the same crash.
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(server.clientErrors).toHaveLength(1)
  })
})
