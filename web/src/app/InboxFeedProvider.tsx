// The app's live Inbox feed (lib/inboxFeed.ts): in development, one stream of
// `GET /api/events` for the app, and the server's `counts.needsYou` for the
// Inbox badge of every page. On each burst of `inbox.changed`, and each time
// the stream opens, it reads `GET /api/inbox`, unless the Inbox page shows its
// live list: then that page loads the list and gives the feed its count, so
// no second list read runs. No read runs on a timer. A read with no answer
// around a trip to the background is quiet and goes again when the page
// shows (lib/pageResume.ts); a miss keeps the last count and report() gets
// only its kind and status.
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { report } from '../errors/reporter.ts'
import { InboxMissError, readInboxList, watchInboxChanges } from '../lib/inboxClient.ts'
import { type InboxFeed, InboxFeedContext } from '../lib/inboxFeed.ts'

export function InboxFeedProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState<number | undefined>(undefined)
  const [followers] = useState(() => new Set<() => void>())
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined
    let reading: AbortController | undefined
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
        // A read the next one replaced, or the app's end.
        () => undefined,
      )
    }
    const stop = watchInboxChanges({ onChange: changed })
    return () => {
      stop()
      reading?.abort()
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
