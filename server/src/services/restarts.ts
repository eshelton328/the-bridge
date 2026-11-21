// Model restarts (slice W10): a restart ends a chat and starts it again in
// its pane, so no other input may reach that chat while it runs, and a
// restart may not start while other input to the chat is in progress.
// Both locks are per chat and in memory. `routes/chats.ts` enters each
// other POST to a chat here before it reads the body, and answers 409
// `restarting` when a restart of that chat runs.
import type { ChatId, ModelAlias } from '@bridge/contract'
import { ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError, RestartOutcome } from './agentPort.ts'

export type Restarts = {
  /**
   * Marks one request to `chat` as in progress and gives the function that ends it; `undefined` while a restart of
   * the chat runs, and then the request must not reach the chat.
   */
  readonly enter: (chat: ChatId) => (() => void) | undefined
  /**
   * Restarts `chat` with `model` when `confirm` names it (`notConfirmed` otherwise, with no call to the port), and
   * holds the chat's lock until the port answers; `restarting` while another restart of it runs, and `busy` while
   * another request to it is in progress.
   */
  readonly restart: (
    chat: ChatId,
    model: ModelAlias,
    confirm: ChatId,
  ) => Promise<Result<RestartOutcome | 'notConfirmed' | 'restarting' | 'busy', AgentPortError>>
}

export function createRestarts(agents: AgentPort): Restarts {
  const locked = new Set<ChatId>()
  const inProgress = new Map<ChatId, number>()
  return {
    enter(chat) {
      if (locked.has(chat)) return undefined
      inProgress.set(chat, (inProgress.get(chat) ?? 0) + 1)
      let ended = false
      return () => {
        if (ended) return
        ended = true
        const left = (inProgress.get(chat) ?? 1) - 1
        if (left === 0) inProgress.delete(chat)
        else inProgress.set(chat, left)
      }
    },
    async restart(chat, model, confirm) {
      if (confirm !== chat) return ok('notConfirmed')
      if (locked.has(chat)) return ok('restarting')
      if (inProgress.has(chat)) return ok('busy')
      locked.add(chat)
      try {
        return await agents.restartModel(chat, model)
      } finally {
        locked.delete(chat)
      }
    },
  }
}
