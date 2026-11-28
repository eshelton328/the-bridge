// The Workspaces route's state once its live read settles (NCC-181). A slow read comes as its promise
// (loadWorkspacesRoute), so the page draws its loading layout in its own tree; a pendingComponent was a second tree.
// A shown loading layout stays pendingMinMs at least, also when a quick read brings a state in place of the promise.
// The last settled state stays while a newer read runs, a replaced read changes nothing, and a failed read is thrown
// in render to the route's error component.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { pendingTiming } from '../../lib/pendingTiming.ts'

type Settled<T> = { readonly value: T } | { readonly error: unknown }

const loadingOf = <T>(settled: Settled<T> | undefined) => settled === undefined || 'error' in settled

/** The state to draw: `loaded` itself, or the last read that settled; `undefined` while the first read runs. */
export function useSettledState<T>(loaded: T | Promise<T>): T | undefined {
  const [last, setLast] = useState<Settled<T> | undefined>(() =>
    loaded instanceof Promise ? undefined : { value: loaded },
  )
  const [seen, setSeen] = useState(loaded)
  if (seen !== loaded) {
    // A state that comes while the loading layout shows waits in the effect for the rest of its minimum.
    const held = seen instanceof Promise && loadingOf(last)
    setSeen(loaded)
    if (!(loaded instanceof Promise) && !held) setLast({ value: loaded })
    else if (last !== undefined && 'error' in last) setLast(undefined)
  }
  const shownAtRef = useRef<number | undefined>(undefined)
  const loading = loadingOf(last)
  useLayoutEffect(() => {
    if (loading && shownAtRef.current === undefined) shownAtRef.current = performance.now()
  })
  useEffect(() => {
    let current = true
    let timer: number | undefined
    const settle = (next: Settled<T>) => {
      if (!current) return
      const set = () => {
        setLast((now) =>
          now !== undefined && 'value' in now && 'value' in next && now.value === next.value ? now : next,
        )
      }
      const at = shownAtRef.current
      const left = at === undefined ? 0 : at + pendingTiming.defaultPendingMinMs - performance.now()
      if (left <= 0) set()
      else
        timer = window.setTimeout(() => {
          if (current) set()
        }, left)
    }
    if (loaded instanceof Promise)
      loaded.then(
        (value) => {
          settle({ value })
        },
        (error: unknown) => {
          settle({ error })
        },
      )
    else settle({ value: loaded })
    return () => {
      current = false
      window.clearTimeout(timer)
    }
  }, [loaded])
  if (last !== undefined && 'error' in last) throw last.error
  return last?.value
}
