// A live read that the server answers 503 is tried again (audit W-1 with W-7): fetchWorkspaces throws an error
// with the status, and the app query client's shouldRetry retries a 5xx. This file runs the page's default
// dependencies, the app query client and the real fetchWorkspaces, with only the global fetch stubbed.
import { WorkspacesResponse } from '@bridge/contract'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { clearReports } from '../../errors/reporter.ts'
import { queryClient } from '../../lib/queryClient.ts'
import { workspacesHome } from './home.ts'
import { toWorkspaces, withLiveWorkspaces } from './liveWorkspaces.ts'

const response = WorkspacesResponse.parse({
  machine: 'mac-mini',
  workspaces: [
    {
      id: 'mac-mini/omni-brain',
      label: 'omni-brain',
      chats: [
        {
          id: 'mac-mini/bridge-themes',
          kind: 'claude',
          title: 'bridge themes',
          model: 'claude-opus-5-5',
          contextUsed: 0.42,
          status: 'working',
          parent: null,
        },
      ],
    },
  ],
})

const defaults = queryClient.getDefaultOptions()

beforeAll(() => {
  // The app's retry rule, with no wait between tries.
  queryClient.setDefaultOptions({ ...defaults, queries: { ...defaults.queries, retryDelay: 0 } })
})

afterAll(() => {
  queryClient.setDefaultOptions(defaults)
})

afterEach(() => {
  queryClient.clear()
  clearReports()
  vi.unstubAllGlobals()
})

it('tries a live read that the server answers 503 again, and shows live data when the next try works', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response('<html><body>Service Unavailable</body></html>', { status: 503 }))
    .mockResolvedValue(
      new Response(JSON.stringify(response), { status: 200, headers: { 'content-type': 'application/json' } }),
    )
  vi.stubGlobal('fetch', fetchMock)
  const state = await withLiveWorkspaces(workspacesHome)
  expect(fetchMock).toHaveBeenCalledTimes(2)
  // The home's own status bar, with no "Live data is not available" alert.
  expect(state.data.status).toBe(workspacesHome.data.status)
  expect(state.data.workspaces).toEqual(toWorkspaces(response))
})
