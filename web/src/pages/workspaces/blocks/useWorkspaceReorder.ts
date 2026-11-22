// The live edit mode's reorder of the workspaces (reviews R41, R42): a
// drag on a workspace's handle moves it in the list while the pointer is
// down, and its end sends the whole new order once (`onOrder`). The arrow
// keys on a focused handle move it one place up or down and send at once.
// While the pointer moves, the list draws the order it would send; after
// the drop the page draws `held` (the order a pending edit holds) until
// the list read after the server's event, so the list shows the server's
// order from then on. The move and the end are window listeners, so a
// handle that React moves in the list keeps its drag. A drag that the
// browser cancels sends nothing. Only the pointer that started the drag
// moves or ends it: a second finger on the screen is ignored (Codex review
// of #425). While a drag runs the list shows each workspace's header only
// (PhoneWorkspaceList closes the groups), so a workspace with more chats
// than the screen holds does not push the others off it, and a pointer held
// within `edgePx` of the list's top or bottom scrolls the list a step each
// frame (Codex review of #425: touch scrolling is off on the handle). Props
// only: the hook keeps the drag.
import { type KeyboardEvent, type PointerEvent, useCallback, useEffect, useRef, useState } from 'react'

/** How near the scrolling list's top or bottom edge a held pointer scrolls it, and by how much each frame, in px. */
const edgePx = 48
const stepPx = 8

/** The nearest ancestor of `element` that scrolls vertically, else the page's own scroller. */
function scrollerOf(element: Element): Element | null {
  for (let at = element.parentElement; at !== null; at = at.parentElement) {
    const { overflowY } = getComputedStyle(at)
    if ((overflowY === 'auto' || overflowY === 'scroll') && at.scrollHeight > at.clientHeight) return at
  }
  return document.scrollingElement
}

/** The part of the screen `scroller` shows: the page's scroller shows the whole window. */
function shownBy(scroller: Element): { top: number; bottom: number } {
  return scroller === document.scrollingElement
    ? { top: 0, bottom: window.innerHeight }
    : scroller.getBoundingClientRect()
}

/** `ids` with `id` taken out and put in at `at` of the others. */
const movedTo = (ids: readonly string[], id: string, at: number): string[] => {
  const others = ids.filter((i) => i !== id)
  return [...others.slice(0, at), id, ...others.slice(at)]
}

export type WorkspaceReorder = {
  /** The order to draw: the drag's, else the held one, else `ids`. */
  readonly order: readonly string[]
  /** The workspace being dragged, which fades. */
  readonly dragging: string | undefined
  /** The ref of each workspace's group, by ID, to place the pointer among them. */
  readonly groupRef: (id: string) => (element: HTMLDivElement | null) => void
  readonly onPointerDown: (id: string) => (event: PointerEvent) => void
  readonly onKeyDown: (id: string) => (event: KeyboardEvent) => void
}

/** The reorder of `ids` (the list's order); `held` is a pending order; `onOrder` sends a new one. */
export function useWorkspaceReorder(
  ids: readonly string[],
  held: readonly string[] | undefined,
  onOrder: ((order: readonly string[]) => void) | undefined,
): WorkspaceReorder {
  const groupsRef = useRef(new Map<string, HTMLDivElement>())
  const [drag, setDrag] = useState<{ id: string; at: number }>()
  const nowRef = useRef({ ids, onOrder })
  useEffect(() => {
    nowRef.current = { ids, onOrder }
  })
  const stopRef = useRef<() => void>(undefined)
  useEffect(() => () => stopRef.current?.(), [])
  // A held order shows only while it names the list's workspaces.
  const heldShown = held?.length === ids.length && ids.every((id) => held.includes(id)) ? held : undefined
  const base = heldShown ?? ids
  const order = drag === undefined ? base : movedTo(base, drag.id, drag.at)

  const groupRef = useCallback(
    (id: string) => (element: HTMLDivElement | null) => {
      if (element === null) groupsRef.current.delete(id)
      else groupsRef.current.set(id, element)
    },
    [],
  )
  /** The place among the other workspaces where `y` puts `id`: after each one whose middle is above it. */
  const placeOf = useCallback((id: string, y: number) => {
    let at = 0
    for (const [other, element] of groupsRef.current) {
      if (other === id) continue
      const box = element.getBoundingClientRect()
      if (box.top + box.height / 2 < y) at += 1
    }
    return at
  }, [])
  const onPointerDown = useCallback(
    (id: string) => (event: PointerEvent) => {
      if (event.button !== 0 || nowRef.current.onOrder === undefined) return
      event.preventDefault()
      stopRef.current?.()
      const from = nowRef.current.ids
      const pointer = event.pointerId
      const scroller = scrollerOf(event.currentTarget)
      let at = Math.max(0, from.indexOf(id))
      let y = event.clientY
      let frame = 0
      setDrag({ id, at })
      // Each frame, a pointer held near the list's edge scrolls it a step, and the place follows.
      const edgeScroll = () => {
        if (scroller !== null) {
          const box = shownBy(scroller)
          const step = y < box.top + edgePx ? -stepPx : y > box.bottom - edgePx ? stepPx : 0
          if (step !== 0) {
            scroller.scrollTop += step
            at = placeOf(id, y)
            setDrag({ id, at })
          }
        }
        frame = requestAnimationFrame(edgeScroll)
      }
      frame = requestAnimationFrame(edgeScroll)
      const move = (e: globalThis.PointerEvent) => {
        if (e.pointerId !== pointer) return
        y = e.clientY
        at = placeOf(id, y)
        setDrag({ id, at })
      }
      const stop = () => {
        cancelAnimationFrame(frame)
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        window.removeEventListener('pointercancel', cancel)
        stopRef.current = undefined
        setDrag(undefined)
      }
      const up = (e: globalThis.PointerEvent) => {
        if (e.pointerId !== pointer) return
        at = placeOf(id, e.clientY)
        stop()
        nowRef.current.onOrder?.(movedTo(from, id, at))
      }
      const cancel = (e: globalThis.PointerEvent) => {
        if (e.pointerId === pointer) stop()
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', cancel)
      stopRef.current = stop
    },
    [placeOf],
  )
  const onKeyDown = useCallback(
    (id: string) => (event: KeyboardEvent) => {
      const step = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0
      const { ids: now, onOrder: send } = nowRef.current
      const at = now.indexOf(id) + step
      if (step === 0 || send === undefined || at < 0 || at >= now.length) return
      event.preventDefault()
      send(movedTo(now, id, at))
    },
    [],
  )
  return { order, dragging: drag?.id, groupRef, onPointerDown, onKeyDown }
}
