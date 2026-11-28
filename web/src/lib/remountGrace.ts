// How long a chat's pane leaves its transcript watch and its scroll place
// after it unmounts, so that a pane of the same chat that mounts in that time
// takes them over (NCC-175). A layout switch, such as the desktop's sidebar
// Hide or Show (D2's chat alone against the workbench's panes, D1), unmounts
// the old pane and mounts the new one in one React commit: React runs the
// commit's unmount cleanups, then its new effects, in one pass, before any
// microtask queued meanwhile. So the grace ends at the next microtask: a pane
// that closes for good stops its watch as soon as the commit ends
// (pages/workspaces/remountWatch.ts, blocks/usePinnedEnd.ts). A microtask, not
// a timer: a timer would also wait for a test's held clock (lib/holdTimers.ts).

/**
 * Runs `end` once the commit that called it is over, unless the returned `keep` is called first. `keep` returns true
 * when it stopped `end`.
 */
export function afterRemountGrace(end: () => void): () => boolean {
  let done = false
  queueMicrotask(() => {
    if (done) return
    done = true
    end()
  })
  return () => {
    if (done) return false
    done = true
    return true
  }
}
