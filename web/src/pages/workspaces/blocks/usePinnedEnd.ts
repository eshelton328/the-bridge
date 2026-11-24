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
// focus moves to an entry in it (Tab, a link or a screen reader's next item),
// never when the focus goes to the transcript's body itself, as a tap on it
// does: that tap closes the keyboard, and iOS's scroll after it went far up
// and unpinned the end after a send (R61). Once the
// reader has left the end, no scroll is moved back: a fling's scroll events
// after the finger lifts keep the place. A scroll away from the end that no
// input explains goes back to the end in the same frame, before the browser
// paints, only while the page itself has just moved the layout: within
// `layoutScrollMs`, or `layoutSteps` rendering steps when frames run slow,
// of a resize of the transcript or the composer, a
// visualViewport or window resize (the keyboard), an entry added or removed,
// or the page back on screen. iOS made such a scroll after Send closed the
// keyboard (R33): its trace has the scroll 1.29 s after Send, 1.25 s after the
// keyboard closed and 0.59 s after the cleared draft shrank the composer.
// Any other scroll away from the end unpins, as the reader's does: VoiceOver's
// three-finger swipe, Find in page and other assistive or browser scrolls send
// no input this hook sees. A scroll of any kind that reaches the end pins
// again. The reader's scroll up can land before its scroll event, just as
// an entry comes in or a box resizes; the pin then leaves the end with it
// and does not move it back (the CI failure of the-bridge#478). The
// reader's input counts for `readerScrollMs`, or `layoutSteps` rendering
// steps when frames run slow, so a long frame between the input and its
// scroll event does not turn the reader's scroll into the page's (#469).
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
//
// The reader's place (R62). Away from the end, an entry that changes above
// the view, such as a reply's first draft that folds away once its rewrite
// comes, must not move what the reader sees. Safari keeps no place by itself
// (Chromium's CSS scroll anchoring does), so the hook keeps it: after each
// scroll it notes each entry in view and how far below the view's top it
// starts, and after each change of the entries or their sizes it moves the
// scroll so the first of those entries still there starts where it did. A
// reader at the end keeps the pin, as before.
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

/** How near the end, in px, still counts as the end: a scroll position can be a fraction short of it. */
const endSlack = 2

/**
 * How long, in ms, after the reader's last wheel turn, scroll key, lifted finger or focus move into the transcript a
 * scroll still counts as theirs.
 */
const readerScrollMs = 500

/**
 * How long, in ms, after the page moved the layout (see the header) a scroll away from the end with no input still
 * counts as the browser's and goes back to the end. The R33 trace's stray scroll came 591 ms after the composer's last
 * resize and 1248 ms after the keyboard closed; 1500 ms covers both, since either may be what iOS answered.
 */
const layoutScrollMs = 1500

/**
 * How many rendering steps after the page moved the layout a scroll with no input still goes back to the end, however
 * long those steps take: a busy device can hold a frame past `layoutScrollMs`, and the scroll the layout change itself
 * makes comes in the next steps.
 */
const layoutSteps = 3

/** The keys that scroll a focused scroller. */
const scrollKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '])

/** How long a smooth scroll to the end may take before the transcript jumps there, in ms. */
const seekLimitMs = 1200

/** The attribute on the button's slot in the scroller: a change inside it is not an entry, a press in it not the reader's. */
export const newestSlot = 'data-newest-slot'

const scrollIdleMs = 150
const fromEnd = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight
const atEnd = (el: HTMLElement) => fromEnd(el) <= endSlack
const toEnd = (el: HTMLElement) => {
  el.scrollTop = el.scrollHeight
}
/** The attribute on the line that loads older entries (`EarlierLine`): no entry, so the place holds by those under it. */
export const earlierSlot = 'data-earlier-slot'

const ours = (node: EventTarget | Node | null) =>
  node instanceof Element && node.closest(`[${newestSlot}], [${earlierSlot}]`) !== null
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
 * `last` is the transcript's newest entry: a new one while the reader is away dots the button, even when the
 * transcript keeps its length and its entries' elements (at the entry limit).
 */
export function usePinnedEnd(
  enabled: boolean,
  key: string,
  last: unknown,
): { ref: (el: HTMLElement | null) => void; newest: Newest; idle: () => Promise<void> } {
  const [frame, setFrame] = useState<{ scroller: HTMLElement; footer: HTMLElement } | null>(null)
  const scroller = frame?.scroller ?? null
  const footer = frame?.footer ?? null
  const [newest] = useState(newestStore)
  const pinnedRef = useRef(true)
  // The last scroll event: an older page waits for `idle` (no scroll for `scrollIdleMs`), as iOS drops the pin's
  // scroll write during its momentum scroll, and the reader would land a page away (the #491 Simulator run).
  const scrolledRef = useRef(Number.NEGATIVE_INFINITY)
  // A finger on the transcript: the page also waits while it is down, as a held finger moves nothing and gives no
  // scroll event, but iOS would drop the pin's write when it moves again. Its lift starts the 150 ms again.
  const touchDownRef = useRef(false)
  const idle = useCallback(
    () =>
      new Promise<void>((resolve) => {
        const check = () => {
          const left = touchDownRef.current ? scrollIdleMs : scrolledRef.current + scrollIdleMs - performance.now()
          if (left <= 0) resolve()
          else setTimeout(check, left)
        }
        check()
      }),
    [],
  )
  // Marks new entries while the reader is away; set while the pin runs.
  const cameRef = useRef<(() => void) | undefined>(undefined)
  const ref = useCallback((el: HTMLElement | null) => {
    const body = el?.closest('.scroll-frame__root')?.querySelector(':scope > .scroll-frame__body')
    setFrame((now) => {
      if (el === null || !(body instanceof HTMLElement)) return null
      return now?.scroller === body && now.footer === el ? now : { scroller: body, footer: el }
    })
  }, [])
  useLayoutEffect(() => {
    if (!enabled || scroller === null || footer === null) return undefined
    pinnedRef.current = true
    const view = scroller.ownerDocument.defaultView ?? window
    // The reader's input: a finger that moves on the transcript, a mouse button down in it, and the time of the
    // last wheel turn, scroll key, lifted finger or focus move into the transcript.
    // `steps` counts the rendering steps since that input: a busy device can hold a frame past `readerScrollMs`, and
    // the scroll the input made comes in the next steps (the CI failures of the-bridge#469).
    const reader = { touching: false, dragging: false, last: Number.NEGATIVE_INFINITY, steps: layoutSteps }
    let readerFrame: number | undefined
    const readerStep = () => {
      reader.steps += 1
      readerFrame = reader.steps < layoutSteps ? view.requestAnimationFrame(readerStep) : undefined
    }
    const readerInput = () => {
      reader.last = performance.now()
      reader.steps = 0
      readerFrame ??= view.requestAnimationFrame(readerStep)
    }
    const readerScrolls = () =>
      reader.touching ||
      reader.dragging ||
      reader.steps < layoutSteps ||
      performance.now() - reader.last < readerScrollMs
    // When the page last moved the layout, and how many rendering steps ran since; the chat's opening counts.
    let laidOut = Number.NEGATIVE_INFINITY
    let steps = layoutSteps
    let stepFrame: number | undefined
    const step = () => {
      steps += 1
      stepFrame = steps < layoutSteps ? view.requestAnimationFrame(step) : undefined
    }
    const layoutMoved = () => {
      laidOut = performance.now()
      steps = 0
      stepFrame ??= view.requestAnimationFrame(step)
    }
    const layoutScrolls = () => steps < layoutSteps || performance.now() - laidOut < layoutScrollMs
    layoutMoved()
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
    // Where the pin last held the end. The reader's scroll up can land before its scroll event, after an entry came
    // in or a box resized: it is then above this place, and the pin leaves the end rather than move it back.
    let endTop = scroller.scrollTop
    const follow = () => {
      if (!pinnedRef.current || seeking) return
      if (readerScrolls() && scroller.scrollTop < endTop - endSlack) {
        pinnedRef.current = false
        return
      }
      toEnd(scroller)
      endTop = scroller.scrollTop
    }
    // The entries in view while the reader is away from the end, each with how far below the view's top it starts, and
    // the scroll position then.
    let place: { readonly entry: Element; readonly top: number }[] = []
    let placeScroll = 0
    const notePlace = () => {
      place = []
      placeScroll = scroller.scrollTop
      if (pinnedRef.current) return
      const top = scroller.getBoundingClientRect().top
      const bottom = top + scroller.clientHeight
      for (const entry of scroller.children) {
        if (ours(entry)) continue
        const box = entry.getBoundingClientRect()
        if (box.top >= bottom) break
        if (box.bottom > top) place.push({ entry, top: box.top - top })
      }
    }
    // Moves the scroll by how far the layout above moved the first noted entry still in the transcript. The scroll's
    // own movement since the note is the reader's (its scroll event may not have come yet), so it is not undone.
    const keepPlace = () => {
      if (pinnedRef.current) return
      const held = place.find(({ entry }) => entry.parentElement === scroller)
      if (held === undefined) return
      const shown = held.entry.getBoundingClientRect().top - scroller.getBoundingClientRect().top
      const moved = shown - held.top + (scroller.scrollTop - placeScroll)
      if (Math.abs(moved) < 1) return
      scroller.scrollTop += moved
      placeScroll += moved
    }
    const onScroll = () => {
      scrolledRef.current = performance.now()
      if (atEnd(scroller)) {
        endTop = scroller.scrollTop
        pinnedRef.current = true
        stopSeeking()
      } else if (readerScrolls()) {
        pinnedRef.current = false
        stopSeeking()
      }
      // Pinned, the reader did not move it and the page just moved the layout: back to the end before the browser
      // paints this frame. The button's glide to the end (`seeking`) is not moved back.
      else if (pinnedRef.current && (seeking || layoutScrolls())) follow()
      // A scroll no input and no layout change explains, such as VoiceOver's or Find in page's: the reader's.
      else pinnedRef.current = false
      notePlace()
      show()
    }
    const onTouchMove = () => {
      reader.touching = true
    }
    const onTouchStart = () => {
      touchDownRef.current = true
    }
    const onTouchEnd = () => {
      if (touchDownRef.current) {
        touchDownRef.current = false
        scrolledRef.current = performance.now()
      }
      if (!reader.touching) return
      reader.touching = false
      readerInput()
    }
    // A wheel turn.
    const onReader = (event: Event) => {
      if (!ours(event.target)) readerInput()
    }
    // A focus that moves to an entry in the transcript, which scrolls it into view. The focus on the body itself
    // scrolls nothing: a tap on the transcript off a control gives it the focus and closes the keyboard, and the
    // scroll iOS makes then with no touch is not the reader's (screen review R61).
    const onFocusIn = (event: FocusEvent) => {
      if (event.target !== scroller) onReader(event)
    }
    const onKey = (event: KeyboardEvent) => {
      if (scrollKeys.has(event.key) && !typing(event.target)) readerInput()
    }
    // A mouse press in the transcript: on its scroll bar, or the start of a text selection, which scrolls the
    // transcript when the drag passes its top or bottom edge.
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && !ours(event.target)) reader.dragging = true
    }
    const onPointerUp = () => {
      if (!reader.dragging) return
      reader.dragging = false
      readerInput()
    }
    // Back from the background: entries may have come in while the page could not draw them.
    const onShow = () => {
      if (scroller.ownerDocument.visibilityState !== 'visible') return
      layoutMoved()
      follow()
    }
    // A size change, such as the keyboard opening or a shrunk pane, can carry the reader past a screen from the end.
    // The transcript's or the composer's own box moving is the page's layout change; an entry that grows as its text
    // streams in is not, so a reader's VoiceOver scroll during a reply is not moved back.
    const resize = new ResizeObserver((sizes) => {
      if (sizes.some((size) => size.target === scroller || size.target === footer)) layoutMoved()
      keepPlace()
      follow()
      notePlace()
      show()
    })
    // Observed once: observing again reports the size again, which would read as a layout change on each entry.
    resize.observe(scroller)
    resize.observe(footer)
    const observeAll = () => {
      for (const child of scroller.children) resize.observe(child)
    }
    const mutation = new MutationObserver((records) => {
      const real = records.filter(
        (r) => !ours(r.target) && !(r.target === scroller && [...r.addedNodes, ...r.removedNodes].every(ours)),
      )
      if (real.length === 0) return
      if (real.some((r) => r.target === scroller && [...r.addedNodes, ...r.removedNodes].some((n) => !ours(n))))
        layoutMoved()
      // An older page that lands above the reader's place dots nothing.
      const above = (n: Node) =>
        ((place[0]?.entry.compareDocumentPosition(n) ?? 0) & Node.DOCUMENT_POSITION_PRECEDING) > 0
      if (
        !pinnedRef.current &&
        real.some((r) => r.target === scroller && [...r.addedNodes].some((n) => !ours(n) && !above(n)))
      )
        unseen = true
      observeAll()
      // An entry that comes in while the button's scroll runs moves its goal to the new end.
      if (seeking) scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
      keepPlace()
      follow()
      notePlace()
      show()
    })
    cameRef.current = () => {
      if (pinnedRef.current) return
      unseen = true
      show()
    }
    newest.bind(() => {
      // The button asks for the end: what the reader did before it is over.
      reader.touching = false
      reader.dragging = false
      reader.last = Number.NEGATIVE_INFINITY
      reader.steps = layoutSteps
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
    scroller.addEventListener('touchstart', onTouchStart, passive)
    scroller.addEventListener('touchmove', onTouchMove, passive)
    scroller.addEventListener('wheel', onReader, passive)
    scroller.addEventListener('focusin', onFocusIn)
    scroller.addEventListener('pointerdown', onPointerDown, passive)
    view.addEventListener('touchend', onTouchEnd, passive)
    view.addEventListener('touchcancel', onTouchEnd, passive)
    view.addEventListener('pointerup', onPointerUp, passive)
    view.addEventListener('pointercancel', onPointerUp, passive)
    view.addEventListener('keydown', onKey, { capture: true, passive: true })
    view.addEventListener('pageshow', onShow)
    scroller.ownerDocument.addEventListener('visibilitychange', onShow)
    // The keyboard opening or closing, before the transcript's box follows it.
    view.addEventListener('resize', layoutMoved, passive)
    view.visualViewport?.addEventListener('resize', layoutMoved, passive)
    return () => {
      if (stepFrame !== undefined) view.cancelAnimationFrame(stepFrame)
      if (readerFrame !== undefined) view.cancelAnimationFrame(readerFrame)
      stopSeeking()
      newest.bind(undefined)
      cameRef.current = undefined
      newest.set(hidden)
      scroller.removeEventListener('scroll', onScroll)
      scroller.removeEventListener('touchstart', onTouchStart)
      scroller.removeEventListener('touchmove', onTouchMove)
      scroller.removeEventListener('wheel', onReader)
      scroller.removeEventListener('focusin', onFocusIn)
      scroller.removeEventListener('pointerdown', onPointerDown)
      view.removeEventListener('touchend', onTouchEnd)
      view.removeEventListener('touchcancel', onTouchEnd)
      view.removeEventListener('pointerup', onPointerUp)
      view.removeEventListener('pointercancel', onPointerUp)
      view.removeEventListener('keydown', onKey, { capture: true })
      view.removeEventListener('pageshow', onShow)
      scroller.ownerDocument.removeEventListener('visibilitychange', onShow)
      view.removeEventListener('resize', layoutMoved)
      view.visualViewport?.removeEventListener('resize', layoutMoved)
      mutation.disconnect()
      resize.disconnect()
    }
  }, [enabled, scroller, footer, key, newest])
  // After the pin's own effect, so a new chat (`key`) opens pinned and its entries dot nothing.
  useLayoutEffect(() => {
    cameRef.current?.()
  }, [last])
  return { ref, newest, idle }
}
