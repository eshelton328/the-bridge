// Scrolls the line a link names into view (D19, "SKILL.md:8"): the library's
// CodeLines marks each line's number with `data-line` and has no prop to
// scroll to a line or highlight it (LIBRARY_GAPS.md, Code line from a link),
// so the element that holds the code looks the number up and scrolls it into
// the nearest scrolling box.
import { useEffect, useRef } from 'react'

/** A ref for the element around the code; when `line` is set, that line scrolls into view, again for each `file`. */
export function useScrollToLine(line: number | undefined, file: string) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (line === undefined) return
    ref.current?.querySelector(`[data-line="${String(line)}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [line, file])
  return ref
}
