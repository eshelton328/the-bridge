// What a long press needs on the phone (M9 146:42): holding a finger still on
// the children for about half a second calls `onHold`. A finger that moves
// cancels the hold, so a scroll never fires it, and the click that ends a
// hold does not reach the children (a held row does not open its chat). The
// area turns off Safari's text selection and callout, so the hold reaches
// the page. Props only.
import { type PointerEvent, type ReactNode, useEffect, useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'

/** How long a finger rests before the hold fires, in ms (M9's note: about half a second). */
const holdMs = 500
/** How far a finger may drift, in px, before the hold is a scroll or a drag. */
const slop = 8

const area = css({ userSelect: 'none', WebkitTouchCallout: 'none' })

export type HoldAreaProps = {
  children: ReactNode
  /** Called once the hold lasts; without it, the area is a plain box. */
  onHold?: (() => void) | undefined
  className?: string | undefined
  'data-figma'?: string | undefined
}

export function HoldArea({ children, onHold, className, 'data-figma': figma }: HoldAreaProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const startRef = useRef<{ x: number; y: number } | undefined>(undefined)
  const heldRef = useRef(false)
  const cancel = () => {
    clearTimeout(timerRef.current)
    timerRef.current = undefined
    startRef.current = undefined
  }
  useEffect(() => cancel, [])
  if (onHold === undefined)
    return (
      <div className={className} data-figma={figma}>
        {children}
      </div>
    )
  return (
    <div
      className={className === undefined ? area : `${area} ${className}`}
      data-figma={figma}
      onPointerDown={(event: PointerEvent) => {
        if (event.button !== 0) return
        heldRef.current = false
        startRef.current = { x: event.clientX, y: event.clientY }
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          heldRef.current = true
          cancel()
          onHold()
        }, holdMs)
      }}
      onPointerMove={(event: PointerEvent) => {
        const from = startRef.current
        if (from === undefined) return
        if (Math.hypot(event.clientX - from.x, event.clientY - from.y) > slop) cancel()
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      onClickCapture={(event) => {
        if (!heldRef.current) return
        heldRef.current = false
        event.preventDefault()
        event.stopPropagation()
      }}
    >
      {children}
    </div>
  )
}
