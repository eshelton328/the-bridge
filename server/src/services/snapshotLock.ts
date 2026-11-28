// One lock for each snapshot of a GitHub repository (f-008 increment two): a
// sync changes the snapshot's files, so each sync and each read of them holds
// the lock of that snapshot. The drift check and the Architecture runner share
// one lock, so a drift sync never changes files that a diagram run reads.
// The work of one key goes one at a time, in the order it came; a work that
// fails or throws frees the lock for the next.

/** A GitHub repository's owner and name. */
type GithubName = { readonly owner: string; readonly name: string }

export type SnapshotLock = {
  /** Runs `work` when the work before it of the same key has ended, good or failed. */
  hold<T>(key: string, work: () => Promise<T>): Promise<T>
}

/** The key of a repository's snapshot: two IDs of one GitHub repository share a snapshot, so they share a key. */
export const snapshotKey = (github: GithubName): string => `${github.owner}/${github.name}`.toLowerCase()

export function createSnapshotLock(): SnapshotLock {
  const locks = new Map<string, Promise<unknown>>()
  return {
    hold(key, work) {
      const before = locks.get(key) ?? Promise.resolve()
      const started = before.then(work, work)
      const held = started.catch(() => undefined)
      locks.set(key, held)
      void held.then(() => {
        if (locks.get(key) === held) locks.delete(key)
      })
      return started
    },
  }
}
