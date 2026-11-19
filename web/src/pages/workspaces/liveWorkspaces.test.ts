// The mapper test (d-113): domain data in, the view model out, compared
// with the page's state files, so the mocks are the backend's expected output.
import { WorkspacesResponse } from '@bridge/contract'
import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it } from 'vitest'
import { clearReports, getReports } from '../../errors/reporter.ts'
import { workspacesHome } from './home.ts'
import { modelLabel, toWorkspaces, withLiveWorkspaces } from './liveWorkspaces.ts'
import { sideChat } from './states/sideChat.ts'
import { workbench } from './states/workbench.ts'

const chat = (local: string, rest: Record<string, unknown>) => ({
  id: `mac-mini/${local}`,
  contextUsed: null,
  parent: null,
  ...rest,
})

// The workspaces of D1 and D2 as the server would send them.
const response = WorkspacesResponse.parse({
  machine: 'mac-mini',
  workspaces: [
    {
      id: 'mac-mini/omni-brain',
      label: 'omni-brain',
      chats: [
        chat('bridge-themes', {
          kind: 'claude',
          title: 'bridge themes',
          model: 'claude-opus-5-5',
          contextUsed: 0.42,
          status: 'working',
        }),
        chat('theme-tokens', {
          kind: 'claude',
          title: 'theme tokens',
          model: 'claude-opus-5-5',
          contextUsed: 0.26,
          status: 'working',
          parent: { id: 'mac-mini/bridge-themes', relation: 'subtask' },
        }),
        chat('drift-check', {
          kind: 'codex',
          title: 'drift check',
          model: 'gpt-5.5',
          contextUsed: 0.23,
          status: 'needsYou',
        }),
        chat('brain-git', { kind: 'shell', title: 'brain git', model: 'zsh', status: 'idle' }),
      ],
    },
    {
      id: 'mac-mini/the-bridge',
      label: 'the-bridge',
      chats: [
        chat('hono-server', {
          kind: 'claude',
          title: 'hono server',
          model: 'claude-sonnet-5-5',
          contextUsed: 0.78,
          status: 'needsYou',
        }),
        chat('dev-server', { kind: 'shell', title: 'dev server', model: 'pnpm dev', status: 'working' }),
      ],
    },
    {
      id: 'mac-mini/omni',
      label: 'omni',
      chats: [
        chat('release-notes', {
          kind: 'codex',
          title: 'release notes',
          model: 'gpt-5.5',
          contextUsed: 0.18,
          status: 'done',
        }),
      ],
    },
    {
      id: 'mac-mini/skill-evals',
      label: 'skill-evals',
      chats: [
        chat('eval-round', {
          kind: 'claude',
          title: 'eval round',
          model: 'claude-opus-5-5',
          contextUsed: 0.31,
          status: 'idle',
        }),
      ],
    },
  ],
})

afterEach(() => {
  clearReports()
})

describe('the live mapper', () => {
  it("gives D1's workspace tabs (states/workbench.ts)", () => {
    const tabs = toWorkspaces(response).map(({ id, label, count, needsYou }) => ({ id, label, count, needsYou }))
    expect(tabs).toEqual(workbench.data.workspaces)
  })

  it("gives D2's sidebar chats (states/sideChat.ts) for each workspace D2 draws open", () => {
    const mapped = toWorkspaces(response)
    for (const workspace of sideChat.data.workspaces) {
      // Figma draws skill-evals closed, so D2 does not know its chats.
      if (workspace.id === 'skill-evals') continue
      expect(mapped.find((w) => w.id === workspace.id)?.chats).toEqual(workspace.chats)
    }
  })

  it('marks a fork with the title of the chat it came from', () => {
    const fork = WorkspacesResponse.parse({
      machine: 'mac-mini',
      workspaces: [
        {
          id: 'mac-mini/w1',
          label: 'w1',
          chats: [
            chat('a', { kind: 'claude', title: 'bridge themes', model: null, status: 'idle' }),
            chat('b', {
              kind: 'claude',
              title: 'copy',
              model: null,
              status: 'unknown',
              parent: { id: 'mac-mini/a', relation: 'fork' },
            }),
          ],
        },
      ],
    })
    expect(toWorkspaces(fork)[0]?.chats?.[1]).toEqual({
      id: 'b',
      kind: 'claude',
      title: 'copy',
      model: 'Claude Code',
      status: { label: 'Unknown', tone: 'idle' },
      level: 1,
      mark: { kind: 'fork', label: 'Fork of bridge themes' },
    })
    expect(toWorkspaces(fork)[0]?.count).toBe(1)
  })

  it('writes model IDs as the app does', () => {
    expect(modelLabel('claude-opus-5-5')).toBe('Opus 5.5')
    expect(modelLabel('claude-fable-5-2[1m]')).toBe('Fable 5.2')
    expect(modelLabel('gpt-5.5-codex')).toBe('GPT-5.5-codex')
    expect(modelLabel('o9')).toBe('o9')
  })
})

describe('withLiveWorkspaces', () => {
  const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

  it("puts the server's workspaces on the home state and shows the first one", async () => {
    const state = await withLiveWorkspaces(workspacesHome, { client: client(), fetch: () => Promise.resolve(response) })
    expect(state.data.workspaces).toEqual(toWorkspaces(response))
    expect(state.data.current).toBe('omni-brain')
    expect(state.data.panes).toBe(workspacesHome.data.panes)
    expect(state.ui).toBe(workspacesHome.ui)
  })

  it('keeps the mock data and gives the notice in the status bar and the error tray when the server is down', async () => {
    const down = () => Promise.reject(new Error('the server answered 502: herdr socket: ENOENT'))
    const state = await withLiveWorkspaces(workspacesHome, { client: client(), fetch: down })
    expect(state.data.workspaces).toBe(workspacesHome.data.workspaces)
    expect(state.data.status.alert).toBe(
      'Live data is not available (the server answered 502: herdr socket: ENOENT); the page shows mock data.',
    )
    expect(getReports().map((r) => r.error.message)).toEqual([state.data.status.alert])
  })

  it('keeps the mock data when the server sends a reply the contract refuses', async () => {
    const odd = () => Promise.resolve(WorkspacesResponse.parse({ machine: 'x', workspaces: 'none' }))
    const state = await withLiveWorkspaces(workspacesHome, { client: client(), fetch: odd })
    expect(state.data.workspaces).toBe(workspacesHome.data.workspaces)
    expect(state.data.status.alert).toMatch(/^Live data is not available/)
    expect(getReports().map((r) => r.error.message)).toEqual([state.data.status.alert])
  })
})
