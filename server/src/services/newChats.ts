// Starts a Claude chat for the page (slice W3) and keeps each start's answer by the page's create ID, in memory
// for sendResultMs, so a page that sends again after a lost answer starts no second chat. A project start (NCC-129)
// takes only a slug of the brain's project list.
import {
  type ChatId,
  type ForkChatRequest,
  type SendId,
  sendResultMs,
  type StartChatRequest,
  type StartChatResponse,
} from '@bridge/contract'
import { ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError, ForkOutcome } from './agentPort.ts'
import { noProjects, type ProjectFault, type Projects } from './projects.ts'

/** The most starts kept; past it the oldest goes. */
const maxStarts = 500

/** A start's answer: the new chat, and whether an earlier start with this create ID made it; or why nothing started. */
export type StartAnswer =
  | { readonly started: StartChatResponse; readonly again: boolean }
  | 'notFound'
  | 'folderNotAllowed'
  | 'nameTaken'
  | 'noSession'
  | 'duplicateCreate'

export type NewChats = {
  /** A project start's list fault is a `ProjectFault`; a slug that the list does not have is `notFound`. */
  start(request: StartChatRequest): Promise<Result<StartAnswer, AgentPortError | ProjectFault>>
  /** Forks a Claude chat beside it (`row` when no direction is given), with the same create ID rules as a start. */
  fork(chat: ChatId, request: ForkChatRequest): Promise<Result<StartAnswer, AgentPortError>>
}

export function createNewChats(
  agents: AgentPort,
  now: () => number = Date.now,
  projects: Pick<Projects, 'list'> = noProjects,
): NewChats {
  // Insertion order is age order, as each ID is added once.
  const kept = new Map<SendId, { answer: StartChatResponse | 'pending'; readonly at: number }>()
  const prune = () => {
    for (const [id, entry] of kept) {
      if (now() - entry.at < sendResultMs && kept.size <= maxStarts) break
      kept.delete(id)
    }
  }
  const once = async (
    createId: SendId | undefined,
    run: () => Promise<Result<ForkOutcome, AgentPortError>>,
  ): Promise<Result<StartAnswer, AgentPortError>> => {
    prune()
    const first = createId === undefined ? undefined : kept.get(createId)
    if (first !== undefined)
      return ok(first.answer === 'pending' ? 'duplicateCreate' : { started: first.answer, again: true })
    const entry: { answer: StartChatResponse | 'pending'; readonly at: number } = { answer: 'pending', at: now() }
    if (createId !== undefined) kept.set(createId, entry)
    const started = await run()
    // A herdr failure may have made a pane, so its ID stays pending; a refusal made nothing, so its ID is free again.
    if (!started.ok) return started
    if (typeof started.value === 'string') {
      if (createId !== undefined) kept.delete(createId)
      return ok(started.value)
    }
    entry.answer = started.value
    return ok({ started: started.value, again: false })
  }
  return {
    async start({ createId, ...request }) {
      const { place } = request
      if (place.in === 'project') {
        const listed = await projects.list()
        if (!listed.ok) return listed
        if (!listed.value.projects.some((p) => p.slug === place.project)) return ok('notFound')
      }
      return once(createId, () => agents.startChat(request))
    },
    fork: (chat, { createId, name, direction }) =>
      once(createId, () => agents.forkChat(chat, { name, direction: direction ?? 'row' })),
  }
}
