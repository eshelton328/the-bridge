// Measures whether the Links graph's open item cuts its name (LIBRARY_GAPS.md,
// Links graph): MapNode's label style leaves a name 104 px of Figma's 150 px
// node, so writing-reviewer (T29, M32, D30) would end in an ellipsis. The
// graph then draws the open item as wide as the side items (`widenFocus` in
// linksView.ts). The name is measured in the DOM MapGraph draws, after each
// render and again once the web fonts have loaded, as `useTabInView` does.
import { type RefObject, useLayoutEffect } from 'react'
import { focusId, type LinksGraph } from './linksView.ts'

/** Whether the open item's name is cut: any element of its label slot (MapNode's last child) is wider than its box. */
function focusCut(graph: LinksGraph, root: HTMLElement): boolean {
  const index = graph.nodes.findIndex((n) => n.id === focusId)
  const label = root.querySelectorAll('button')[index]?.lastElementChild
  if (label === null || label === undefined) return false
  return [label, ...label.querySelectorAll('*')].some((el) => el.scrollWidth > el.clientWidth)
}

/**
 * Marks the open item `item` wide when its name is cut at Figma's 150 px, measured after each render of a new item
 * and again once the web fonts have loaded (the fallback font's widths differ), as `useTabInView` does.
 */
export function useWideFocus(
  ref: RefObject<HTMLDivElement | null>,
  graph: LinksGraph,
  item: string,
  wide: boolean,
  setWide: (item: string) => void,
) {
  useLayoutEffect(() => {
    const root = ref.current
    if (root === null || wide) return
    if (focusCut(graph, root)) {
      setWide(item)
      return
    }
    let mounted = true
    void document.fonts.ready.then(() => {
      if (mounted && focusCut(graph, root)) setWide(item)
    })
    return () => {
      mounted = false
    }
  })
}
