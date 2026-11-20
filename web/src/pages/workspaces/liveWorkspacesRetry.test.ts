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
  const json = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
  // The list read answers 503 once, then the list; the workspace's layout read (since #284) answers its one pane.
  const listReads = vi
    .fn<() => Response>()
    .mockReturnValueOnce(new Response('<html><body>Service Unavailable</body></html>', { status: 503 }))
    .mockImplementation(() => json(response))
  vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const path = new URL(url, window.location.origin).pathname
    if (path === '/api/workspaces') return Promise.resolve(listReads())
    const chat = 'mac-mini/bridge-themes'
    const chats = response.workspaces[0]?.chats ?? []
    return Promise.resolve(
      json({
        workspace: 'mac-mini/omni-brain',
        tabs: [
          {
            id: 'mac-mini/omni-brain:t1',
            label: 'main',
            active: true,
            root: { kind: 'pane', chat },
            focusedChat: chat,
            chats,
          },
        ],
      }),
    )
  })
  const state = await withLiveWorkspaces(workspacesHome)
  expect(listReads).toHaveBeenCalledTimes(2)
  // Live data: no "Live data is not available" alert and no live-unavailable notice.
  expect(state.data.status.alert).toBeUndefined()
  expect(state.data.liveNotice).toBeUndefined()
  expect(state.data.workspaces).toEqual(toWorkspaces(response))
})
