import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { afterRendering, setViewport } from '../lib/rendering.ts'
import { unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { chart, type Device, minutesAgo, plan, tapArtifacts, withServer } from './artifactsLiveHelpers.ts'
import { fitGaps, fitRects } from './skeletonFit.ts'

// R58 (the owner: "The skeletons on a page should match the structure of what will be loaded"): the Artifacts page
// while its library loads is the page's real layout, so nothing moves when the library comes. On the owner's path
// (the app with no URL parameters, then Artifacts from the rail, the tab bar or More), with a list read that waits,
// the test reads where the skeleton's blocks sit, lets the read answer and reads the loaded blocks: the header, the
// chips, the tools, the status line, the first group's header and its first two cards or rows each sit within 2 px
// of the skeleton's, in top and height.
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

const devices: readonly Device[] = [
  { name: 'the phone', size: [390, 844], item: 'artifact row' },
  { name: 'the tablet', size: [744, 1133], item: 'artifact card' },
  { name: 'the desktop', size: [1512, 982], item: 'artifact card' },
]

/** The list the held read answers with: two found since the last look, so the first group has two cards. */
const list = () =>
  new Response(
    JSON.stringify({ checkedAt: minutesAgo(0), lastSeenAt: minutesAgo(60), partial: false, artifacts: [chart, plan] }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )

describe('the Artifacts skeleton (R58)', () => {
  for (const device of devices)
    it(`draws the page's real layout while the library loads, and the loaded blocks land within 2 px, on ${device.name}`, async () => {
      const server = withServer([chart, plan])
      let release: (() => void) | undefined
      const held = new Promise<void>((resolve) => {
        release = resolve
      })
      server.answerNext('list', () => held.then(list))
      await tapArtifacts(device)
      await expect.element(page.getByRole('status', { name: 'Loading Artifacts' })).toBeInTheDocument()
      await expect.element(page.getByRole('heading', { name: 'Artifacts', level: 1 })).toBeVisible()
      await afterRendering()
      const skeleton = fitRects()
      // The skeleton has each block the loaded page has: no generic lines in its place.
      for (const block of ['header', 'chips', 'tools', 'group', 'items.0', 'items.1'])
        expect(skeleton.has(block)).toBe(true)
      release?.()
      await expect.element(page.getByText('Sample chart').first()).toBeVisible()
      await expect.element(page.getByRole('status', { name: 'Loading Artifacts' })).not.toBeInTheDocument()
      await afterRendering()
      expect(fitGaps(skeleton, fitRects())).toEqual([])
      expect(getReports()).toEqual([])
    })
})
