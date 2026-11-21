// A dragged handle of a live split (W2c): the gesture moves the handle and
// the panes on the page, and its end sends one ratio write (splitRatio.ts).
// A pointer drag ends when the pointer goes up; the arrow keys, and a
// double-click, end after a pause of 400 ms. The page then holds the sizes
// it sent while the write waits (until `layout.changed`, the 2.5 s read
// again, or a miss) and shows the server's sizes from then on. A handle
// whose drag has no write (no split along its axis stands between its
// panels) goes back to the server's sizes at once. The library's `Splitter`
// has no end-of-resize callback (LIBRARY_GAPS.md, Split and ratio), so a
// press on a handle (`data-part="resize-trigger"`) marks a pointer drag.
// The sizes are this hook's state, never the page's `ui`, so a held ratio
// never outlives the server's answer.
import { type PointerEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ResizePart, type SplitSizes, type WorkspacesData, type WorkspacesUi } from '../types.ts'
import { type LayoutWrites, ratioKey } from './layoutActions.ts'
import { panelsOf, ratioWrite, type SplitPart } from './splitRatio.ts'

/** How long the page waits after a key or a double-click moved a handle before it sends the ratio, in ms. */
const keyPauseMs = 400

type Held = { workspace: string; sizes: SplitSizes; phase: 'drag' | 'sent'; part: SplitPart }
type Gesture = { part: SplitPart; from: number[]; to: number[] }

const same = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((v, i) => Math.abs(v - (b[i] ?? 0)) < 0.01)

export type RatioDrag = {
  /** `view.ui` with the held sizes over the server's, and the readout's sizes during a rows-first drag. */
  readonly ui: WorkspacesUi
  /** Takes a handle's new sizes; none when the shown split is not a live tab's. */
  readonly onResize: ((part: SplitPart, sizes: number[]) => void) | undefined
  readonly onPointerDownCapture: (event: PointerEvent) => void
}

/** The drag of the shown workspace's live split; `view` is the shown view (`shownView`) of `data`. */
export function useRatioDrag(
  layout: LayoutWrites | undefined,
  data: WorkspacesData,
  view: { data: WorkspacesData; ui: WorkspacesUi },
  shown: string | null,
): RatioDrag {
  const tab = shown === null ? undefined : data.liveTabs?.[shown]?.find((t) => t.active)
  const [held, setHeld] = useState<Held>()
  const pointerRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const gestureRef = useRef<Gesture>(undefined)
  // A sent ratio's sizes show only while its write waits; then the server's sizes show.
  const waiting = shown !== null && layout?.pending.has(ratioKey(shown)) === true
  const mine = held?.workspace === shown && (held.phase === 'drag' || waiting) ? held : undefined
  const sizes: SplitSizes = { ...view.ui.splitSizes, ...mine?.sizes }
  const nowRef = useRef({ layout, tab, view, shown, sizes, mine })
  useLayoutEffect(() => {
    nowRef.current = { layout, tab, view, shown, sizes, mine }
  })

  const send = useCallback(() => {
    clearTimeout(timerRef.current)
    const g = gestureRef.current
    gestureRef.current = undefined
    const { layout: writes, tab: live, view: shownView, shown: workspace } = nowRef.current
    if (g === undefined || writes === undefined || live === undefined || workspace === null) return
    const ids = shownView.data.panes.map((p) => p.id)
    const panels = panelsOf(shownView.data.split, ids.length, g.part).map((panel) =>
      panel.flatMap((at) => (ids[at] === undefined ? [] : [ids[at]])),
    )
    const write = ratioWrite(live, g.part, panels, g.from, g.to)
    if (write !== undefined && writes.ratio(workspace, write)) setHeld((h) => h && { ...h, phase: 'sent' })
    else setHeld(undefined)
  }, [])

  // A pointer drag ends where the pointer goes up, wherever it is.
  useEffect(() => {
    const up = () => {
      if (!pointerRef.current) return
      pointerRef.current = false
      if (gestureRef.current !== undefined) send()
    }
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      clearTimeout(timerRef.current)
    }
  }, [send])

  const onResize = useCallback(
    (part: SplitPart, next: number[]) => {
      const { sizes: drawn, shown: workspace, mine: shownHeld } = nowRef.current
      const was = drawn[part] ?? next.map(() => 100 / next.length)
      // The splitter tells back the sizes it was given; only the owner's gesture moves a handle.
      if (workspace === null || same(next, was)) return
      if (gestureRef.current !== undefined && gestureRef.current.part !== part) send()
      const base = nowRef.current.view.ui.splitSizes?.[part] ?? next.map(() => 100 / next.length)
      gestureRef.current = { part, from: gestureRef.current?.from ?? base, to: next }
      setHeld({
        workspace,
        sizes: { ...shownHeld?.sizes, [part]: next },
        phase: 'drag',
        part,
      })
      if (!pointerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(send, keyPauseMs)
      }
    },
    [send],
  )

  const onPointerDownCapture = useCallback((event: PointerEvent) => {
    if (event.target instanceof Element && event.target.closest('[data-part="resize-trigger"]'))
      pointerRef.current = true
  }, [])

  const readout = mine?.phase === 'drag' && view.data.split === 'rows' ? ResizePart.safeParse(mine.part) : undefined
  const resizing = readout?.success === true ? { part: readout.data, sizes: sizes[readout.data] ?? [] } : null
  const live = layout !== undefined && tab?.id !== undefined && tab.root !== undefined
  return {
    ui: mine === undefined ? view.ui : { ...view.ui, splitSizes: sizes, resize: resizing },
    onResize: live ? onResize : undefined,
    onPointerDownCapture,
  }
}
