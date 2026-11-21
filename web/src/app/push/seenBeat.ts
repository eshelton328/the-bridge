// The "seen" beat of Web Push (d-118): while a page of the app shows, it
// tells the server so every 20 s (`POST /api/push/seen`), and the server
// sends no push while a page was seen in the last 30 s. One timer for the
// whole app, started by mountApp: it sends when the page shows and stops
// while the page is hidden.

/** How often a shown page tells the server, in ms: under the server's 30 s, so one late beat still holds pushes. */
export const seenEveryMs = 20_000

/** What the beat needs: the send, and the document whose visibility it follows. */
export type SeenBeatDeps = {
  readonly send: () => unknown
  readonly doc?: Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>
}

/** Starts the beat; returns its stop. */
export function startSeenBeat({ send, doc = document }: SeenBeatDeps): () => void {
  let timer: ReturnType<typeof setInterval> | undefined
  const stopTimer = () => {
    if (timer !== undefined) clearInterval(timer)
    timer = undefined
  }
  const follow = () => {
    if (doc.visibilityState !== 'visible') {
      stopTimer()
      return
    }
    if (timer !== undefined) return
    send()
    timer = setInterval(send, seenEveryMs)
  }
  follow()
  doc.addEventListener('visibilitychange', follow)
  return () => {
    stopTimer()
    doc.removeEventListener('visibilitychange', follow)
  }
}
