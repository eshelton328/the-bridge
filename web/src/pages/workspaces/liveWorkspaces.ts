// The live source of the Workspaces page (`?source=live`, development
// only): the workspaces and chats from the-bridge server, through the Hono
// RPC client and the query client, mapped to the page's view model and put
// on its home state. The other parts of the page stay the home's in slice 1.
// When the server is down or answers an error, the page keeps the home's
// mock data, the status bar says why, and the dev ErrorTray lists it.
import { type ChatSummary, splitId, type WorkspaceSummary, WorkspacesResponse } from '@bridge/contract'
import type { QueryClient } from '@tanstack/react-query'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import { queryClient } from '../../lib/queryClient.ts'
import type { ScreenState } from '../../lib/screenState.ts'
import type { SidebarChat, Workspace, WorkspacesData, WorkspacesUi } from './types.ts'

type WorkspacesScreenState = ScreenState<WorkspacesData, WorkspacesUi>

const modelFamilies = { opus: 'Opus', sonnet: 'Sonnet', haiku: 'Haiku', fable: 'Fable' } as const
const isFamily = (name: string): name is keyof typeof modelFamilies => Object.hasOwn(modelFamilies, name)

/** A model ID as the app writes it: "claude-opus-5-5" is "Opus 5.5", "gpt-5.5" is "GPT-5.5". */
export function modelLabel(model: string): string {
  const claude = /^claude-([a-z]+)-(\d+)-(\d+)/.exec(model)
  const family = claude?.[1]
  if (claude && family !== undefined && isFamily(family))
    return `${modelFamilies[family]} ${claude[2] ?? ''}.${claude[3] ?? ''}`
  if (model.startsWith('gpt-')) return `GPT-${model.slice(4)}`
  return model
}

const kindLabels = { claude: 'Claude Code', codex: 'Codex', shell: 'shell' } as const

function statusOf(chat: ChatSummary): SidebarChat['status'] {
  switch (chat.status) {
    case 'working':
      // A shell, or a chat that another chat started, runs on its own.
      return chat.kind === 'shell' || chat.parent
        ? { label: 'Running', tone: 'running' }
        : { label: 'Working', tone: 'working' }
    case 'needsYou':
      return { label: 'Needs you', tone: 'needsYou' }
    case 'idle':
      return { label: 'Idle', tone: 'idle' }
    case 'done':
      return { label: 'Done', tone: 'done' }
    case 'unknown':
      return { label: 'Unknown', tone: 'idle' }
  }
}

function sidebarChat(chat: ChatSummary, titles: ReadonlyMap<string, string>): SidebarChat {
  const model =
    chat.kind === 'shell'
      ? chat.model === null
        ? 'shell'
        : `shell · ${chat.model}`
      : chat.model === null
        ? kindLabels[chat.kind]
        : modelLabel(chat.model)
  const parent = chat.parent
  return {
    id: splitId(chat.id).local,
    kind: chat.kind,
    title: chat.title,
    model,
    ...(chat.contextUsed === null ? {} : { context: Math.round(chat.contextUsed * 100) }),
    status: statusOf(chat),
    ...(parent ? { level: 1 as const } : {}),
    ...(parent?.relation === 'fork'
      ? { mark: { kind: 'fork' as const, label: `Fork of ${titles.get(parent.id) ?? 'a chat'}` } }
      : {}),
  }
}

function workspaceOf(summary: WorkspaceSummary): Workspace {
  const titles = new Map(summary.chats.map((c) => [String(c.id), c.title]))
  return {
    id: splitId(summary.id).local,
    label: summary.label,
    count: summary.chats.filter((c) => !c.parent).length,
    needsYou: summary.chats.some((c) => c.status === 'needsYou'),
    chats: summary.chats.map((c) => sidebarChat(c, titles)),
  }
}

/**
 * The mapper: the server's workspaces as the page's tabs and sidebar chats. An ID keeps its local part only, as
 * slice 1 has one machine. A tab counts the chats no other chat started.
 */
export function toWorkspaces(response: WorkspacesResponse): Workspace[] {
  return response.workspaces.map(workspaceOf)
}

/** Reads the workspaces through the RPC client and checks them against the contract. */
async function fetchWorkspaces(): Promise<WorkspacesResponse> {
  const res = await api.api.workspaces.$get()
  const body: unknown = await res.json()
  if (!res.ok) {
    const reason = typeof body === 'object' && body !== null && 'error' in body ? String(body.error) : ''
    throw new Error(`the server answered ${String(res.status)}${reason ? `: ${reason}` : ''}`)
  }
  return WorkspacesResponse.parse(body)
}

export type LiveDeps = { readonly client: QueryClient; readonly fetch: () => Promise<WorkspacesResponse> }

/** `state` with the server's workspaces, or with its own data and a notice in the status bar when they cannot be read. */
export async function withLiveWorkspaces(
  state: WorkspacesScreenState,
  { client, fetch }: LiveDeps = { client: queryClient, fetch: fetchWorkspaces },
): Promise<WorkspacesScreenState> {
  try {
    const response = await client.query({ queryKey: ['workspaces'], queryFn: fetch, staleTime: 0 })
    const workspaces = toWorkspaces(response)
    return { ...state, data: { ...state.data, workspaces, current: workspaces[0]?.id ?? state.data.current } }
  } catch (thrown) {
    report(thrown, 'handler')
    const why = thrown instanceof Error ? thrown.message : String(thrown)
    const alert = `Live data is not available (${why}); the page shows mock data.`
    return { ...state, data: { ...state.data, status: { ...state.data.status, alert } } }
  }
}
