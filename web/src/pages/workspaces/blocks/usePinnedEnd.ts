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
// scroll key, while a mouse button is down in the transcript (a drag of its
// scroll bar, or a text selection that scrolls past its edge), or after the
// focus moves into it (Tab, a link or a screen reader's next item). Once the
// reader has left the end, no scroll is moved back: a fling's scroll events
// after the finger lifts keep the place. Any other scroll away
// from the end while pinned, such as one iOS makes after Send closes the
// keyboard (its trace shows a scroll to an old place 1.3 s after Send with no
// touch), goes back to the end in the same frame, before the browser paints.
// A scroll of any kind that reaches the end pins again.
//
// Scroll to the newest message (the owner's request, 2026-11-21): `newest`
// says whether the reader is more than one screen above the end, and whether
// new entries came in since he left it, as a small store that only the button
// (`NewestButton`) reads, so a scroll renders neither the pane nor its
// entries. Its `jump` pins the transcript and scrolls to the end smoothly (at
// once with prefers-reduced-motion): from far up it jumps to a screen above
// the end and glides the rest. That scroll is not the reader's, and the
// pin does not snap it to the end while it runs, so it glides there unless
// the reader takes over. A press on the button is not reader input. The
// button's own slot sits in the scroller (`newestSlot`); its coming and going
// is not a new entry and moves nothing.
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

/** How near the end, in px, still counts as the end: a scroll position can be a fraction short of it. */
const endSlack = 2

/**
 * How long, in ms, after the reader's last wheel turn, scroll key, lifted finger or focus move into the transcript a
 * scroll still counts as theirs.
 */
const readerScrollMs = 500

/** The keys that scroll a focused scroller. */
const scrollKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '])

/** How long a smooth scroll to the end may take before the transcript jumps there, in ms. */
const seekLimitMs = 1200

/** The attribute on the button's slot in the scroller: a change inside it is not an entry, a press in it not the reader's. */
export const newestSlot = 'data-newest-slot'

const fromEnd = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight
const atEnd = (el: HTMLElement) => fromEnd(el) <= endSlack
const toEnd = (el: HTMLElement) => {
  el.scrollTop = el.scrollHeight
}
const ours = (node: EventTarget | Node | null) => node instanceof Element && node.closest(`[${newestSlot}]`) !== null
const reducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** What the button to the newest message shows now. */
export type NewestView = {
  /** The reader is more than one screen above the end. */
  readonly shown: boolean
  /** New entries came in while the reader was away from the end. */
  readonly unseen: boolean
}

/** The button's store: one `NewestView` object until it changes. */
export type Newest = {
  readonly subscribe: (listener: () => void) => () => void
  readonly view: () => NewestView
  /** Scrolls to the end and pins the transcript there again. */
  readonly jump: () => void
}

const hidden: NewestView = { shown: false, unseen: false }

function newestStore() {
  const listeners = new Set<() => void>()
  let current = hidden
  let jumper: (() => void) | undefined
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    view: () => current,
    jump: () => {
      jumper?.()
    },
    set: (next: NewestView) => {
      if (next.shown === current.shown && next.unseen === current.unseen) return
      current = next.shown || next.unseen ? next : hidden
      for (const listener of listeners) listener()
    },
    bind: (next: (() => void) | undefined) => {
      jumper = next
    },
  }
}

/** A key press in a field types text; it does not scroll the transcript. */
const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select'))

/**
 * Pins the transcript of the ScrollFrame around the element that gets the returned `ref` to its end while `enabled`.
 * A new `key` (another chat in the same pane) opens that chat at its end again. `newest` is the button's store.
 */
export function usePinnedEnd(enabled: boolean, key: string): { ref: (el: HTMLElement | null) => void; newest: Newest } {
  const [scroller, setScroller] = useState<HTMLElement | null>(null)
  const [newest] = useState(newestStore)
  const pinnedRef = useRef(true)
  const ref = useCallback((el: HTMLElement | null) => {
    const body = el?.closest('.scroll-frame__root')?.querySelector(':scope > .scroll-frame__body')
    setScroller(body instanceof HTMLElement ? body : null)
  }, [])
  useLayoutEffect(() => {
    if (!enabled || scroller === null) return undefined
    pinnedRef.current = true
    const view = scroller.ownerDocument.defaultView ?? window
    // The reader's input: a finger that moves on the transcript, a mouse button down in it, and the time of the
    // last wheel turn, scroll key, lifted finger or focus move into the transcript.
    const reader = { touching: false, dragging: false, last: Number.NEGATIVE_INFINITY }
    const readerScrolls = () => reader.touching || reader.dragging || performance.now() - reader.last < readerScrollMs
    // New entries came in while the reader was away from the end.
    let unseen = false
    // The button's smooth scroll to the end runs: pinned, but not snapped to the end on each step.
    let seeking = false
    let seekTimer: ReturnType<typeof setTimeout> | undefined
    const stopSeeking = () => {
      seeking = false
      clearTimeout(seekTimer)
    }
    const show = () => {
      if (pinnedRef.current) unseen = false
      const shown = !pinnedRef.current && fromEnd(scroller) > scroller.clientHeight
      newest.set({ shown, unseen: shown && unseen })
    }
    const follow = () => {
      if (pinnedRef.current && !seeking) toEnd(scroller)
    }
    const onScroll = () => {
      if (atEnd(scroller)) {
        pinnedRef.current = true
        stopSeeking()
      } else if (readerScrolls()) {
        pinnedRef.current = false
        stopSeeking()
      }
      // Pinned, and the reader did not move it: back to the end before the browser paints this frame.
      else follow()
      show()
    }
    const onTouchMove = () => {
      reader.touching = true
    }
    const onTouchEnd = () => {
      if (!reader.touching) return
      reader.touching = false
      reader.last = performance.now()
    }
    // A wheel turn, and a focus that moves into the transcript, which scrolls the focused entry into view.
    const onReader = (event: Event) => {
      if (!ours(event.target)) reader.last = performance.now()
    }
    const onKey = (event: KeyboardEvent) => {
      if (scrollKeys.has(event.key) && !typing(event.target)) reader.last = performance.now()
    }
    // A mouse press in the transcript: on its scroll bar, or the start of a text selection, which scrolls the
    // transcript when the drag passes its top or bottom edge.
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && !ours(event.target)) reader.dragging = true
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
    // A size change, such as the keyboard opening or a shrunk pane, can carry the reader past a screen from the end.
    const resize = new ResizeObserver(() => {
      follow()
      show()
    })
    const observeAll = () => {
      resize.observe(scroller)
      for (const child of scroller.children) resize.observe(child)
    }
    const mutation = new MutationObserver((records) => {
      const real = records.filter(
        (r) => !ours(r.target) && !(r.target === scroller && [...r.addedNodes, ...r.removedNodes].every(ours)),
      )
      if (real.length === 0) return
      if (!pinnedRef.current && real.some((r) => r.target === scroller && [...r.addedNodes].some((n) => !ours(n))))
        unseen = true
      observeAll()
      // An entry that comes in while the button's scroll runs moves its goal to the new end.
      if (seeking) scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
      follow()
      show()
    })
    newest.bind(() => {
      // The button asks for the end: what the reader did before it is over.
      reader.touching = false
      reader.dragging = false
      reader.last = Number.NEGATIVE_INFINITY
      pinnedRef.current = true
      if (reducedMotion()) {
        stopSeeking()
        toEnd(scroller)
      } else {
        seeking = true
        clearTimeout(seekTimer)
        // From far up, the view first jumps to one screen above the end, so the glide is the last screen only.
        if (fromEnd(scroller) > scroller.clientHeight)
          scroller.scrollTop = scroller.scrollHeight - scroller.clientHeight * 2
        // A smooth scroll that has not ended by then jumps to the end.
        seekTimer = setTimeout(() => {
          if (!seeking) return
          stopSeeking()
          follow()
        }, seekLimitMs)
        scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
      }
      show()
    })
    follow()
    observeAll()
    show()
    mutation.observe(scroller, { childList: true, subtree: true, characterData: true })
    const passive = { passive: true } as const
    scroller.addEventListener('scroll', onScroll, passive)
    scroller.addEventListener('touchmove', onTouchMove, passive)
    scroller.addEventListener('wheel', onReader, passive)
    scroller.addEventListener('focusin', onReader)
    scroller.addEventListener('pointerdown', onPointerDown, passive)
    view.addEventListener('touchend', onTouchEnd, passive)
    view.addEventListener('touchcancel', onTouchEnd, passive)
    view.addEventListener('pointerup', onPointerUp, passive)
    view.addEventListener('pointercancel', onPointerUp, passive)
    view.addEventListener('keydown', onKey, { capture: true, passive: true })
    view.addEventListener('pageshow', onShow)
    scroller.ownerDocument.addEventListener('visibilitychange', onShow)
    return () => {
      stopSeeking()
      newest.bind(undefined)
      newest.set(hidden)
      scroller.removeEventListener('scroll', onScroll)
      scroller.removeEventListener('touchmove', onTouchMove)
      scroller.removeEventListener('wheel', onReader)
      scroller.removeEventListener('focusin', onReader)
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
  }, [enabled, scroller, key, newest])
  return { ref, newest }
}
