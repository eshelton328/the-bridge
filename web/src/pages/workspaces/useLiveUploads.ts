// The files of the Workspaces page's live Claude chats (slice W1b), for its
// entry: in development, while the page reads live, it loads liveUploads.ts
// and gives each live Claude chat's composer its chips and what adds,
// removes and retries a file (`ChatFiles`). A build, the fixtures, a Codex
// chat and a shell have none. The uploads outlive the page: a visit to
// another page and back finds them where they were.
import type { UploadId } from '@bridge/contract'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import type { ChatFiles } from './blocks/ChatPane.tsx'
import type * as LiveUploads from './liveUploads.ts'

const noViews: ReadonlyMap<string, LiveUploads.ChatUploads> = new Map()
const noSubscribe = () => () => undefined
const getNoViews = () => noViews

export type LiveFiles = {
  /** The files of the composer of `chat` (its pane ID) whose server ID is `liveChat`; none when not live. */
  readonly filesOf: (chat: string, liveChat: string | undefined) => ChatFiles | undefined
  /** The attachments a send of `chat` names now, in the chips' order. */
  readonly readyOf: (chat: string) => readonly UploadId[]
  /** A send of `chat` with `sent` went through: those chips leave the composer. */
  readonly sent: (chat: string, sent: readonly UploadId[]) => void
  /** The server refused the send's files (409 upload-conflict): those chips fail. */
  readonly conflict: (chat: string, sent: readonly UploadId[]) => void
  /** A send names `ids`: a chip of them removed meanwhile keeps its file until `settled`. */
  readonly sending: (ids: readonly UploadId[]) => void
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
  const views = useSyncExternalStore(shown?.subscribeUploads ?? noSubscribe, shown?.uploadViews ?? getNoViews)
  const filesOf = useCallback(
    (chat: string, liveChat: string | undefined): ChatFiles | undefined => {
      if (shown === undefined || liveChat === undefined) return undefined
      const view = views.get(chat)
      return {
        chips: view?.chips ?? [],
        blocked: view?.blocked ?? false,
        ready: view?.ready.length ?? 0,
        line: view?.line,
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
    },
    [shown, views],
  )
  return {
    filesOf,
    readyOf: (chat) => shown?.uploadViews().get(chat)?.ready ?? [],
    sent: (chat, sent) => shown?.sentFiles(chat, sent),
    conflict: (chat, sent) => shown?.conflictFiles(chat, sent),
    sending: (ids) => shown?.sendingFiles(ids),
    settled: (ids, wentThrough) => shown?.settledFiles(ids, wentThrough),
    drop: (chat) => shown?.dropFiles(chat),
  }
}
