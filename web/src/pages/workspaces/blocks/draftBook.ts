// The composer drafts of the page's chats by chat id, outside React state
// (review R28): a keystroke tells only its chat's composers, so typing never
// renders the page, a header or a transcript. A pane that unmounts keeps its
// draft here. `onChange` gets every draft after each change (the page's save).
import { useCallback, useSyncExternalStore } from 'react'

/** The drafts of the page's chats; one object for the page's life, passed down as a prop. */
export type DraftBook = {
  /** The chat's draft; undefined when the owner has typed nothing in it. */
  readonly get: (chat: string) => string | undefined
  /** Sets the chat's draft as the owner types. */
  readonly set: (chat: string, text: string) => void
  /** After a send went through: empties the chat's draft only if it still holds `sent` (or none). */
  readonly clear: (chat: string, sent: string) => void
  /** Calls `listener` after each change of the chat's draft; the result stops it. */
  readonly subscribe: (chat: string, listener: () => void) => () => void
}

export function createDraftBook(
  initial: Readonly<Record<string, string>> | undefined,
  onChange?: (drafts: Readonly<Record<string, string>>) => void,
): DraftBook {
  let drafts: Readonly<Record<string, string>> = { ...initial }
  const listeners = new Map<string, Set<() => void>>()
  const set = (chat: string, text: string) => {
    if (drafts[chat] === text) return
    drafts = { ...drafts, [chat]: text }
    onChange?.(drafts)
    for (const listener of [...(listeners.get(chat) ?? [])]) listener()
  }
  return {
    get: (chat) => drafts[chat],
    set,
    clear: (chat, sent) => {
      const saved = drafts[chat]
      if (saved !== undefined && saved !== sent) return
      set(chat, '')
    },
    subscribe: (chat, listener) => {
      const forChat = listeners.get(chat) ?? new Set()
      forChat.add(listener)
      listeners.set(chat, forChat)
      return () => {
        forChat.delete(listener)
      }
    },
  }
}

/** The chat's draft in `drafts`, else `fallback`; the caller renders again only when this chat's draft changes. */
export function useDraft(drafts: DraftBook | undefined, chat: string, fallback: string): string {
  const subscribe = useCallback(
    (listener: () => void) => (drafts === undefined ? () => undefined : drafts.subscribe(chat, listener)),
    [drafts, chat],
  )
  return useSyncExternalStore(subscribe, () => drafts?.get(chat) ?? fallback)
}
