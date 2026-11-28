import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearReports, getReports } from '../errors/reporter.ts'
import { errorAnswer } from '../lib/fakeTranscriptServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { open, withServer } from './architectureLiveHelpers.ts'

// What a live project's page reads for its Architecture tab (f-008 increment two, R9; part one's reads) with the
// contract-checked fakes only: `?tab=architecture` reads the scopes and the shown scope's diagram (`?scope=`, else the
// first scope; a scope the project does not have shows the first), and no chats; the Overview reads neither; a list
// read that misses is reported. Part one's view (`ProjectArchitectureLive.test.tsx`) checks what the tab shows.
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

const diagrams = (projects: ReturnType<typeof withServer>) => projects.calls('diagram').map((r) => r.path)

describe("A live project's Architecture reads (increment two, part one)", () => {
  it("reads the scopes and the first scope's diagram on ?tab=architecture, and no chats", async () => {
    const projects = withServer()
    await open('/projects/alpha?tab=architecture')
    await expect.poll(() => diagrams(projects)).toEqual(['/api/projects/alpha/architecture/@system'])
    expect(projects.calls('architecture')).toHaveLength(1)
    expect(projects.calls('chats')).toEqual([])
    expect(getReports()).toEqual([])
  })

  it('reads the diagram of the scope in the address, and the first scope for one the project does not have', async () => {
    const projects = withServer()
    await open('/projects/alpha?tab=architecture&scope=example-app')
    await expect.poll(() => diagrams(projects)).toEqual(['/api/projects/alpha/architecture/example-app'])
    await unmountRendered()
    const other = withServer()
    await open('/projects/alpha?tab=architecture&scope=gone-repo')
    await expect.poll(() => diagrams(other)).toEqual(['/api/projects/alpha/architecture/@system'])
  })

  it('reads no scope or diagram on the Overview', async () => {
    const projects = withServer()
    await open('/projects/alpha')
    await expect.poll(() => projects.calls('chats').length).toBeGreaterThan(0)
    expect(projects.calls('architecture')).toEqual([])
    expect(projects.calls('diagram')).toEqual([])
  })

  it('reports a list read that missed, and reads no diagram', async () => {
    const projects = withServer()
    projects.answerNext('architecture', () =>
      errorAnswer({ kind: 'internal', message: 'Internal error', requestId: 'r-500' }, 500),
    )
    await open('/projects/alpha?tab=architecture')
    await expect
      .poll(() => getReports().map((r) => r.error.message))
      .toEqual(['A projects request missed: architecture internal 500'])
    expect(projects.calls('diagram')).toEqual([])
  })
})
