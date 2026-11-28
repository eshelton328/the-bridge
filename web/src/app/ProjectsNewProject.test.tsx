import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { RouteError } from '../errors/RouteError.tsx'
import { type FakeProjectsServer, fakeProjectsServer } from '../lib/fakeProjectsServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// New project (NCC-162) on the owner's path: New project on the home opens the form (a dialog on the desktop, a full
// screen on an iPad or a phone), and the Name's folder line comes from the fake's slug route
// (lib/fakeProjectsServer.ts). Every name and purpose is made up.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

answerLateServerReads()

afterEach(async () => {
  await unmountRendered()
  vi.unstubAllGlobals()
  resetAllStores()
  await setViewport(1512, 982)
})

const alpha = { slug: 'alpha', name: 'Alpha', purpose: 'A made-up project.', icon: null, pinned: false }

function withServer(): FakeProjectsServer {
  const server = fakeProjectsServer([alpha])
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, origin)
      const answer = server.handle(url.pathname + url.search, init)
      return answer === undefined ? Promise.reject(new TypeError(`no stub for ${url.href}`)) : Promise.resolve(answer)
    }),
  )
  return server
}

/** Opens `path` at `width` × `height` and taps New project on the home. */
async function openForm(width: number, height: number, path = '/projects') {
  await setViewport(width, height)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultErrorComponent: RouteError,
  })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  await userEvent.click(page.getByRole('button', { name: 'New project' }))
  return router
}

const name = () => page.getByRole('textbox', { name: 'Name' })
const create = () => page.getByRole('button', { name: 'Create project' })

describe('New project', () => {
  for (const [device, width, height] of [
    ['the desktop', 1440, 900],
    ['the tablet', 1024, 1366],
    ['the phone', 390, 844],
  ] as const) {
    it(`opens the form and checks the folder of the name on ${device}`, async () => {
      withServer()
      await openForm(width, height)
      if (width === 1440) await expect.element(page.getByRole('dialog', { name: 'New project' })).toBeVisible()
      else {
        await expect.element(page.getByRole('heading', { level: 1, name: 'New project' })).toBeVisible()
        await expect.element(page.getByRole('button', { name: 'Back to Projects' })).toBeVisible()
        expect(page.getByRole('dialog').query()).toBeNull()
      }
      await userEvent.fill(name(), 'Alpha')
      await expect.element(page.getByText('Folder: alpha is taken by another project')).toBeVisible()
      await expect.element(create()).toBeDisabled()
      await userEvent.fill(name(), '!!!')
      await expect.element(page.getByText('This name gives no folder name')).toBeVisible()
      await expect.element(create()).toBeDisabled()
      await userEvent.fill(name(), 'Gamma Ray')
      await expect.element(page.getByText('Folder: gamma-ray')).toBeVisible()
      await expect.element(create()).toBeEnabled()
    })
  }

  it('counts only the newest folder answer when answers cross', async () => {
    const server = withServer()
    await openForm(1440, 900)
    let late: (() => void) | undefined
    server.answerNext(
      'slug',
      () =>
        new Promise<Response>((resolve) => {
          late = () => {
            resolve(new Response(JSON.stringify({ slug: 'gam', free: true }), { status: 200 }))
          }
        }),
    )
    await userEvent.fill(name(), 'Gam')
    await userEvent.fill(name(), 'Alpha')
    await expect.element(page.getByText('Folder: alpha is taken by another project')).toBeVisible()
    late?.()
    await expect.element(page.getByText('Folder: gam', { exact: true })).not.toBeInTheDocument()
    await expect.element(page.getByText('Folder: alpha is taken by another project')).toBeVisible()
    await expect.element(create()).toBeDisabled()
  })

  it('opens on the sample projects, where no folder read goes out', async () => {
    const server = withServer()
    await openForm(1440, 900, '/projects?source=fixtures')
    await userEvent.fill(name(), 'Gamma')
    await userEvent.click(create())
    await expect.element(page.getByRole('dialog', { name: 'New project' })).toBeVisible()
    expect(server.calls('slug')).toEqual([])
  })
})
