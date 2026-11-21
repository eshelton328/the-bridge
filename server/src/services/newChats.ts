// Starts a Claude chat for the page (slice W3) and keeps each start's answer by the page's create ID, in memory
// for sendResultMs, so a page that sends again after a lost answer starts no second chat.
import { type SendId, sendResultMs, type StartChatRequest, type StartChatResponse } from '@bridge/contract'
import { ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError } from './agentPort.ts'

/** The most starts kept; past it the oldest goes. */
const maxStarts = 500

/** A start's answer: the new chat, and whether an earlier start with this create ID made it; or why nothing started. */
type StartAnswer =
  | { readonly started: StartChatResponse; readonly again: boolean }
  | 'notFound'
  | 'folderNotAllowed'
  | 'nameTaken'
  | 'duplicateCreate'

export type NewChats = { start(request: StartChatRequest): Promise<Result<StartAnswer, AgentPortError>> }

export function createNewChats(agents: AgentPort, now: () => number = Date.now): NewChats {
  // Insertion order is age order, as each ID is added once.
  const kept = new Map<SendId, { answer: StartChatResponse | 'pending'; readonly at: number }>()
  const prune = () => {
    for (const [id, entry] of kept) {
      if (now() - entry.at < sendResultMs && kept.size <= maxStarts) break
      kept.delete(id)
    }
  }
  return {
    async start({ createId, ...request }) {
      prune()
      const first = createId === undefined ? undefined : kept.get(createId)
      if (first !== undefined)
        return ok(first.answer === 'pending' ? 'duplicateCreate' : { started: first.answer, again: true })
      const entry: { answer: StartChatResponse | 'pending'; readonly at: number } = { answer: 'pending', at: now() }
      if (createId !== undefined) kept.set(createId, entry)
      const started = await agents.startChat(request)
      // A herdr failure may have made a pane, so its ID stays pending; a refusal made nothing, so its ID is free again.
      if (!started.ok) return started
      if (typeof started.value === 'string') {
        if (createId !== undefined) kept.delete(createId)
        return ok(started.value)
      }
      entry.answer = started.value
      return ok({ started: started.value, again: false })
    },
  }
}
