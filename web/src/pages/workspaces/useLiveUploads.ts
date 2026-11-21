// The files of the Workspaces page's live Claude chats (slice W1b), for its
// entry: in development, while the page reads live, it loads liveUploads.ts
// and gives each live Claude chat's composer its chips and what adds,
// removes and retries a file (`ChatFiles`). A build, the fixtures, a Codex
// chat and a shell have none. The uploads outlive the page: a visit to
// another page and back finds them where they were.
import type { UploadId } from '@bridge/contract'
import { useCallback, useEffect, useState } from 'react'
import type { ChatFiles, ChatFilesView } from './blocks/ChatPane.tsx'
import type * as LiveUploads from './liveUploads.ts'

// The composer's view of each chat's uploads, made once for each change of them, so a pane's snapshot stays one object.
const shownViews = new WeakMap<LiveUploads.ChatUploads, ChatFilesView>()
// One source for each chat of the loaded module, so a pane does not subscribe again on each render.
const sourcesOf = new WeakMap<typeof LiveUploads, Map<string, ChatFiles>>()
const viewFor = (uploads: LiveUploads.ChatUploads): ChatFilesView => {
  const known = shownViews.get(uploads)
  if (known !== undefined) return known
  const view = { chips: uploads.chips, blocked: uploads.blocked, ready: uploads.ready.length, line: uploads.line }
  shownViews.set(uploads, view)
  return view
}

export type LiveFiles = {
  /** The files of the composer of `chat` (its pane ID) whose server ID is `liveChat`; none when not live. */
  readonly filesOf: (chat: string, liveChat: string | undefined) => ChatFiles | undefined
  /** The attachments a send of `chat` names now, in the chips' order. */
  readonly readyOf: (chat: string) => readonly UploadId[]
  /** A send of `chat` with `sent` went through: those chips leave the composer. */
  readonly sent: (chat: string, sent: readonly UploadId[]) => void
  /** The server refused the send's files (409 upload-conflict): those chips fail. */
  readonly conflict: (chat: string, sent: readonly UploadId[]) => void
  /**
   * A send names `ids`: their chips leave the composer until `settled`, and one removed meanwhile keeps its file until
   * then. The files' names, for the pending send's bubble.
   */
  readonly sending: (ids: readonly UploadId[]) => readonly string[]
  /** The send that named `ids` ended, `wentThrough` or not: a file removed meanwhile is deleted only if not. */
  readonly settled: (ids: readonly UploadId[], wentThrough: boolean) => void
  /** `chat` left the list for a new ID on its pane: its files go (W5 pane follow). */
  readonly drop: (chat: string) => void
}

export function useLiveUploads(on: boolean): LiveFiles {
  const [live, setLive] = useState<typeof LiveUploads>()
  useEffect(() => {
    if (!on) return
    let gone = false
    void import('./liveUploads.ts').then((loaded) => {
      if (!gone) setLive(loaded)
    })
    return () => {
      gone = true
    }
  }, [on])
  const shown = on ? live : undefined
  // The page never subscribes to the uploads: a change renders only the composers of its chat (the #329 flake).
  const filesOf = useCallback(
    (chat: string, liveChat: string | undefined): ChatFiles | undefined => {
      if (shown === undefined || liveChat === undefined) return undefined
      const key = `${chat}\n${liveChat}`
      const sources = sourcesOf.get(shown) ?? new Map<string, ChatFiles>()
      sourcesOf.set(shown, sources)
      const known = sources.get(key)
      if (known !== undefined) return known
      const source: ChatFiles = {
        subscribe: (listener) => shown.subscribeChat(chat, listener),
        view: () => viewFor(shown.chatView(chat)),
        add: (files) => {
          shown.addFiles(chat, liveChat, files)
        },
        remove: (id) => {
          shown.removeFile(chat, id)
        },
        retry: (id) => {
          shown.retryFile(chat, id)
        },
      }
      sources.set(key, source)
      return source
    },
    [shown],
  )
  return {
    filesOf,
    readyOf: (chat) => shown?.uploadViews().get(chat)?.ready ?? [],
    sent: (chat, sent) => shown?.sentFiles(chat, sent),
    conflict: (chat, sent) => shown?.conflictFiles(chat, sent),
    sending: (ids) => shown?.sendingFiles(ids) ?? [],
    settled: (ids, wentThrough) => shown?.settledFiles(ids, wentThrough),
    drop: (chat) => shown?.dropFiles(chat),
  }
}
