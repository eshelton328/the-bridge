// Keeps a live chat's transcript at its newest entry. The chat opens at the
// end of its transcript, and it stays there while entries come in or change,
// the pane resizes or the keyboard opens, unless the reader scrolled up; once
// the reader scrolls back to the end, it follows again. The scroller is the
// body of the ChatPane's ScrollFrame, which takes no ref, so the hook finds
// it from an element in the frame's footer. A MutationObserver sees each new
// or changed entry before the browser paints it, and a ResizeObserver sees a
// size change, such as a late transcript read or a resized pane.
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

/** How near the end, in px, still counts as the end: a scroll position can be a fraction short of it. */
const endSlack = 2

const atEnd = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight <= endSlack
const toEnd = (el: HTMLElement) => {
  el.scrollTop = el.scrollHeight
}

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
    const follow = () => {
      if (pinnedRef.current) toEnd(scroller)
    }
    const onScroll = () => {
      pinnedRef.current = atEnd(scroller)
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
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      mutation.disconnect()
      resize.disconnect()
    }
  }, [enabled, scroller, key])
  return ref
}
