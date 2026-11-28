// The number of workspace lists the live page has read from the server
// since it started (liveWorkspaces.ts counts each answer). A load from the
// cache, or a render with new transcripts or ui, counts nothing, so a hook
// can tell a fresh server read from another render (useForkedChat.ts, Codex
// review of #449). It holds no live code, so a build may import it.
//
// A load whose state is equal to the last keeps that state
// (loadWorkspacesState.ts, NCC-27), so the page does not render for it, and a
// hook that waits for a second server read of the same list sees no new data.
// `sameStateLoaded` tells such a hook (`onSameState`) that a load ended.
let answered = 0
const sameStateListeners = new Set<() => void>()

/** Counts one list the server answered. */
export function countListRead(): void {
  answered += 1
}

/** The lists the server answered so far. */
export const listReads = (): number => answered

/** Tells each listener that a load gave the same state as the last, so the page does not render for it. */
export function sameStateLoaded(): void {
  for (const listener of sameStateListeners) listener()
}

/** Calls `listener` after each load that gave the same state as the last; the return stops it. */
export function onSameState(listener: () => void): () => void {
  sameStateListeners.add(listener)
  return () => {
    sameStateListeners.delete(listener)
  }
}
