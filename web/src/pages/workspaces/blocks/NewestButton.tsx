// The button to the newest message (the owner's request, 2026-11-21: "a button to
// scroll you all the way down to the bottom of the chat ... centered in the
// width and above the message box"). It shows while the reader is more than a
// screen above the end of a live chat's transcript, centred on the
// transcript's width, a small gap above the composer: its slot is the last
// child of the transcript's scroller and sticks to the scroller's bottom, so
// it never lies over the composer, its file chips or a line under it. A dot
// says new entries came in while the reader was away. A tap scrolls to the end
// and pins the transcript there (`usePinnedEnd`), which hides the button.
//
// It never takes the focus: a press is cancelled at its start (pointerdown,
// mousedown and a non-passive touchstart), so the composer keeps the focus and
// the phone keeps its keyboard up. On a touch screen the cancelled touchstart
// also cancels the click, so the button acts on its touchend. The slot carries
// `data-keyboard-keep`: while the keyboard is up, AppShell blurs the field on
// any other touch press outside a field (library beta.68). The library has
// no round floating button (LIBRARY_GAPS.md: Scroll to newest), so it is an
// icon-only `secondary` Button with the library's indicator dot. Props only.
import { ArrowDownIcon, Button } from '@eshelton328/component-library-1701'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import { type Newest, newestSlot } from './usePinnedEnd.ts'

/** The button's accessible name. */
export const newestLabel = 'Scroll to the newest message'

// Sticks 8 above the scroller's end, over the entries, centred; only the button takes a press.
const slot = css({
  position: 'sticky',
  bottom: '8',
  zIndex: '1',
  alignSelf: 'center',
  display: 'flex',
  justifyContent: 'center',
})

export type NewestButtonProps = {
  /** The pinned transcript's store (`usePinnedEnd`). */
  newest: Newest
}

export function NewestButton({ newest }: NewestButtonProps) {
  const view = useSyncExternalStore(newest.subscribe, newest.view)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const shown = view.shown
  useEffect(() => {
    const button = buttonRef.current
    if (!shown || button === null) return undefined
    const keepFocus = (event: Event) => {
      if (event.cancelable) event.preventDefault()
    }
    // The touch's end on the button is the tap: the cancelled touchstart cancels the click.
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      if (touch === undefined) return
      const box = button.getBoundingClientRect()
      const inside =
        touch.clientX >= box.left &&
        touch.clientX <= box.right &&
        touch.clientY >= box.top &&
        touch.clientY <= box.bottom
      if (event.cancelable) event.preventDefault()
      if (inside) newest.jump()
    }
    const active = { passive: false }
    button.addEventListener('pointerdown', keepFocus)
    button.addEventListener('mousedown', keepFocus)
    button.addEventListener('touchstart', keepFocus, active)
    button.addEventListener('touchend', onTouchEnd, active)
    return () => {
      button.removeEventListener('pointerdown', keepFocus)
      button.removeEventListener('mousedown', keepFocus)
      button.removeEventListener('touchstart', keepFocus)
      button.removeEventListener('touchend', onTouchEnd)
    }
  }, [shown, newest])
  if (!shown) return null
  return (
    <div className={slot} data-keyboard-keep="" {...{ [newestSlot]: '' }}>
      <Button
        ref={buttonRef}
        variant="secondary"
        size="md"
        iconOnly
        indicator={view.unseen}
        aria-label={newestLabel}
        data-unseen={view.unseen ? '' : undefined}
        onClick={(event) => {
          // From the keyboard (no pointer, `detail` 0) the focus goes to the transcript, as the button hides.
          if (event.detail === 0) {
            const transcript = event.currentTarget.closest('.scroll-frame__body')
            if (transcript instanceof HTMLElement) transcript.focus({ preventScroll: true })
          }
          newest.jump()
        }}
      >
        <ArrowDownIcon />
      </Button>
    </div>
  )
}
