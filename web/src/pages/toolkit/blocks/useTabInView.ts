// Scrolls the item's tab list so its selected tab shows (M15 `item tabs`
// 474:1050: "The tabs scroll sideways"). The library's ItemTabs scrolls
// sideways on a narrow screen but does not scroll its selected tab into view
// (LIBRARY_GAPS.md, Item tab width), so on the phone Activity, the last tab,
// would open past the screen's edge. The element around the tabs finds the
// list and its selected tab and sets the list's `scrollLeft` by `tabScroll`
// (activityView.ts), again for each `tab` and each time the list's size
// changes (a tablet resized to the phone's width with Activity selected).
import { useLayoutEffect, useRef } from 'react'
import { tabScroll } from './activityView.ts'

/** Sets the list's `scrollLeft` so its selected tab's middle is inside it. */
function scrollToSelected(list: Element) {
  const selected = list.querySelector('[role="tab"][aria-selected="true"]')
  if (selected === null) return
  const box = list.getBoundingClientRect()
  const at = tabScroll(
    { left: box.left, right: box.right, scrollLeft: list.scrollLeft },
    selected.getBoundingClientRect(),
  )
  if (at !== null) list.scrollLeft = at
}

/** A ref for an element around the item's tabs; the list scrolls to its selected tab, again for each `tab` and resize. */
export function useTabInView(tab: string) {
  const ref = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const list = ref.current?.querySelector('[role="tablist"]')
    if (list === undefined || list === null) return
    scrollToSelected(list)
    const observer = new ResizeObserver(() => {
      scrollToSelected(list)
    })
    observer.observe(list)
    return () => {
      observer.disconnect()
    }
  }, [tab])
  return ref
}
