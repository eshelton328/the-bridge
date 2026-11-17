// The text check (fidelity loop step 4): every Figma string is in the
// render, and the render shows no text that Figma does not have.
import type { FrameRef } from './figmaMetadata.ts'
import type { PageMeasure } from './inPage.ts'
import type { Exceptions } from './references.ts'

export type TextResult = {
  ok: boolean
  /** Figma strings checked (all text layers less exclude and exceptions). */
  checked: number
  missing: { id: string; text: string }[]
  extra: { text: string; selector: string }[]
  /**
   * Figma strings that Figma shows inside the frame and the DOM has, but
   * that no viewer of the render sees (clipped, scrolled away or hidden).
   */
  notVisible: { id: string; text: string }[]
  excluded: number
  excepted: number
}

const collapse = (s: string) => s.replace(/\s+/g, ' ').trim()
/** Strings of this length or less must equal a whole text node, so "4" does not match any 4. */
const shortLength = 3

/** Text that carries no content of its own: separators and bullets. */
const isPunctuation = (s: string) => /^[\s·•|/,.:;–—\-()…]*$/.test(s)

/**
 * True when `text` is made only of Figma strings and punctuation, such as
 * "Next steps 3" from "Next steps" and "3", or is part of one Figma string.
 */
export function coveredBy(text: string, figma: readonly string[]): boolean {
  if (figma.some((f) => f.includes(text))) return true
  let rest = text
  for (const f of [...figma].sort((a, b) => b.length - a.length)) if (f.length > 0) rest = rest.split(f).join(' ')
  return isPunctuation(rest)
}

export function checkText(
  ref: Pick<FrameRef, 'layers' | 'exclude' | 'w' | 'h'>,
  exceptions: Pick<Exceptions, 'missing' | 'extra'>,
  page: Pick<PageMeasure, 'textContent' | 'innerText' | 'allTexts' | 'fieldTexts' | 'visibleTexts'>,
): TextResult {
  const excludedIds = new Set(ref.exclude.map((e) => e.id))
  const allowedMissing = new Set(exceptions.missing.map((e) => collapse(e.text)))
  const allowedExtra = new Set(exceptions.extra.map((e) => collapse(e.text)))
  const inFrame = (l: { x: number; y: number; w: number; h: number }) =>
    l.x >= 0 && l.y >= 0 && l.x + l.w <= ref.w + 0.5 && l.y + l.h <= ref.h + 0.5
  const texts = ref.layers.flatMap((l) =>
    l.text === undefined ? [] : [{ id: l.id, text: collapse(l.text), inFrame: inFrame(l) }],
  )
  const kept = texts.filter((t) => t.text !== '' && !excludedIds.has(t.id))
  const checked = kept.filter((t) => !allowedMissing.has(t.text))
  const figmaStrings = kept.map((t) => t.text)

  const nodes = new Set([...page.allTexts.map(collapse), ...page.fieldTexts.map(collapse)])
  const haystacks = [page.textContent, page.innerText, ...page.fieldTexts].map(collapse)
  const present = (s: string) =>
    s.length <= shortLength ? nodes.has(s) : haystacks.some((h) => h.includes(s)) || nodes.has(s)

  const missing = checked.filter((t) => !present(t.text)).map((t) => ({ id: t.id, text: t.text }))
  // Each Figma layer needs its own visible occurrence: two layers with the
  // same string need two, so one DOM string cannot stand for a heading and
  // a list row at once. Longest strings claim first, so a long string takes
  // its run before a shorter string inside it.
  const pool = page.visibleTexts.map((v) => collapse(v.text))
  const needed = checked.filter((t) => t.inFrame && present(t.text))
  const unseen = new Set(
    [...needed].sort((a, b) => b.text.length - a.text.length).filter((t) => !claimRun(t.text, pool)),
  )
  const notVisible = needed.filter((t) => unseen.has(t)).map((t) => ({ id: t.id, text: t.text }))

  const extra: TextResult['extra'] = []
  const reported = new Set<string>()
  for (const run of page.visibleTexts) {
    const text = collapse(run.text)
    if (text === '' || isPunctuation(text) || allowedExtra.has(text) || reported.has(text)) continue
    if (coveredBy(text, figmaStrings)) continue
    reported.add(text)
    extra.push({ text, selector: run.selector })
  }

  return {
    ok: missing.length === 0 && extra.length === 0 && notVisible.length === 0,
    checked: checked.length,
    missing,
    extra,
    notVisible,
    excluded: texts.length - kept.length,
    excepted: kept.length - checked.length,
  }
}

/** Claimed text in a run: no Figma string can match across it. */
const claimed = '\u0000'

/**
 * Finds one unclaimed occurrence of `s` in the visible runs and claims it,
 * so no other Figma layer can use it: a short string must be a whole run, a
 * long one may be part of a run or split over several runs (each part of it,
 * the rest punctuation). Returns false when no occurrence is left.
 */
function claimRun(s: string, pool: string[]): boolean {
  if (s.length <= shortLength) {
    const i = pool.indexOf(s)
    if (i >= 0) pool[i] = claimed
    return i >= 0
  }
  const i = pool.findIndex((v) => v.includes(s))
  if (i >= 0) {
    pool[i] = (pool[i] ?? '').replace(s, claimed)
    return true
  }
  let rest = s
  const used: number[] = []
  const parts = pool
    .map((v, j) => ({ v, j }))
    .filter(({ v }) => v.length > 0 && !v.includes(claimed) && s.includes(v))
    .sort((a, b) => b.v.length - a.v.length)
  for (const { v, j } of parts)
    if (rest.includes(v)) {
      rest = rest.replace(v, ' ')
      used.push(j)
    }
  if (used.length === 0 || !isPunctuation(rest)) return false
  for (const j of used) pool[j] = claimed
  return true
}
