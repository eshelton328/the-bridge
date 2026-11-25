// The line over a live chat's entries while the server has older ones: in the
// transcript's view it reads the page before the first entry, again after each
// page while it stays in view. A read that missed shows its line with Retry.
// Its slot is no entry (`earlierSlot`), so the pin keeps the reader's place by
// the entries under it. Props only.
import { useEffect, useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import { TranscriptProblem } from './TranscriptProblem.tsx'
import { earlierSlot } from './usePinnedEnd.ts'

const line = css({ display: 'block', textStyle: 'small', color: 'fg.muted' })

export type EarlierLineProps = {
  text: string
  /** The last read missed: the line and Retry, and no read until Retry. */
  missed: boolean
  onLoad: () => void
  /** How many entries show: after each change the line checks again whether it is in view. */
  shown: number
}

export function EarlierLine({ text, missed, onLoad, shown }: EarlierLineProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    const root = el?.closest('.scroll-frame__body')
    if (el === null || missed || !(root instanceof HTMLElement)) return undefined
    // Observing starts with one note of where the line is now, so each new count asks again.
    const seen = new IntersectionObserver(
      (notes) => {
        if (notes.some((note) => note.isIntersecting)) onLoad()
      },
      { root },
    )
    seen.observe(el)
    return () => {
      seen.disconnect()
    }
  }, [missed, onLoad, shown])
  return (
    <div ref={ref} {...{ [earlierSlot]: '' }}>
      {missed ? <TranscriptProblem text={text} onRetry={onLoad} /> : <span className={line}>{text}</span>}
    </div>
  )
}
