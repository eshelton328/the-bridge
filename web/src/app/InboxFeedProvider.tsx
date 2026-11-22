// The app's live Inbox feed (lib/inboxFeed.ts): in development, one stream of
// `GET /api/events` for the app while the page shows (closed in the
// background, opened again on return), and the server's `counts.needsYou` for the
// Inbox badge of every page. On each burst of `inbox.changed`, and each time
// the stream opens, it reads `GET /api/inbox`, unless the Inbox page shows its
// live list: then that page loads the list and gives the feed its count, so
// no second list read runs. No read runs on a timer. A read with no answer
// around a trip to the background is quiet and goes again when the page
// shows (lib/pageResume.ts); a miss keeps the last count and report() gets
// only its kind and status. A reply the contract refuses keeps the last count
// and is reported by a fixed message.
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { report } from '../errors/reporter.ts'
import { type InboxFeed, InboxFeedContext } from '../lib/inboxFeed.ts'

/** A badge read whose reply the contract refused, with no part of the reply. */
class InboxRefusedError extends Error {
  constructor() {
    super('An inbox request missed: badge refused by the contract')
    this.name = 'InboxRefusedError'
  }
}

export function InboxFeedProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState<number | undefined>(undefined)
  const [followers] = useState(() => new Set<() => void>())
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined
    let reading: AbortController | undefined
    let stop: (() => void) | undefined
    let unlisten: (() => void) | undefined
    let gone = false
    const start = ({ InboxMissError, readInboxList, watchInboxChanges }: typeof import('../lib/inboxClient.ts')) => {
      if (gone) return
      const changed = () => {
        if (followers.size > 0) {
          for (const follower of followers) follower()
          return
        }
        reading?.abort()
        const mine = new AbortController()
        reading = mine
        readInboxList('badge', mine.signal).then(
          (answer) => {
            if (answer.ok) setCount(answer.value.counts.needsYou)
            else if (answer.error.status !== undefined) report(new InboxMissError('badge', answer.error), 'live')
          },
          () => {
            // A read the next one replaced, or the app's end, is no miss. A reply the contract refuses is reported by
            // a fixed message: the parse error can quote the reply, and a report never holds a title.
            if (!mine.signal.aborted) report(new InboxRefusedError(), 'live')
          },
        )
      }
      // The stream runs only while the page shows: it closes when the page goes to the background, where iOS would
      // close it anyway, and opens again when the page shows, which reads the count again. So no stream is left
      // behind by a trip to the background.
      const close = () => {
        stop?.()
        stop = undefined
        reading?.abort()
      }
      const open = () => {
        if (!gone && stop === undefined && document.visibilityState !== 'hidden')
          stop = watchInboxChanges({ onChange: changed })
      }
      const onVisibility = () => {
        if (document.visibilityState === 'hidden') close()
        else open()
      }
      document.addEventListener('visibilitychange', onVisibility)
      window.addEventListener('pagehide', close)
      window.addEventListener('pageshow', open)
      unlisten = () => {
        document.removeEventListener('visibilitychange', onVisibility)
        window.removeEventListener('pagehide', close)
        window.removeEventListener('pageshow', open)
        close()
      }
      open()
    }
    // The client loads only in development, so a build has none of it (as the pages' live loaders).
    void import('../lib/inboxClient.ts').then(start)
    return () => {
      gone = true
      unlisten?.()
    }
  }, [followers])
  const follow = useCallback(
    (onChange: () => void) => {
      followers.add(onChange)
      return () => {
        followers.delete(onChange)
      }
    },
    [followers],
  )
  const feed = useMemo<InboxFeed>(() => ({ count, follow, publish: setCount }), [count, follow])
  return <InboxFeedContext value={feed}>{children}</InboxFeedContext>
}
