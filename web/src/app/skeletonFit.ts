// The fit check of a page's loading skeleton (R58, the loading standard: the same rows, heights and gaps as the
// loaded page). The skeleton and the loaded screen mark the same blocks with `data-fit`: the header, the chips, the
// tools, the status line, the first group's header, and `items`, whose first two children are the first two rows or
// cards. `fitRects` reads each block's top, height, left and width; `fitGaps` lists each block that moved or changed size
// by more than `fitTolerancePx` between the two. A block marked `data-fit-width="content"` is as wide as its text,
// which has no counts while the page loads, so its width is left out.
const fitTolerancePx = 2

export type FitRect = {
  readonly top: number
  readonly height: number
  readonly left: number
  readonly width: number
  /** Marked `data-fit-width="content"`: a row as wide as its text, whose width the check leaves out. */
  readonly contentWidth: boolean
}

/** The blocks of the first `[data-fit]` of each name, and the first two items, by name (`items.0`, `items.1`). */
export function fitRects(root: ParentNode = document): Map<string, FitRect> {
  const rects = new Map<string, FitRect>()
  const add = (name: string, el: Element | null | undefined) => {
    if (el === null || el === undefined || rects.has(name)) return
    const box = el.getBoundingClientRect()
    rects.set(name, {
      top: Math.round(box.top),
      height: Math.round(box.height),
      left: Math.round(box.left),
      width: Math.round(box.width),
      contentWidth: el.getAttribute('data-fit-width') === 'content',
    })
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

/**
 * Each block both read that differs by more than the tolerance in top, height, left or width, as "<name>: top a→b,
 * height c→d, left e→f, width g→h".
 */
export function fitGaps(skeleton: Map<string, FitRect>, loaded: Map<string, FitRect>): string[] {
  const gaps: string[] = []
  for (const [name, was] of skeleton) {
    const now = loaded.get(name)
    if (now === undefined) continue
    // A row as wide as its text (the chips, the status line) has no counts while the page loads, as R58 draws it, so
    // it grows to the right when they come; its top, height and left still count.
    const sides = was.contentWidth
      ? (['top', 'height', 'left'] as const)
      : (['top', 'height', 'left', 'width'] as const)
    if (sides.some((side) => Math.abs(was[side] - now[side]) > fitTolerancePx))
      gaps.push(`${name}: ${sides.map((side) => `${side} ${String(was[side])}→${String(now[side])}`).join(', ')}`)
  }
  return gaps
}
