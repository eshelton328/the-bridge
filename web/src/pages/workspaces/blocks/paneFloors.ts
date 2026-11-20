// The least height of each pane of a stacked split (herdr's `column`, slice
// 3a): its header and its composer, so a pane is never too low to use. The
// library has no token for that height, so `floorOf` measures it in the
// drawn pane: its top to the end of its composer. `withFloors` raises
// each share under its floor, taking the room from the largest panes.

/** The attribute on the part of a pane's body that must stay in view, such as a chat's composer. */
const paneFloorAttribute = 'data-pane-floor'

/** The padding and border below the content of `element`, in px. */
function below(element: Element): number {
  const style = getComputedStyle(element)
  return (Number.parseFloat(style.paddingBottom) || 0) + (Number.parseFloat(style.borderBottomWidth) || 0)
}

/** `element` scrolls its content up and down. */
function scrolls(element: Element): boolean {
  const overflow = getComputedStyle(element).overflowY
  return overflow === 'auto' || overflow === 'scroll'
}

/**
 * The least height of the pane in `panel`, in px: from its top to the end of its last part marked
 * `paneFloorAttribute` (a chat's composer) at that part's full height, else to the top of what scrolls (a shell's
 * lines), with the padding and border below it in each box up to the pane. What scrolls can shrink to nothing, so
 * the pane's height now does not count. 0 when the panel holds no pane.
 */
export function floorOf(panel: Element): number {
  const pane = panel.querySelector('section')
  if (pane === null) return 0
  const kept = [...pane.querySelectorAll(`[${paneFloorAttribute}]`)].at(-1)
  const anchor = kept ?? [...pane.querySelectorAll('*')].find(scrolls)
  if (anchor === undefined) return pane.getBoundingClientRect().height
  let end = anchor.getBoundingClientRect().top - pane.getBoundingClientRect().top + (kept?.scrollHeight ?? 0)
  for (let box = anchor.parentElement; box !== null && pane.contains(box); box = box.parentElement) end += below(box)
  return end
}

/** `shares` rounded to 0.01, the largest taking what makes 100. */
function rounded(shares: readonly number[]): number[] {
  const out = shares.map((s) => Math.round(s * 100) / 100)
  const largest = out.indexOf(Math.max(...out))
  out[largest] = Math.round((100 - out.reduce((sum, s, i) => (i === largest ? sum : sum + s), 0)) * 100) / 100
  return out
}

/**
 * `shares` (percent, one for each pane, making 100) with each pane at least its floor (`floors`, percent): a pane
 * under its floor takes the missing room from the largest pane, then the next largest, never taking one under its own
 * floor. When the floors make more than 100, each pane gets its floor's part of 100.
 */
export function withFloors(shares: readonly number[], floors: readonly number[]): number[] {
  const floor = (i: number) => floors[i] ?? 0
  const total = shares.reduce((sum, _, i) => sum + floor(i), 0)
  if (total >= 100) return rounded(shares.map((_, i) => (floor(i) / total) * 100))
  const out = [...shares]
  for (const [i, share] of shares.entries()) {
    let missing = floor(i) - share
    if (missing <= 0) continue
    out[i] = floor(i)
    const largest = [...out.keys()].filter((j) => j !== i).sort((a, b) => (out[b] ?? 0) - (out[a] ?? 0))
    for (const j of largest) {
      const spare = (out[j] ?? 0) - floor(j)
      const given = Math.min(spare, missing)
      if (given <= 0) continue
      out[j] = (out[j] ?? 0) - given
      missing -= given
      if (missing <= 0) break
    }
  }
  return rounded(out)
}
