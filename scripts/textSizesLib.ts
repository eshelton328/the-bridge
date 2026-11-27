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
  /**
   * How many words of the text break inside the word across two lines ("Opu/s"), as overflow-wrap: anywhere does
   * in a box too narrow for the word. A break after a hyphen or a slash does not count.
   */
  brokenWords?: number | undefined
  /**
   * For a form field (input or textarea): how many px its line is taller than the field's content box, so the
   * placeholder or value is cut at the top or bottom. 0 when the line fits.
   */
  fieldShort?: number | undefined
  /** The box of the first ancestor that scrolls, if any: text past its edge is scrolled out of view. */
  scroller?: Edges | undefined
}

/** A text run the page cuts or lets spill out of its box. */
export type TextProblem = {
  key: string
  text: string
  kind: 'clipped' | 'overflow' | 'truncated' | 'broken-word' | 'field-clipped' | 'overlap'
  by: number
}

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
    if ((m.fieldShort ?? 0) > tolerance) {
      out.push({ key: m.key, text: m.text, kind: 'field-clipped', by: Math.round(m.fieldShort ?? 0) })
      continue
    }
    if ((m.brokenWords ?? 0) > 0) out.push({ key: m.key, text: m.text, kind: 'broken-word', by: m.brokenWords ?? 0 })
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

/** How many px two boxes share on their smaller axis (0 when they do not meet). */
export function overlapBy(a: Edges, b: Edges): number {
  const x = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return x > 0 && y > 0 ? Math.min(x, y) : 0
}

/** Overlap smaller than this is the touching of line boxes, not one text drawn over another. */
const overlapTolerance = 3

/** The part of a run's box that shows: inside its clippers and its scroll box. Null when none of it shows. */
export function shownBox(m: TextMeasure): Edges | null {
  let b = m.box
  for (const c of m.scroller === undefined ? m.clippers : [...m.clippers, m.scroller]) {
    b = {
      left: Math.max(b.left, c.left),
      top: Math.max(b.top, c.top),
      right: Math.min(b.right, c.right),
      bottom: Math.min(b.bottom, c.bottom),
    }
  }
  return b.right > b.left && b.bottom > b.top ? b : null
}

/** Two text runs whose boxes share more than a few px, and the centre of the shared box. */
export type OverlapPair = { a: TextMeasure; b: TextMeasure; by: number; x: number; y: number }

/**
 * Text over other text: two runs in different holders, neither inside the other, whose boxes share more than a few
 * px. The browser then says which run is painted on top at the centre of the shared box (see overlapsOf).
 */
export function overlapPairs(measures: readonly TextMeasure[]): OverlapPair[] {
  const out: OverlapPair[] = []
  const shown = measures.filter((m) => !m.truncated && m.fieldShort === undefined)
  for (let i = 0; i < shown.length; i++) {
    for (let j = i + 1; j < shown.length; j++) {
      const a = shown[i]
      const b = shown[j]
      if (a === undefined || b === undefined) continue
      if (a.key === b.key || a.key.startsWith(`${b.key}/`) || b.key.startsWith(`${a.key}/`)) continue
      const sa = shownBox(a)
      const sb = shownBox(b)
      if (sa === null || sb === null) continue
      const by = overlapBy(sa, sb)
      if (by <= overlapTolerance) continue
      const x = (Math.max(sa.left, sb.left) + Math.min(sa.right, sb.right)) / 2
      const y = (Math.max(sa.top, sb.top) + Math.min(sa.bottom, sb.bottom)) / 2
      out.push({ a, b, by, x, y })
    }
  }
  return out
}

/**
 * The layer that holds the run on top and not the run under it, as the browser found it: an open dialog, sheet or
 * menu (`open`), a fixed or sticky bar (`pinned`), or one of the parts named in `namedLayers`; `other` for any other
 * box placed over the page; null when the two runs share their layer.
 */
export type TopLayer = 'open' | 'pinned' | keyof typeof namedLayers | 'other' | null

/** The run painted on top of a pair (null when a third element covers both), its layer and that layer's pointer-events. */
export type TopRun = { key: string | null; layer: TopLayer; pointerEvents: string }

/**
 * The parts that cover the page by design, named one by one (bridge-coord, 2026-11-25): the tab bar the page scrolls
 * under, and three drag-time layers, which show only while a drag runs and take no pointer: the resize readout, the
 * pane drop zone and the sidebar's dragged chat. Any other box over text counts as an overlap.
 */
export const namedLayers = {
  tabBar: '.app-shell__tabBar',
  resizeReadout: '[data-drag-layer="resize-readout"]',
  paneDropZone: '[data-drag-layer="pane-drop-zone"]',
  sidebarDrag: '[data-drag-layer="sidebar-drag"]',
} as const

/** Whether the layer on top covers the text under it by design. A drag-time layer must take no pointer. */
export function coversByDesign(top: TopRun): boolean {
  switch (top.layer) {
    case 'open':
    case 'pinned':
    case 'tabBar':
      return true
    case 'resizeReadout':
    case 'paneDropZone':
    case 'sidebarDrag':
      return top.pointerEvents === 'none'
    case 'other':
    case null:
      return false
  }
}

/**
 * The overlap problems, from the pairs and the run painted on top of each. A pair is no problem when a third element
 * covers both or when the layer on top covers the page by design (coversByDesign). A problem is keyed by the run on
 * top only: a chip that covers text at Small too is the design, and newProblems drops it however the text under it
 * moved; one that covers text only at a larger size is new.
 */
export function overlapsOf(pairs: readonly OverlapPair[], tops: readonly TopRun[]): TextProblem[] {
  const out: TextProblem[] = []
  const seen = new Set<string>()
  pairs.forEach((p, i) => {
    const run = tops[i]
    if (run === undefined || coversByDesign(run)) return
    const top = run.key
    if (top !== p.a.key && top !== p.b.key) return
    const [upper, lower] = top === p.a.key ? [p.a, p.b] : [p.b, p.a]
    if (seen.has(upper.key)) return
    seen.add(upper.key)
    out.push({ key: upper.key, text: `${upper.text} over ${lower.text}`, kind: 'overlap', by: Math.round(p.by) })
  })
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

/** A size that the check compares with Small. */
export type LargerSize = 'default' | 'large'

/**
 * A cut that a decision accepts (NCC-143): the same text and kind in each named state at each named size. `reason`
 * cites the decision, such as d-131's named exceptions (a tool-call line stays one line, a file tree name may
 * truncate). A cut that we plan to fix never goes here: it stays a failure until the fix.
 */
export type AcceptedCut = {
  states: readonly string[]
  sizes: readonly LargerSize[]
  kind: TextProblem['kind']
  text: string
  reason: string
}

/** One new problem of one state at one size, as the check collects them. */
export type StateProblem = TextProblem & { state: string; size: LargerSize }

/**
 * Splits the new problems into the open ones (the check fails on them) and the accepted ones, and names each
 * entry place (state and size) of `accepted` that matched nothing: every place on a full run, and those of `page`
 * on a run with --page. An unused place fails the check too, so the file only lists cuts that the app still has.
 */
export function splitAccepted(
  problems: readonly StateProblem[],
  accepted: readonly AcceptedCut[],
  page?: string,
): { open: StateProblem[]; accepted: number; unused: string[] } {
  const place = (state: string, size: string, kind: string, text: string) => `${state} ${size} ${kind} ${text}`
  // A full run checks every entry, so an entry of a removed or renamed state or page is unused; a run with --page
  // skips only the entries of the other pages.
  const places = new Set<string>()
  for (const cut of accepted)
    for (const state of cut.states)
      if (page === undefined || state.split('/')[0] === page)
        for (const size of cut.sizes) places.add(place(state, size, cut.kind, cut.text))
  const used = new Set<string>()
  const open: StateProblem[] = []
  for (const p of problems) {
    const at = place(p.state, p.size, p.kind, p.text)
    if (places.has(at)) used.add(at)
    else open.push(p)
  }
  return {
    open,
    accepted: problems.length - open.length,
    unused: [...places].filter((at) => !used.has(at)).sort(),
  }
}
