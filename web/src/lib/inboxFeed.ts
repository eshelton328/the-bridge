// The app's live Inbox feed (app/InboxFeedProvider.tsx), as pages read it:
// the server's `counts.needsYou` for the Inbox badge in the rail and the tab
// bar, and the one `inbox.changed` stream of the app. A page entry reads it
// and passes the number to its props-only screen, which gives it to AppRail
// and AppTabBar; no store holds it (R9).
//
// Without the provider (a route test that renders only the router) a page
// shows its own data's number and the Inbox page watches the stream itself,
// as before the feed.
import { createContext, use, useCallback, useEffect, useRef } from 'react'

export type InboxFeed = {
  /** The server's `counts.needsYou`; undefined until a read answers. */
  readonly count: number | undefined
  /**
   * The Inbox page takes over the reads while it shows live data: each change of the stream calls `onChange` (its
   * list load), and the feed reads nothing itself. The result gives the reads back.
   */
  readonly follow: (onChange: () => void) => () => void
  /** The `counts.needsYou` of the list the Inbox page loaded. */
  readonly publish: (count: number) => void
  /**
   * A page whose own stream of `GET /api/events` gives the feed its events, so the app holds one stream: the feed
   * closes its own until `release`. The host calls `changed` on each `inbox.changed` and each time its stream opens.
   */
  readonly host: () => InboxHost
}

type InboxHost = { readonly changed: () => void; readonly release: () => void }

export const InboxFeedContext = createContext<InboxFeed | null>(null)

/**
 * The number of a page's Inbox badge: with the app's feed and live data shown, the server's count (0, no badge, until
 * a read answers, never a sample number); else `own`, the number of the shown state (`?state=`, `?source=fixtures`,
 * stories).
 */
export function useInboxBadge(own: number, live: boolean): number {
  const feed = use(InboxFeedContext)
  return feed !== null && live ? (feed.count ?? 0) : own
}

/**
 * The Inbox page's live list: `onChange` (a load of the list) once for each burst of `inbox.changed` and each time
 * the stream opens, through the app's feed when it has one, so the app has one stream and one list read, else with
 * a watcher of its own. The feed also gets `count`, the loaded list's `counts.needsYou`.
 */
export function useInboxChanges(live: boolean, onChange: () => void, count: number): void {
  const feed = use(InboxFeedContext)
  const follow = feed?.follow
  const publish = feed?.publish
  const changeRef = useRef(onChange)
  useEffect(() => {
    changeRef.current = onChange
  })
  useEffect(() => {
    if (!import.meta.env.DEV || !live) return undefined
    const call = () => {
      changeRef.current()
    }
    if (follow !== undefined) return follow(call)
    // The client loads only in development, so a build has none of it (as the page's live loader).
    let stop: (() => void) | undefined
    let gone = false
    void import('./inboxClient.ts').then((client) => {
      if (!gone) stop = client.watchInboxChanges({ onChange: call })
    })
    return () => {
      gone = true
      stop?.()
    }
  }, [follow, live])
  useEffect(() => {
    if (live) publish?.(count)
  }, [publish, live, count])
}

/**
 * A live page that reads `GET /api/events` itself (the Workspaces page) hosts the app's feed while `live`, so the app
 * holds one stream. The result is the call for its stream's `open` and `inbox.changed` frames; with no feed it does
 * nothing.
 */
export function useInboxStreamHost(live: boolean): () => void {
  const host = use(InboxFeedContext)?.host
  const hostedRef = useRef<InboxHost | undefined>(undefined)
  useEffect(() => {
    if (!import.meta.env.DEV || !live || host === undefined) return undefined
    const hosted = host()
    hostedRef.current = hosted
    return () => {
      hostedRef.current = undefined
      hosted.release()
    }
  }, [host, live])
  return useCallback(() => {
    hostedRef.current?.changed()
  }, [])
}
