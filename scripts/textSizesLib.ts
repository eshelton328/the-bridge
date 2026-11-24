// The pure parts of `pnpm check:text-sizes` (d-122): which window each
// state renders in, which measured text is cut, and which cuts are new at
// a larger text size. checkTextSizes.ts measures in the browser and calls
// these; textSizesLib.test.ts tests them.

/** A box in CSS px, as getBoundingClientRect gives it. */
export type Edges = { left: number; top: number; right: number; bottom: number }

/** One run of text on the page, as the browser measured it. */
export type TextMeasure = {
  /** The element's path from <body> (tag and child index), the same at each text size. */
  key: string
  /** The start of the text, for the report. */
  text: string
  /** The text's own box (a Range over its text node). */
  box: Edges
  /** The box of the element that holds the text. */
  holder: Edges
  /** Whether the holder lets the text overflow its box (overflow visible on both axes). */
  holderVisible: boolean
  /**
   * The boxes of the ancestors that cut what overflows them (overflow hidden or clip), from the holder up to the
   * first one that scrolls: text in a scroll box may lie past its edge, so the walk stops there.
   */
  clippers: Edges[]
  /** Whether the holder or an ancestor ends the text with an ellipsis or a line clamp (TruncatedText). */
  truncated: boolean
  /** Whether that ellipsis or clamp hides text now (its box scrolls wider or taller than it shows). */
  truncatedCuts: boolean
}

/** A text run the page cuts or lets spill out of its box. */
export type TextProblem = { key: string; text: string; kind: 'clipped' | 'overflow' | 'truncated'; by: number }

/** The window for each layout: the owner's phone, an iPad in portrait and the MacBook Pro. */
export const windows = {
  phone: { width: 390, height: 844 },
  tablet: { width: 744, height: 1133 },
  desktop: { width: 1512, height: 982 },
} as const
export type Layout = keyof typeof windows

/** The layout of a state file's first frame (`viewport: 'phone'`), or undefined. */
export function layoutOf(stateSource: string): Layout | undefined {
  const m = /\bviewport:\s*['"](phone|tablet|desktop)['"]/.exec(stateSource)
  const v = m?.[1]
  return v === 'phone' || v === 'tablet' || v === 'desktop' ? v : undefined
}

/** How far `inner` sticks out of `outer` on its worst side, in px (0 when inside). */
export function outBy(inner: Edges, outer: Edges): number {
  return Math.max(
    0,
    outer.left - inner.left,
    inner.right - outer.right,
    outer.top - inner.top,
    inner.bottom - outer.bottom,
  )
}

/** Sub-pixel rounding lets a box stick out by less than this with no visible cut. */
const tolerance = 1

/**
 * The problems of one page: text that an ancestor cuts, that spills out of a holder that lets it overflow, or
 * that an ellipsis or a line clamp hides. An ellipsis is the design where Small already shows one there; at a
 * larger size a new one hides text, which d-122 forbids ("never clip, never ellipsis"), so newProblems keeps it.
 */
export function problemsOf(measures: readonly TextMeasure[]): TextProblem[] {
  const out: TextProblem[] = []
  for (const m of measures) {
    if (m.truncated) {
      if (m.truncatedCuts) out.push({ key: m.key, text: m.text, kind: 'truncated', by: 0 })
      continue
    }
    const clipped = Math.max(0, ...m.clippers.map((c) => outBy(m.box, c)))
    if (clipped > tolerance) {
      out.push({ key: m.key, text: m.text, kind: 'clipped', by: Math.round(clipped) })
      continue
    }
    const spill = m.holderVisible ? Math.max(0, m.box.right - m.holder.right, m.holder.left - m.box.left) : 0
    if (spill > tolerance) out.push({ key: m.key, text: m.text, kind: 'overflow', by: Math.round(spill) })
  }
  return out
}

/**
 * The problems at a larger size that Small does not have. Small is the designs' size, checked by the fidelity tools,
 * so a cut it already shows is the design's (a hidden label, a scrolled list) and not the text size's.
 */
export function newProblems(small: readonly TextProblem[], larger: readonly TextProblem[]): TextProblem[] {
  const base = new Set(small.map((p) => `${p.kind} ${p.key}`))
  return larger.filter((p) => !base.has(`${p.kind} ${p.key}`))
}

/** How many problems one page has at each size: every one at Small, and only the new ones at Default and Large. */
export type SizeCounts = { small: number; default: number; large: number }

/**
 * Adds one state's problems to its page's counts, for the report only: the check passes or fails on the new
 * problems at Default and Large, as before. Small counts every problem found at Small, so a cut the design
 * already has shows there and is never hidden (bridge-coord, 2026-11-24).
 */
export function addCounts(
  counts: Record<string, SizeCounts>,
  page: string,
  small: readonly TextProblem[],
  fresh: { default: readonly TextProblem[]; large: readonly TextProblem[] },
): void {
  const c = counts[page] ?? { small: 0, default: 0, large: 0 }
  counts[page] = {
    small: c.small + small.length,
    default: c.default + fresh.default.length,
    large: c.large + fresh.large.length,
  }
}
