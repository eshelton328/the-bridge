import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { errorAnswer } from '../lib/fakeTranscriptServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { open, withServer } from './architectureLiveHelpers.ts'

// A live project's Architecture tab (f-008 increment two, R9, R10, R14, R15; part one) with the contract-checked
// fakes only: the tab (`?tab=architecture`) shows the scope chips, System and then each repository, and the shown
// scope (`?scope=`) with its title and its drawn diagram (the caption, and lists of its parts and arrows); a
// repository shows its Stack. A scope with no diagram says so, and a read that misses shows its line.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

answerLateServerReads()

afterEach(async () => {
  await unmountRendered()
  vi.unstubAllGlobals()
  queryClient.clear()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

const chips = () => page.getByRole('radiogroup', { name: 'Diagram scope' })

describe("A project's Architecture tab (increment two, part one)", () => {
  for (const [width, height] of [
    [1440, 900],
    [1024, 1366],
    [390, 844],
  ] as const) {
    it(`shows each scope and a repository's drawn diagram at ${String(width)} px`, async () => {
      const projects = withServer()
      const router = await open('/projects/alpha', width, height)
      await userEvent.click(page.getByRole('tab', { name: 'Architecture' }))
      await expect.element(page.getByText('How the system works')).toBeVisible()
      await expect.element(page.getByText('No diagram yet')).toBeVisible()
      expect(router.state.location.search).toEqual({ tab: 'architecture' })
      await userEvent.click(chips().getByRole('radio', { name: 'example-app' }))
      await expect.element(page.getByText('How example-app works')).toBeVisible()
      expect(router.state.location.search).toEqual({ tab: 'architecture', scope: 'example-app' })
      await expect.element(page.getByText('Component view from main at aaaaaaa, 2026-11-28')).toBeVisible()
      // The drawing is hidden from screen readers; its lists name each part and arrow.
      const figure = page.getByRole('figure', { name: 'How example-app works' })
      await expect.element(figure).toBeVisible()
      await expect
        .element(
          figure.getByRole('list', { name: 'Parts of How example-app works' }).getByText('@example/web, web, our code'),
        )
        .toBeInTheDocument()
      await expect
        .element(
          figure
            .getByRole('list', { name: 'Arrows of How example-app works' })
            .getByText('@example/web → example-app: depends on'),
        )
        .toBeInTheDocument()
      await expect.element(page.getByRole('region', { name: 'Runtime' }).getByText('react')).toBeVisible()
      await expect.element(page.getByRole('region', { name: 'Build' }).getByText('vite')).toBeVisible()
      expect(projects.calls('diagram').map((r) => r.path)).toEqual([
        '/api/projects/alpha/architecture/@system',
        '/api/projects/alpha/architecture/example-app',
      ])
      expect(getReports()).toEqual([])
    })
  }

  it('opens on the scope in its address, as a reload does, with no chats read, and reads no diagram on the Overview', async () => {
    const projects = withServer()
    await open('/projects/alpha?tab=architecture&scope=example-app')
    await expect.element(page.getByText('How example-app works')).toBeVisible()
    expect(projects.calls('architecture')).toHaveLength(1)
    expect(projects.calls('chats')).toEqual([])
    await userEvent.click(page.getByRole('tab', { name: 'Overview' }))
    await expect.element(page.getByRole('tab', { name: 'Overview', selected: true })).toBeVisible()
    expect(projects.calls('architecture')).toHaveLength(1)
  })

  it('shows one line for a list read that missed, and reports it', async () => {
    const projects = withServer()
    projects.answerNext('architecture', () =>
      errorAnswer({ kind: 'internal', message: 'Internal error', requestId: 'r-500' }, 500),
    )
    await open('/projects/alpha?tab=architecture')
    await expect.element(page.getByRole('status').getByText(/^Architecture not read/)).toBeVisible()
    expect(getReports().map((r) => r.error.message)).toEqual(['A projects request missed: architecture internal 500'])
  })
})
