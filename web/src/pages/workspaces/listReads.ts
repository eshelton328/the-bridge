// The number of workspace lists the live page has read from the server
// since it started (liveWorkspaces.ts counts each answer). A load from the
// cache, or a render with new transcripts or ui, counts nothing, so a hook
// can tell a fresh server read from another render (useForkedChat.ts, Codex
// review of #449). It holds no live code, so a build may import it.
let answered = 0

/** Counts one list the server answered. */
export function countListRead(): void {
  answered += 1
}

/** The lists the server answered so far. */
export const listReads = (): number => answered
