import '../index.css'
import { type ComponentType, createElement } from 'react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { setViewport } from '../lib/rendering.ts'
import { resetRetries } from '../errors/retryGuard.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// P-10 of the error audit (d-084 level 4): each rich block of the Toolkit (rendered Markdown, code, the map, the links
// graph and every chart) sits in a BlockBoundary. When the library part throws, the block shows the inline alert and
// the rest of the page stays, with the page's heading and tabs. The library part named in `crash.part` throws.
const crash = vi.hoisted(() => ({ part: '' }))

vi.mock('@eshelton328/component-library-1701', async (importOriginal) => {
  const lib = await importOriginal<typeof import('@eshelton328/component-library-1701')>()
  // The part throws while `crash.part` names it; otherwise it renders as the library draws it.
  function failing<P extends object>(name: string, Part: ComponentType<P>) {
    return function Failing(props: P) {
      if (crash.part === name) throw new Error(`${name} crash`)
      return createElement(Part, props)
    }
  }
  return {
    ...lib,
    MarkdownView: failing('MarkdownView', lib.MarkdownView),
    CodeLines: failing('CodeLines', lib.CodeLines),
    MapGraph: failing('MapGraph', lib.MapGraph),
    HorizontalBarChart: failing('HorizontalBarChart', lib.HorizontalBarChart),
    GroupedBarChart: failing('GroupedBarChart', lib.GroupedBarChart),
    DailyBarChart: failing('DailyBarChart', lib.DailyBarChart),
  }
})

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(() => {
  crash.part = ''
  resetRetries()
  resetAllStores()
  vi.restoreAllMocks()
})

async function renderState(state: string) {
  await setViewport(1512, 982)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/toolkit?state=${state}`] }),
  })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
}

const cases = [
  { kind: 'rendered Markdown', part: 'MarkdownView', state: 'skillOpen' },
  { kind: 'code', part: 'CodeLines', state: 'hookOpen' },
  { kind: 'the map', part: 'MapGraph', state: 'toolkitMap' },
  { kind: 'the links graph', part: 'MapGraph', state: 'skillLinks' },
  { kind: 'a bar chart', part: 'HorizontalBarChart', state: 'skillActivity' },
  { kind: 'the evals chart', part: 'GroupedBarChart', state: 'skillEvals' },
  { kind: 'the daily chart', part: 'DailyBarChart', state: 'toolkitActivity' },
  { kind: 'the eval share bar', part: 'HorizontalBarChart', state: 'toolkitActivityHeadless' },
] as const

describe('Toolkit block boundaries', () => {
  it.each(cases)('keeps the page when $kind fails ($state)', async ({ part, state }) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    crash.part = part
    await renderState(state)
    await expect.element(page.getByText('This part failed to render.').first()).toBeVisible()
    await expect.element(page.getByText('This page failed to load')).not.toBeInTheDocument()
    await expect.element(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  })
})
