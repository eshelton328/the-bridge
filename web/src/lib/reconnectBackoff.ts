// The wait before a live transcript connects again after a miss (R70, bridge-coord's decision of 2026-11-24): an
// exponential backoff with full jitter. The n-th miss in a row waits a random time below 0.5 s × 2^(n-1), at most 30 s:
// below 0.5, 1, 2, 4, 8, 16, then 30 s. Each try keeps its own 8 s limit (liveReadTimeoutMs). A success, the page back
// at the front or the network's online event starts the steps again. The banner needs 4 misses in a row while the page
// is visible; misses while it is hidden do not count. The 10 s floor before it is the session's own timer.

/** The first step of the backoff, in ms. */
const backoffBaseMs = 500
/** The longest wait between two tries, in ms. */
export const backoffCapMs = 30_000
/** How many misses in a row, while the page is visible, the banner needs. */
const visibleMissesForBanner = 4

type Backoff = {
  /**
   * A miss: the wait before the next try, whether it is the first of a row (the floor starts), and whether the row has
   * the visible misses the banner needs.
   */
  readonly miss: (visible: boolean) => { readonly waitMs: number; readonly first: boolean; readonly enough: boolean }
  /** A read that answered, the page back at the front or online again: the next miss waits as the first one does. */
  readonly reset: () => void
}

/** A backoff for one chat; `random` gives a number in [0, 1), as Math.random does. */
export function reconnectBackoff(random: () => number = Math.random): Backoff {
  let misses = 0
  let visibleMisses = 0
  return {
    miss: (visible) => {
      const step = Math.min(backoffCapMs, backoffBaseMs * 2 ** misses)
      const first = misses === 0
      misses += 1
      if (visible) visibleMisses += 1
      return { waitMs: Math.floor(random() * step), first, enough: visibleMisses >= visibleMissesForBanner }
    },
    reset: () => {
      misses = 0
      visibleMisses = 0
    },
  }
}
