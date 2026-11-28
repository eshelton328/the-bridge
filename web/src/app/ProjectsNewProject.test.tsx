import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { RouteError } from '../errors/RouteError.tsx'
import { type FakeProjectsServer, fakeProjectsServer } from '../lib/fakeProjectsServer.ts'
import { errorAnswer } from '../lib/fakeTranscriptServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// New project (NCC-162) on the owner's path: New project on the home opens the form (a dialog on the desktop, a full
// screen on an iPad or a phone), the Name's folder line comes from the fake's slug route, and Create project posts the
// form and opens the new project's page (lib/fakeProjectsServer.ts). Every name and purpose is made up.
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

    it(`picks an icon and opens the new project on ${device}`, async () => {
      const server = withServer()
      const router = await openForm(width, height)
      await userEvent.fill(name(), 'Gamma Ray')
      await expect.element(page.getByText('Folder: gamma-ray')).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: 'Choose picture' }))
      await expect.element(page.getByRole('group', { name: 'Project icons' })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: 'compass' }))
      await expect.element(page.getByRole('button', { name: 'compass' })).toHaveAttribute('aria-pressed', 'true')
      await userEvent.fill(page.getByRole('textbox', { name: 'Description' }), 'A made-up new project.')
      await userEvent.click(create())
      await expect.poll(() => router.state.location.pathname).toBe('/projects/gamma-ray')
      await expect.element(page.getByRole('heading', { level: 1, name: 'Gamma Ray' })).toBeVisible()
      expect(server.calls('create').map((c) => c.body)).toEqual([
        { name: 'Gamma Ray', purpose: 'A made-up new project.', icon: 'compass' },
      ])
      expect(server.calls('list').length).toBeGreaterThan(1)
    })

    it(`keeps the form and its values with one line when the brain is busy on ${device}`, async () => {
      const server = withServer()
      const router = await openForm(width, height)
      await userEvent.fill(name(), 'Gamma')
      await expect.element(page.getByText('Folder: gamma')).toBeVisible()
      server.answerNext('create', () =>
        errorAnswer({ kind: 'brain-busy', message: 'another git command runs', requestId: 'r-503' }, 503),
      )
      await userEvent.click(create())
      await expect
        .element(page.getByRole('status').filter({ hasText: 'Not created — the brain is busy; try again in a moment' }))
        .toBeVisible()
      await expect.element(name()).toHaveValue('Gamma')
      expect(router.state.location.pathname).toBe('/projects')
    })
  }

  it('drops the answer of a create from a form that closed', async () => {
    const server = withServer()
    const router = await openForm(1440, 900)
    await userEvent.fill(name(), 'Gamma')
    await expect.element(page.getByText('Folder: gamma')).toBeVisible()
    let late: (() => void) | undefined
    server.answerNext(
      'create',
      () =>
        new Promise<Response>((resolve) => {
          late = () => {
            resolve(
              new Response(JSON.stringify({ project: { ...alpha, slug: 'gamma', name: 'Gamma' } }), { status: 201 }),
            )
          }
        }),
    )
    await userEvent.click(create())
    await userEvent.click(page.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(page.getByRole('button', { name: 'New project' }))
    await userEvent.fill(name(), 'Delta')
    await expect.element(page.getByText('Folder: delta')).toBeVisible()
    late?.()
    await expect.element(page.getByText('Folder: delta')).toBeVisible()
    await expect.element(name()).toHaveValue('Delta')
    expect(router.state.location.pathname).toBe('/projects')
  })

  it('reads the folder again when a create gets no answer', async () => {
    const server = withServer()
    await openForm(1440, 900)
    await userEvent.fill(name(), 'Gamma')
    await expect.element(page.getByText('Folder: gamma')).toBeVisible()
    server.answerNext('create', () => Promise.reject(new TypeError('the connection dropped')))
    await userEvent.click(create())
    await expect
      .element(
        page.getByRole('status').filter({ hasText: 'Not known if created — the folder line under Name is read again' }),
      )
      .toBeVisible()
    await expect.poll(() => server.calls('slug').length).toBe(2)
    await expect.element(name()).toHaveValue('Gamma')
  })

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

  it('opens on the sample projects, where Create project sends nothing', async () => {
    const server = withServer()
    await openForm(1440, 900, '/projects?source=fixtures')
    await userEvent.fill(name(), 'Gamma')
    await userEvent.click(create())
    await expect.element(page.getByRole('dialog', { name: 'New project' })).toBeVisible()
    expect(server.calls('slug')).toEqual([])
    expect(server.calls('create')).toEqual([])
  })
})
