// The text check (fidelity loop step 4): every Figma string is in the
// render, and the render shows no text that Figma does not have.
import type { FrameRef, Layer } from './figmaMetadata.ts'
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
   * that no viewer of the render sees (clipped, scrolled away or hidden), or
   * that another element covers in the render where Figma does not cover
   * the layer (`covered`).
   */
  notVisible: { id: string; text: string; covered?: true }[]
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

/** Layer types that may draw a fill: frame.json does not say which do, so each counts. */
const drawsOver = (type: string) => type !== 'text' && type !== 'line'

/**
 * The ids of the text layers that Figma draws something over. frame.json
 * lists layers in document order, and a later layer (with its subtree) is
 * drawn on top, so a text layer is covered when a later layer that is not
 * its ancestor or descendant and may draw a fill (a frame, instance,
 * rectangle, ellipse or vector; frame.json cannot tell a fill, so a frame
 * counts) overlaps its box by more than 1 px on both axes.
 */
export function coveredInFigma(layers: readonly Layer[]): Set<string> {
  // Each layer's path is its parent's path and name, so a stack of open
  // layers gives the parent of each, and from it the end of each subtree.
  const childPath = (l: Layer) => (l.path === '' ? l.name : `${l.path} > ${l.name}`)
  const subtreeEnd = layers.map((_, i) => i)
  const open: number[] = []
  layers.forEach((l, i) => {
    while (open.length > 0) {
      const top = layers[open.at(-1) ?? 0]
      if (top !== undefined && childPath(top) === l.path) break
      open.pop()
    }
    for (const a of open) subtreeEnd[a] = i
    open.push(i)
  })
  const overlap = (a: Layer, b: Layer) =>
    Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 1 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 1
  const covered = new Set<string>()
  layers.forEach((t, i) => {
    if (t.text === undefined) return
    if (layers.slice((subtreeEnd[i] ?? i) + 1).some((l) => drawsOver(l.type) && overlap(t, l))) covered.add(t.id)
  })
  return covered
}

export function checkText(
  ref: Pick<FrameRef, 'layers' | 'exclude' | 'w' | 'h'>,
  exceptions: Pick<Exceptions, 'missing' | 'extra'>,
  page: Pick<PageMeasure, 'textContent' | 'innerText' | 'allTexts' | 'fieldTexts' | 'visibleTexts'>,
): TextResult {
  const excludedIds = new Set(ref.exclude.map((e) => e.id))
  // A missing exception covers only the text layers it names (d-101).
  const allowedMissing = new Set(exceptions.missing.flatMap((e) => e.layers))
  const allowedExtra = new Set(exceptions.extra.map((e) => collapse(e.text)))
  const inFrame = (l: { x: number; y: number; w: number; h: number }) =>
    l.x >= 0 && l.y >= 0 && l.x + l.w <= ref.w + 0.5 && l.y + l.h <= ref.h + 0.5
  const texts = ref.layers.flatMap((l) =>
    l.text === undefined ? [] : [{ id: l.id, text: collapse(l.text), inFrame: inFrame(l) }],
  )
  for (const e of exceptions.missing)
    for (const id of e.layers)
      if (!texts.some((t) => t.id === id && t.text === collapse(e.text)))
        throw new Error(`The missing exception "${e.text}" names layer ${id}, which is not a text layer with that text`)
  const kept = texts.filter((t) => t.text !== '' && !excludedIds.has(t.id))
  const checked = kept.filter((t) => !allowedMissing.has(t.id))
  const figmaStrings = kept.map((t) => t.text)

  const nodes = new Set([...page.allTexts.map(collapse), ...page.fieldTexts.map(collapse)])
  const haystacks = [page.textContent, page.innerText, ...page.fieldTexts].map(collapse)
  const present = (s: string) =>
    s.length <= shortLength ? nodes.has(s) : haystacks.some((h) => h.includes(s)) || nodes.has(s)

  const missing = checked.filter((t) => !present(t.text)).map((t) => ({ id: t.id, text: t.text }))
  // Each Figma layer needs its own visible occurrence: two layers with the
  // same string need two, so one DOM string cannot stand for a heading and
  // a list row at once. Longest strings claim first, so a long string takes
  // its run before a shorter string inside it. A run that another element
  // covers in the render counts only for a layer that Figma covers too
  // (such layers try the covered runs first, and claim after the others of
  // their length).
  const figmaCovered = coveredInFigma(ref.layers)
  const pool = page.visibleTexts.map((v) => collapse(v.text))
  const covered = page.visibleTexts.map((v) => v.covered)
  const open = (j: number) => !covered[j]
  const under = (j: number) => covered[j] === true
  const any = () => true
  const needed = checked.filter((t) => t.inFrame && present(t.text))
  const order = [...needed].sort(
    (a, b) => b.text.length - a.text.length || Number(figmaCovered.has(a.id)) - Number(figmaCovered.has(b.id)),
  )
  const unseen = new Map<(typeof needed)[number], boolean>()
  for (const t of order) {
    const seen = figmaCovered.has(t.id)
      ? claimRun(t.text, pool, under) || claimRun(t.text, pool, any)
      : claimRun(t.text, pool, open)
    // Not seen; say so when the render has it under another element.
    if (!seen) unseen.set(t, claimRun(t.text, [...pool], any))
  }
  const notVisible = needed.flatMap((t) => {
    const covered = unseen.get(t)
    if (covered === undefined) return []
    return covered ? [{ id: t.id, text: t.text, covered: true as const }] : [{ id: t.id, text: t.text }]
  })

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
 * Finds one unclaimed occurrence of `s` in the visible runs that `usable`
 * accepts (by index) and claims it, so no other Figma layer can use it: a
 * short string must be a whole run, a long one may be part of a run or
 * split over several runs (each part of it, the rest punctuation). Returns
 * false when no occurrence is left.
 */
function claimRun(s: string, pool: string[], usable: (j: number) => boolean): boolean {
  if (s.length <= shortLength) {
    const i = pool.findIndex((v, j) => v === s && usable(j))
    if (i >= 0) pool[i] = claimed
    return i >= 0
  }
  const i = pool.findIndex((v, j) => v.includes(s) && usable(j))
  if (i >= 0) {
    pool[i] = (pool[i] ?? '').replace(s, claimed)
    return true
  }
  let rest = s
  const used: number[] = []
  const parts = pool
    .map((v, j) => ({ v, j }))
    .filter(({ v, j }) => usable(j) && v.length > 0 && !v.includes(claimed) && s.includes(v))
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
