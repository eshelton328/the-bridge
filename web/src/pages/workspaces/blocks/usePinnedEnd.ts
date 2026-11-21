// Keeps a live chat's transcript at its newest entry. The chat opens at the
// end of its transcript, and it stays there while entries come in or change,
// the pane resizes, the keyboard opens or closes, the page comes back from the
// background or the transcript is read again, unless the reader scrolled up;
// once the reader scrolls back to the end, it follows again. The scroller is
// the body of the ChatPane's ScrollFrame, which takes no ref, so the hook
// finds it from an element in the frame's footer. A MutationObserver sees each
// new or changed entry before the browser paints it, and a ResizeObserver sees
// a size change, such as a late transcript read, an entry that grows after
// its first layout or a resized pane.
//
// One rule decides the pin (screen review R33): only the reader leaves the
// end. A scroll counts as the reader's while a finger moves on the transcript
// (and a moment after it lifts, for the fling), after a wheel turn or a
// scroll key, or while a mouse drags the scroll bar. Any other scroll away
// from the end while pinned, such as one iOS makes after Send closes the
// keyboard (its trace shows a scroll to an old place 1.3 s after Send with no
// touch), goes back to the end in the same frame, before the browser paints.
// A scroll of any kind that reaches the end pins again.
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

/** How near the end, in px, still counts as the end: a scroll position can be a fraction short of it. */
const endSlack = 2

/** How long, in ms, after the reader's last wheel turn, scroll key or lifted finger a scroll still counts as theirs. */
const readerScrollMs = 500

/** The keys that scroll a focused scroller. */
const scrollKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '])

const atEnd = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight <= endSlack
const toEnd = (el: HTMLElement) => {
  el.scrollTop = el.scrollHeight
}

/** A key press in a field types text; it does not scroll the transcript. */
const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select'))

/**
 * Pins the transcript of the ScrollFrame around the element that gets the returned ref to its end while `enabled`.
 * A new `key` (another chat in the same pane) opens that chat at its end again.
 */
export function usePinnedEnd(enabled: boolean, key: string) {
  const [scroller, setScroller] = useState<HTMLElement | null>(null)
  const pinnedRef = useRef(true)
  const ref = useCallback((el: HTMLElement | null) => {
    const body = el?.closest('.scroll-frame__root')?.querySelector(':scope > .scroll-frame__body')
    setScroller(body instanceof HTMLElement ? body : null)
  }, [])
  useLayoutEffect(() => {
    if (!enabled || scroller === null) return undefined
    pinnedRef.current = true
    const view = scroller.ownerDocument.defaultView ?? window
    // The reader's input: a finger that moves on the transcript, a mouse on its scroll bar, and the time of the
    // last wheel turn, scroll key or lifted finger.
    const reader = { touching: false, dragging: false, last: Number.NEGATIVE_INFINITY }
    const readerScrolls = () => reader.touching || reader.dragging || performance.now() - reader.last < readerScrollMs
    const follow = () => {
      if (pinnedRef.current) toEnd(scroller)
    }
    const onScroll = () => {
      if (atEnd(scroller)) pinnedRef.current = true
      else if (readerScrolls()) pinnedRef.current = false
      // Pinned, and the reader did not move it: back to the end before the browser paints this frame.
      else follow()
    }
    const onTouchMove = () => {
      reader.touching = true
    }
    const onTouchEnd = () => {
      if (!reader.touching) return
      reader.touching = false
      reader.last = performance.now()
    }
    const onWheel = () => {
      reader.last = performance.now()
    }
    const onKey = (event: KeyboardEvent) => {
      if (scrollKeys.has(event.key) && !typing(event.target)) reader.last = performance.now()
    }
    // A press on the scroller itself, not on an entry, is on its scroll bar.
    const onPointerDown = (event: PointerEvent) => {
      if (event.target === scroller && event.pointerType === 'mouse') reader.dragging = true
    }
    const onPointerUp = () => {
      if (!reader.dragging) return
      reader.dragging = false
      reader.last = performance.now()
    }
    // Back from the background: entries may have come in while the page could not draw them.
    const onShow = () => {
      if (scroller.ownerDocument.visibilityState === 'visible') follow()
    }
    const resize = new ResizeObserver(follow)
    const observeAll = () => {
      resize.observe(scroller)
      for (const child of scroller.children) resize.observe(child)
    }
    const mutation = new MutationObserver(() => {
      observeAll()
      follow()
    })
    follow()
    observeAll()
    mutation.observe(scroller, { childList: true, subtree: true, characterData: true })
    const passive = { passive: true } as const
    scroller.addEventListener('scroll', onScroll, passive)
    scroller.addEventListener('touchmove', onTouchMove, passive)
    scroller.addEventListener('wheel', onWheel, passive)
    scroller.addEventListener('pointerdown', onPointerDown, passive)
    view.addEventListener('touchend', onTouchEnd, passive)
    view.addEventListener('touchcancel', onTouchEnd, passive)
    view.addEventListener('pointerup', onPointerUp, passive)
    view.addEventListener('pointercancel', onPointerUp, passive)
    view.addEventListener('keydown', onKey, { capture: true, passive: true })
    view.addEventListener('pageshow', onShow)
    scroller.ownerDocument.addEventListener('visibilitychange', onShow)
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      scroller.removeEventListener('touchmove', onTouchMove)
      scroller.removeEventListener('wheel', onWheel)
      scroller.removeEventListener('pointerdown', onPointerDown)
      view.removeEventListener('touchend', onTouchEnd)
      view.removeEventListener('touchcancel', onTouchEnd)
      view.removeEventListener('pointerup', onPointerUp)
      view.removeEventListener('pointercancel', onPointerUp)
      view.removeEventListener('keydown', onKey, { capture: true })
      view.removeEventListener('pageshow', onShow)
      scroller.ownerDocument.removeEventListener('visibilitychange', onShow)
      mutation.disconnect()
      resize.disconnect()
    }
  }, [enabled, scroller, key])
  return ref
}
