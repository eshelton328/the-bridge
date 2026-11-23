import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { clearReports } from '../errors/reporter.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { setViewport } from '../lib/rendering.ts'
import { unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { type Device, devices, plan, tablet, tapArtifacts, withServer } from './artifactsLiveHelpers.ts'

// The Artifacts page's controls while its library loads (R58, ArtifactsPending.tsx), on the owner's path with a
// list read that waits: what the loading screen draws must not act on a library it has not read.
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

/** Opens Artifacts with the list read held, and waits for the loading screen. */
async function openLoading(device: Device) {
  const server = withServer([plan])
  server.answerNext('list', () => new Promise<Response>(() => undefined))
  const router = await tapArtifacts(device)
  await expect.element(page.getByRole('status', { name: 'Loading Artifacts' })).toBeInTheDocument()
  return router
}

describe('the Artifacts loading screen', () => {
  for (const device of [...devices, tablet])
    it(`draws Add a link off, so no form opens before the library is read, on ${device.name}`, async () => {
      await openLoading(device)
      await expect.element(page.getByRole('button', { name: /Add a link/ })).toBeDisabled()
    })
})
