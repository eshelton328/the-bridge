// The live item a row opened (InboxPage): its detail read (`GET /api/inbox/:item`,
// liveInbox.ts `readItem`) while it is open, and the line of its last snooze,
// done or dismiss that missed (`markItem`). A mark that goes through closes the
// item and reads the list again; the server's `inbox.changed` reads it too, and
// the router keeps one load for both. A mark that misses keeps the item open
// and shows its line, in the detail when the item is open, else under the list
// tools. The read starts again when another item opens or the list loads
// again, and ends when the item closes or the page leaves; the last read
// shows until the next one answers.
import { useEffect, useState } from 'react'
import { markItem, readItem } from './liveInbox.ts'
import type { InboxData, InboxPutAway, LiveOpen } from './types.ts'

type Read = { readonly id: string; readonly open: Omit<LiveOpen, 'canAct' | 'source'> }
type Missed = { readonly id: string; readonly line: string }

export type LiveItem = {
  /** The open item as LiveDetail draws it; undefined with none open, or off the live Inbox. */
  readonly open: LiveOpen | undefined
  /** The line of a mark that missed on an item that is not open, for the list. */
  readonly listLine: string | undefined
  readonly act: InboxPutAway
}

export function useLiveItem(
  data: InboxData,
  openId: string | null,
  close: () => void,
  reload: () => Promise<void>,
): LiveItem {
  const live = data.live
  const item = live?.items.find((i) => i.id === openId)
  const [read, setRead] = useState<Read | undefined>(undefined)
  const [missed, setMissed] = useState<Missed | undefined>(undefined)
  const readId = item?.id
  useEffect(() => {
    if (readId === undefined) return
    const abort = new AbortController()
    readItem(readId, abort.signal).then(
      (open) => {
        setRead({ id: readId, open })
      },
      // The owner closed the item or left the page: the read's end is his.
      () => undefined,
    )
    return () => {
      abort.abort()
    }
    // `live` is new on each list load, so an `inbox.changed` (a record edited in the brain) reads the open item again.
  }, [readId, live])
  const act: InboxPutAway = (id, to) => {
    setMissed(undefined)
    void markItem(id, to, data.snoozeMenu).then((sent) => {
      if (sent.ok) {
        close()
        void reload()
      } else setMissed({ id, line: sent.error })
    })
  }
  if (live === undefined) return { open: undefined, listLine: undefined, act }
  const line = missed?.id === readId ? missed?.line : undefined
  const open: LiveOpen | undefined =
    item === undefined
      ? undefined
      : {
          ...(read?.id === item.id ? read.open : { read: 'reading', line: null }),
          source: item.source,
          canAct: item.actions.length > 0,
          ...(line === undefined ? {} : { line }),
        }
  return { open, listLine: missed !== undefined && missed.id !== readId ? missed.line : undefined, act }
}
