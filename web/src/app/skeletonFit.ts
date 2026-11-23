// The fit check of a page's loading skeleton (R58, the loading standard: the same rows, heights and gaps as the
// loaded page). The skeleton and the loaded screen mark the same blocks with `data-fit`: the header, the chips, the
// tools, the status line, the first group's header, and `items`, whose first two children are the first two rows or
// cards. `fitRects` reads each block's top and height; `fitGaps` lists each block that moved or changed height by more
// than `fitTolerancePx` between the two.
const fitTolerancePx = 2

export type FitRect = { readonly top: number; readonly height: number }

/** The blocks of the first `[data-fit]` of each name, and the first two items, by name (`items.0`, `items.1`). */
export function fitRects(root: ParentNode = document): Map<string, FitRect> {
  const rects = new Map<string, FitRect>()
  const add = (name: string, el: Element | null | undefined) => {
    if (el === null || el === undefined || rects.has(name)) return
    const box = el.getBoundingClientRect()
    rects.set(name, { top: Math.round(box.top), height: Math.round(box.height) })
  }
  for (const el of root.querySelectorAll('[data-fit]')) {
    const name = el.getAttribute('data-fit') ?? ''
    if (name === 'items') {
      if (rects.has('items.0')) continue
      add('items.0', el.children[0])
      add('items.1', el.children[1])
    } else add(name, el)
  }
  return rects
}

/** Each block both read that differs by more than the tolerance, as "<name>: top a→b, height c→d". */
export function fitGaps(skeleton: Map<string, FitRect>, loaded: Map<string, FitRect>): string[] {
  const gaps: string[] = []
  for (const [name, was] of skeleton) {
    const now = loaded.get(name)
    if (now === undefined) continue
    if (Math.abs(was.top - now.top) > fitTolerancePx || Math.abs(was.height - now.height) > fitTolerancePx)
      gaps.push(
        `${name}: top ${String(was.top)}→${String(now.top)}, height ${String(was.height)}→${String(now.height)}`,
      )
  }
  return gaps
}
