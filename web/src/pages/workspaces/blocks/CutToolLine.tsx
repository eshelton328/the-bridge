// A tool line or an event line that opens its full text on a tap when its one line is cut (NCC-147). d-131 lets a
// tool-call line stay one line because "it expands on tap"; the library's ToolLine expands only with onOpenChange and
// output, so a cut line gets both, with its full text as the output (mono, wrapped). A line that fits stays as Figma
// draws it, with no chevron and no button. The cut is measured on the line's text, as the library's TruncatedText
// measures it, and again on each resize; a line that is open stays a button until it closes. The full text is in the
// page only while the line is open, so a closed line holds no hidden copy of its text. Props only.
import { ToolLine } from '@eshelton328/component-library-1701'
import { useLayoutEffect, useRef, useState } from 'react'
import { css } from '../../../../styled-system/css/index.js'

// The wrapper holds the ref. It is a box, as the transcript's pin measures each entry's box (`usePinnedEnd`), and it
// can shrink below the text, so a long line still truncates in the event line's grid.
const wrap = css({ minW: '[0]' })

export type CutToolLineProps = {
  /** The tool, or an event's text. */
  name: string
  target?: string | undefined
  state: 'running' | 'done'
  /** The state's name for assistive technology, such as "Error" for an event. */
  stateLabel?: string | undefined
}

export function CutToolLine({ name, target, state, stateLabel }: CutToolLineProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [cut, setCut] = useState(false)
  const [open, setOpen] = useState(false)
  const expandable = cut || open
  const text = target === undefined || target === '' ? name : `${name} ${target}`
  useLayoutEffect(() => {
    // The header is a div or a button by `expandable`, so the text element is found again after each change.
    const line = ref.current?.querySelector('.tool-line__text .truncated-text')
    if (!(line instanceof HTMLElement)) return
    const measure = () => {
      setCut(line.scrollWidth > line.clientWidth)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(line)
    return () => {
      observer.disconnect()
    }
  }, [expandable, text])
  return (
    <div ref={ref} className={wrap}>
      <ToolLine
        name={name}
        target={target}
        state={state}
        stateLabel={stateLabel}
        open={open}
        onOpenChange={expandable ? setOpen : undefined}
      >
        {/* The library makes the line a button only when it has output, so a closed cut line gets an empty one. */}
        {expandable ? open ? text : <span /> : null}
      </ToolLine>
    </div>
  )
}
