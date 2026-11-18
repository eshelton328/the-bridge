// Scrolls the item's tab list so its selected tab shows (M15 `item tabs`
// 474:1050: "The tabs scroll sideways"). The library's ItemTabs scrolls
// sideways on a narrow screen but does not scroll its selected tab into view
// (LIBRARY_GAPS.md, Item tab width), so on the phone Activity, the last tab,
// would open past the screen's edge. The element around the tabs finds the
// list and its selected tab and sets the list's `scrollLeft` by `tabScroll`
// (activityView.ts), again for each `tab`, each time the list's size
// changes (a tablet resized to the phone's width with Activity selected)
// and once the web fonts have loaded: the first scroll runs with the
// fallback font's narrower labels, which left M15's Activity 1.3 px past
// the list's end with its middle inside, so each scroll is measured from
// the unscrolled list. Each scroll is measured in layout px: the Claude
// Design canvas and ViewportFrame may scale the frame with a CSS
// transform, where getBoundingClientRect() gives scaled px and scrollLeft
// layout px, so the tab's place in the list is divided by the scale.
import { useLayoutEffect, useRef } from 'react'
import { tabScroll } from './activityView.ts'

/**
 * Sets the list's `scrollLeft` as `tabScroll` gives it for the unscrolled list, so a later scroll does not depend on
 * an earlier one: a tab whose middle shows in the unscrolled list puts the list back at 0, and a tab past its end
 * ends at the list's end, even when an earlier scroll, measured with the fallback font, left its middle inside. The
 * list and the tab are measured in layout px, the unit of `scrollLeft`, also when a CSS transform scales the list.
 */
function scrollToSelected(list: Element) {
  const selected = list.querySelector('[role="tab"][aria-selected="true"]')
  if (selected === null || !(list instanceof HTMLElement)) return
  const box = list.getBoundingClientRect()
  const tab = selected.getBoundingClientRect()
  // offsetWidth is rounded to whole px, so a gap under 1 px is no scale.
  const width = list.offsetWidth
  const scale = width === 0 || Math.abs(box.width - width) < 1 ? 1 : box.width / width
  const scrolled = list.scrollLeft
  const at = tabScroll(
    { left: 0, right: box.width / scale, scrollLeft: 0 },
    { left: (tab.left - box.left) / scale + scrolled, right: (tab.right - box.left) / scale + scrolled },
  )
  list.scrollLeft = at ?? 0
}

/** A ref around the item's tabs; the list scrolls to its selected tab, again for each `tab`, resize and font load. */
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
    let mounted = true
    void document.fonts.ready.then(() => {
      if (mounted) scrollToSelected(list)
    })
    return () => {
      mounted = false
      observer.disconnect()
    }
  }, [tab])
  return ref
}
