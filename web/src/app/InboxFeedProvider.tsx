// The app's live Inbox feed (lib/inboxFeed.ts): in development, the server's
// `counts.needsYou` for the Inbox badge of every page. On each burst of
// `inbox.changed`, and each time the stream opens, it reads `GET /api/inbox`,
// unless the Inbox page shows its live list: then that page loads the list and
// gives the feed its count, so no second list read runs. No read runs on a
// timer.
//
// The events come from one stream of `GET /api/events` for the app while the
// page shows (closed in the background, opened again on return). While the
// live Workspaces page shows, its own stream of the same route hosts the
// feed (`host`) and the feed closes its own, so the app holds one stream and
// the browser's few connections to a host stay free for the page's reads.
//
// A read with no answer around a trip to the background is quiet and goes
// again when the page shows (lib/pageResume.ts); a miss keeps the last count
// and report() gets only its kind and status. A reply the contract refuses
// keeps the last count and is reported by a fixed message.
//
// Review R43b: a read with no answer from the server (none at all, or a 5xx
// with no error body: the Vite proxy for a server that is down, as in a
// restart) starts a grace of `reconnectGraceMs`. Within it the miss is
// quiet; when it passes, the feed reads once more, and a miss then is
// reported once for the outage. A read that answers ends it. Its stream is
// `watchInboxChanges`, whose reader closes a stream that gives no byte for
// 45 s (lib/eventFrames.ts), so it connects again as after a drop.
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { report } from '../errors/reporter.ts'
import { reconnectGraceMs } from '../lib/eventFrames.ts'
import type { InboxMiss } from '../lib/inboxClient.ts'
import { type InboxFeed, InboxFeedContext } from '../lib/inboxFeed.ts'
import { readsLiveServer } from '../lib/dataSource.ts'

/** A badge read whose reply the contract refused, with no part of the reply. */
class InboxRefusedError extends Error {
  constructor() {
    super('An inbox request missed: badge refused by the contract')
    this.name = 'InboxRefusedError'
  }
}

/** A miss with no answer from the server: none at all, or a 5xx with no error body (a proxy for a server that is down). */
const noAnswer = (miss: InboxMiss) => miss.status === undefined || (miss.kind === 'status' && miss.status >= 500)

/** How long a burst of events from a host's stream waits before it gives one read, in ms (as the feed's own stream). */
const settleMs = 100

/** The feed's state that its stream, its reads and its hooks share; it lives as long as the provider. */
type Hub = {
  followers: Set<() => void>
  hosts: number
  /** The feed's own stream, while it is open, and how to open it (once the Inbox client loaded). */
  stop: (() => void) | undefined
  open: () => void
  /** The badge's own list read, while one runs. */
  reading: AbortController | undefined
  /** A change: the followers load, or the feed reads (once the Inbox client loaded). */
  changed: () => void
  settle: ReturnType<typeof setTimeout> | undefined
  /** The grace of a read with no answer (R43b), while one runs or until a read answers; `over` once it passed. */
  grace: { over: boolean; reported: boolean } | undefined
}

const newHub = (): Hub => ({
  followers: new Set(),
  hosts: 0,
  stop: undefined,
  open: () => undefined,
  reading: undefined,
  changed: () => undefined,
  settle: undefined,
  grace: undefined,
})

export function InboxFeedProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState<number | undefined>(undefined)
  const hubRef = useRef<Hub>(newHub())
  useEffect(() => {
    if (!readsLiveServer()) return undefined
    const hub = hubRef.current
    let unlisten: (() => void) | undefined
    let gone = false
    let graceTimer: ReturnType<typeof setTimeout> | undefined
    const start = ({ InboxMissError, readInboxList, watchInboxChanges }: typeof import('../lib/inboxClient.ts')) => {
      if (gone) return
      hub.changed = () => {
        if (hub.followers.size > 0) {
          for (const follower of hub.followers) follower()
          return
        }
        hub.reading?.abort()
        const mine = new AbortController()
        hub.reading = mine
        readInboxList('badge', mine.signal).then(
          (answer) => {
            // A read that a newer one or the Inbox page's count replaced keeps its answer to itself.
            if (mine.signal.aborted) return
            if (answer.ok) {
              clearTimeout(graceTimer)
              hub.grace = undefined
              setCount(answer.value.counts.needsYou)
              return
            }
            if (noAnswer(answer.error)) {
              if (hub.grace === undefined) {
                const grace = { over: false, reported: false }
                hub.grace = grace
                graceTimer = setTimeout(() => {
                  grace.over = true
                  hub.changed()
                }, reconnectGraceMs)
              }
              if (!hub.grace.over || hub.grace.reported || answer.error.status === undefined) return
              hub.grace.reported = true
            }
            if (answer.error.status !== undefined) report(new InboxMissError('badge', answer.error), 'live')
          },
          () => {
            // A read the next one replaced, or the app's end, is no miss. A reply the contract refuses is reported by
            // a fixed message: the parse error can quote the reply, and a report never holds a title.
            if (!mine.signal.aborted) report(new InboxRefusedError(), 'live')
          },
        )
      }
      // The stream runs only while the page shows and no host gives the events: it closes when the page goes to the
      // background, where iOS would close it anyway, and opens again when the page shows, which reads the count again.
      // So no stream is left behind by a trip to the background.
      const close = () => {
        hub.stop?.()
        hub.stop = undefined
        hub.reading?.abort()
      }
      hub.open = () => {
        if (!gone && hub.stop === undefined && hub.hosts === 0 && document.visibilityState !== 'hidden')
          hub.stop = watchInboxChanges({
            onChange: () => {
              hub.changed()
            },
          })
      }
      const onVisibility = () => {
        if (document.visibilityState === 'hidden') close()
        else hub.open()
      }
      document.addEventListener('visibilitychange', onVisibility)
      window.addEventListener('pagehide', close)
      window.addEventListener('pageshow', hub.open)
      unlisten = () => {
        document.removeEventListener('visibilitychange', onVisibility)
        window.removeEventListener('pagehide', close)
        window.removeEventListener('pageshow', hub.open)
        clearTimeout(hub.settle)
        close()
      }
      hub.open()
    }
    // The client loads only in development, so a build has none of it (as the pages' live loaders).
    void import('../lib/inboxClient.ts').then(start)
    return () => {
      gone = true
      clearTimeout(graceTimer)
      unlisten?.()
    }
  }, [])
  // The calls stay the same object while the count changes, so a page's effect that holds one does not run again.
  const calls = useMemo<Omit<InboxFeed, 'count'>>(
    () => ({
      follow: (onChange) => {
        const hub = hubRef.current
        hub.followers.add(onChange)
        return () => {
          hub.followers.delete(onChange)
          // The Inbox page left, perhaps with its load of a change still running: the feed reads the count itself. It
          // waits a microtask, so a follower that comes back at once (StrictMode's second mount) gives no read.
          queueMicrotask(() => {
            if (hub.followers.size === 0) hub.changed()
          })
        }
      },
      publish: (next) => {
        // The Inbox page's count is newer than the badge read that runs, if one does: that read is dropped.
        hubRef.current.reading?.abort()
        setCount(next)
      },
      host: () => {
        const hub = hubRef.current
        hub.hosts += 1
        hub.stop?.()
        hub.stop = undefined
        let done = false
        return {
          changed: () => {
            if (done) return
            hub.settle ??= setTimeout(() => {
              hub.settle = undefined
              hub.changed()
            }, settleMs)
          },
          release: () => {
            if (done) return
            done = true
            hub.hosts -= 1
            hub.open()
          },
        }
      },
    }),
    [],
  )
  const feed = useMemo<InboxFeed>(() => ({ count, ...calls }), [count, calls])
  return <InboxFeedContext value={feed}>{children}</InboxFeedContext>
}
