// Model restarts (slice W10): a restart ends a chat and starts it again in
// its pane, so no other input may reach that chat while it runs. The
// lock is per chat and in memory; `routes/chats.ts` refuses each POST to
// a chat that has one (409 `restarting`).
import type { ChatId, ModelAlias } from '@bridge/contract'
import { ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError, RestartOutcome } from './agentPort.ts'

export type Restarts = {
  /** Whether a restart of `chat` runs now. */
  readonly running: (chat: ChatId) => boolean
  /**
   * Restarts `chat` with `model` when `confirm` names it (`notConfirmed` otherwise, with no call to the port), and
   * holds the chat's lock until the port answers; `restarting` while another restart of it runs.
   */
  readonly restart: (
    chat: ChatId,
    model: ModelAlias,
    confirm: ChatId,
  ) => Promise<Result<RestartOutcome | 'notConfirmed' | 'restarting', AgentPortError>>
}

export function createRestarts(agents: AgentPort): Restarts {
  const locked = new Set<ChatId>()
  return {
    running: (chat) => locked.has(chat),
    async restart(chat, model, confirm) {
      if (confirm !== chat) return ok('notConfirmed')
      if (locked.has(chat)) return ok('restarting')
      locked.add(chat)
      try {
        return await agents.restartModel(chat, model)
      } finally {
        locked.delete(chat)
      }
    },
  }
}
