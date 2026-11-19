// The slide check of screen review R27 on a keyboard trace (web/src/app/keyboardTrace.ts). iOS's own scroll of the
// focused field draws the whole page low and slides it back; script cannot read that drawing, but each such scroll
// leaves a sample where the document is scrolled, the layout viewport is shorter than at the trace's start, or the
// app's fixed root or the visual viewport is off the top. A trace with no such sample had no scroll for iOS to draw.

/** A sample that shows a moved page, and each reading that shows it. */
export type SlideSample = { t: number; type: string; why: string[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/** The readings that must be 0 while the page is in place; `scrollTop` and `rootTop` are missing in an older trace. */
const ZERO_FIELDS = ['scrollY', 'scrollTop', 'rootTop', 'vvOffsetTop'] as const

/** The samples of a trace that show a moved page; empty for a trace with none. A sample that is no record is skipped. */
export function slideSamples(samples: readonly unknown[]): SlideSample[] {
  const records = samples.filter(isRecord)
  const first = records.find((sample) => isNumber(sample.innerHeight))?.innerHeight
  const found: SlideSample[] = []
  for (const sample of records) {
    const why: string[] = []
    for (const field of ZERO_FIELDS) {
      const value = sample[field]
      if (isNumber(value) && Math.abs(value) > 1) why.push(`${field} ${String(value)}`)
    }
    if (isNumber(first) && isNumber(sample.innerHeight) && sample.innerHeight < first - 1)
      why.push(`innerHeight ${String(sample.innerHeight)}, ${String(first)} at the start`)
    if (why.length > 0)
      found.push({ t: isNumber(sample.t) ? sample.t : -1, type: typeof sample.type === 'string' ? sample.type : '', why })
  }
  return found
}

/** One trace's result: its `kbExperiment` and the samples that show a moved page. */
export type SlideResult = { kbExperiment: string | null; samples: number; slide: SlideSample[] }

/** Checks a parsed trace file; undefined when it is no trace. */
export function checkTrace(trace: unknown): SlideResult | undefined {
  if (!isRecord(trace) || !Array.isArray(trace.samples)) return undefined
  const samples: unknown[] = trace.samples
  return {
    kbExperiment: typeof trace.kbExperiment === 'string' ? trace.kbExperiment : null,
    samples: samples.length,
    slide: slideSamples(samples),
  }
}
