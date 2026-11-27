import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { RouteError } from '../errors/RouteError.tsx'
import { clearReports, getReports } from '../errors/reporter.ts'
import { type FakeProjectsServer, fakeProjectsServer } from '../lib/fakeProjectsServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The live Projects home (pages/projects/liveProjects.ts) on the owner's path: Projects from the rail on the desktop
// or the tab bar on the phone, with the contract-checked fake of the server's routes (lib/fakeProjectsServer.ts).
// Every name and purpose is made up.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

answerLateServerReads()

afterEach(async () => {
  await unmountRendered()
  vi.unstubAllGlobals()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

const alpha = {
  slug: 'alpha',
  name: 'Alpha',
  purpose: 'A made-up project with a compass icon.',
  icon: 'compass',
  pinned: false,
}
const beta = { slug: 'beta', name: 'Beta', purpose: 'A made-up project with no icon.', icon: null, pinned: false }

/** The fake with `projects`, as the page's fetch. */
function withServer(projects: readonly unknown[] = [alpha, beta]): FakeProjectsServer {
  const server = fakeProjectsServer(projects)
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const answer = server.handle(new URL(url, window.location.origin).pathname, init)
      return answer === undefined ? Promise.reject(new TypeError(`no stub for ${url}`)) : Promise.resolve(answer)
    }),
  )
  return server
}

const devices = [
  { name: 'the desktop', size: [1512, 982] },
  { name: 'the phone', size: [390, 844] },
] as const

type Device = (typeof devices)[number]

/** Opens the app at the device's size on another page's sample data and taps Projects, as the owner does. */
async function tapProjects(device: Device) {
  await setViewport(device.size[0], device.size[1])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/artifacts?source=fixtures'] }),
    defaultErrorComponent: RouteError,
  })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  await userEvent.click(page.getByRole('button', { name: /^Projects/ }))
  await expect.poll(() => router.state.location.pathname).toBe('/projects')
  expect(router.state.location.searchStr).toBe('')
}

/** Opens /projects in a new router, as a reload does. */
async function reload() {
  await unmountRendered()
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/projects'] }) })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
}

const shown = () =>
  [...document.querySelectorAll('[data-figma^="project card · "]')].map((el) =>
    el.getAttribute('data-figma')?.replace('project card · ', ''),
  )
const card = (name: string) => document.querySelector(`[data-figma="project card · ${name}"]`)

describe('the live Projects home', () => {
  for (const device of devices) {
    it(`shows one card per project in the server's order, with its icon, name and purpose (R2), on ${device.name}`, async () => {
      const server = withServer()
      await tapProjects(device)
      await expect.poll(shown).toEqual(['Alpha', 'Beta'])
      await expect.element(page.getByText('2', { exact: true })).toBeVisible()
      // Alpha draws its library icon; Beta, with none, its first letter.
      expect(card('Alpha')?.querySelector('[data-figma="project tile · Alpha"] svg')).not.toBeNull()
      expect(card('Beta')?.querySelector('[data-figma="project tile · Beta"]')?.textContent).toBe('B')
      await expect.element(page.getByText('A made-up project with a compass icon.')).toBeVisible()
      await expect.element(page.getByText('A made-up project with no icon.')).toBeVisible()
      // No sample project shows.
      await expect.element(page.getByText('Pinpoint')).not.toBeInTheDocument()
      expect(server.calls('list')).toHaveLength(1)
      expect(getReports()).toEqual([])
    })

    it(`moves a card first when the owner pins it, and keeps it first after a reload (R3), on ${device.name}`, async () => {
      const server = withServer()
      await tapProjects(device)
      await expect.poll(shown).toEqual(['Alpha', 'Beta'])
      await userEvent.click(page.getByRole('button', { name: 'Actions for Beta' }))
      await userEvent.click(page.getByRole('menuitem', { name: 'Pin to top' }))
      await expect.poll(shown).toEqual(['Beta', 'Alpha'])
      expect(server.calls('pin').map((c) => [c.path, c.body])).toEqual([['/api/projects/beta/pin', { pinned: true }]])
      expect(server.calls('list')).toHaveLength(2)
      await expect.element(page.getByText('Pinned')).toBeVisible()
      await reload()
      await expect.poll(shown).toEqual(['Beta', 'Alpha'])
      await expect.element(page.getByText('Pinned')).toBeVisible()
      // Unpin puts it back by name.
      await userEvent.click(page.getByRole('button', { name: 'Actions for Beta' }))
      await userEvent.click(page.getByRole('menuitem', { name: 'Unpin' }))
      await expect.poll(shown).toEqual(['Alpha', 'Beta'])
      expect(getReports()).toEqual([])
    })
  }

  it('says in one line that a list read missed, with no sample project, and reports its kind and status', async () => {
    const server = withServer()
    server.answerNext(
      'list',
      () =>
        new Response(JSON.stringify({ error: { kind: 'internal', message: 'Failed', requestId: 'r-500' } }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        }),
    )
    await tapProjects(devices[0])
    await expect
      .element(page.getByRole('status').filter({ hasText: 'Projects not read — the server answered 500' }))
      .toBeVisible()
    expect(shown()).toEqual([])
    expect(getReports().map((r) => r.error.message)).toEqual(['A projects request missed: list internal 500'])
  })

  it('keeps the order and says so when a pin misses', async () => {
    const server = withServer()
    await tapProjects(devices[0])
    await expect.poll(shown).toEqual(['Alpha', 'Beta'])
    server.answerNext('pin', () => Promise.reject(new TypeError('Load failed')))
    await userEvent.click(page.getByRole('button', { name: 'Actions for Beta' }))
    await userEvent.click(page.getByRole('menuitem', { name: 'Pin to top' }))
    await expect
      .element(page.getByRole('status').filter({ hasText: 'Not pinned — the server did not answer' }))
      .toBeVisible()
    expect(shown()).toEqual(['Alpha', 'Beta'])
    expect(getReports()).toEqual([])
  })
})
