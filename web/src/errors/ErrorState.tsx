// The one module every fallback renders through (d-086): the library's
// ErrorState, plus focus. A `page` state has no live region, so this moves
// focus to its heading when it appears and a screen reader reads it out.
// A `pane` or `inline` state is an alert and needs nothing more.
import { ErrorState as LibraryErrorState, type ErrorStateProps } from '@eshelton328/component-library-1701'
import { useEffect, useRef } from 'react'

export type { ErrorStateProps }

export function ErrorState(props: ErrorStateProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const page = (props.size ?? 'page') === 'page'
  useEffect(() => {
    if (page) headingRef.current?.focus()
  }, [page])
  return <LibraryErrorState {...props} headingRef={page ? headingRef : props.headingRef} />
}
