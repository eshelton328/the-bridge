// The result of each prompt send that carries the page's send ID, so the page
// can read it after a reload: in memory only, for sendResultMs, with no text.
// A second send with the same ID to the same chat is refused, so a page that
// sends again after a lost answer types nothing twice.
import { type ChatId, type SendId, type SendResult, sendResultMs } from '@bridge/contract'
import type { FilePromptOutcome } from './uploads.ts'

/** The most results kept; past it the oldest goes. */
const maxResults = 500

export type SendResults = {
  /** Records the send as pending; `duplicate` when this chat had a send with this ID in the kept time. */
  begin(chat: ChatId, send: SendId): 'new' | 'duplicate'
  finish(chat: ChatId, send: SendId, result: SendResult): void
  get(chat: ChatId, send: SendId): SendResult | undefined
}

/** A send's result from its outcome: `notSent` only for an outcome that comes before any text is typed. */
export function resultOf(outcome: FilePromptOutcome): SendResult {
  switch (outcome) {
    case 'sent':
    case 'notSubmitted':
      return outcome
    case 'notFound':
    case 'shell':
    case 'needsYou':
    case 'noAttachments':
    case 'badAttachment':
      return 'notSent'
    // Before the send, or after it when the text stayed or a dialog stayed open: the chat may hold the text.
    case 'inputNotEmpty':
    case 'inputUnreadable':
      return 'unknown'
  }
}

export function createSendResults(now: () => number = Date.now): SendResults {
  // Insertion order is age order, as each key is added once.
  const kept = new Map<string, { result: SendResult; at: number }>()
  const keyOf = (chat: ChatId, send: SendId) => `${chat} ${send}`
  const prune = () => {
    for (const [key, entry] of kept) {
      if (now() - entry.at < sendResultMs && kept.size <= maxResults) break
      kept.delete(key)
    }
  }
  return {
    begin(chat, send) {
      prune()
      const key = keyOf(chat, send)
      if (kept.has(key)) return 'duplicate'
      kept.set(key, { result: 'pending', at: now() })
      prune()
      return 'new'
    },
    finish(chat, send, result) {
      const entry = kept.get(keyOf(chat, send))
      if (entry !== undefined) entry.result = result
    },
    get(chat, send) {
      prune()
      return kept.get(keyOf(chat, send))?.result
    },
  }
}
