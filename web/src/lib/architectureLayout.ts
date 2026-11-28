// The layout of an Architecture diagram (f-008 increment two, R14) for the
// library's ArchitectureDiagram, which does no layout. A caller sits a row
// above the part it calls (its longest path; an arrow that closes a loop does
// not count). A part outside a boundary moves out of the boundary's rows, so
// the outline holds only its own parts. An arrow that skips a row runs in a
// lane of its own right of every part. One model gives one layout, in px of
// frame 230:2; the drawing's text does not grow with the text size (d-131).
import type { ArchitectureModel, ArchitecturePart } from '@bridge/contract'

type LaidPart = ArchitecturePart & { x: number; y: number; width: number; height: number }
type LaidBoundary = { id: string; label: string; x: number; y: number; width: number; height: number }
type LaidPoint = { x: number; y: number }
type LaidArrow = {
  id: string
  from: string
  to: string
  label: string
  points: readonly LaidPoint[]
  labelAt: LaidPoint
}
export type DiagramLayout = {
  width: number
  height: number
  parts: readonly LaidPart[]
  boundaries: readonly LaidBoundary[]
  arrows: readonly LaidArrow[]
}

/** The sizes of frame 230:2: a part, the gaps between parts and rows, a boundary's inset and its label row, the edge. */
export const layoutSizes = {
  part: { width: 228, height: 62 },
  gap: 16,
  row: 56,
  inset: 24,
  label: 28,
  edge: 24,
  /** The room of each side lane, for an arrow that skips a row, with its label. */
  lane: 96,
} as const

/** Each part's row: its longest path from a part that nothing calls, with no arrow that closes a loop. */
function rowsOf(model: ArchitectureModel): Map<string, number> {
  const ids = model.parts.map((p) => p.id)
  const calls = new Map<string, string[]>(ids.map((id) => [id, []]))
  for (const a of model.arrows) if (a.from !== a.to) calls.get(a.from)?.push(a.to)
  // A depth-first walk in the model's order keeps the arrows that go down (no loop).
  const kept = new Map<string, string[]>(ids.map((id) => [id, []]))
  const state = new Map<string, 'open' | 'done'>()
  const walk = (id: string) => {
    state.set(id, 'open')
    for (const to of calls.get(id) ?? []) {
      if (state.get(to) === 'open') continue
      kept.get(id)?.push(to)
      if (!state.has(to)) walk(to)
    }
    state.set(id, 'done')
  }
  const called = new Set(model.arrows.filter((a) => a.from !== a.to).map((a) => a.to))
  for (const id of [...ids.filter((id) => !called.has(id)), ...ids]) if (!state.has(id)) walk(id)
  // Longest path: a part's row is one more than the lowest row of its callers, in an order where callers come first.
  const order: string[] = []
  const seen = new Set<string>()
  const visit = (id: string) => {
    if (seen.has(id)) return
    seen.add(id)
    for (const to of kept.get(id) ?? []) visit(to)
    order.unshift(id)
  }
  for (const id of ids) visit(id)
  const row = new Map<string, number>(ids.map((id) => [id, 0]))
  for (const id of order)
    for (const to of kept.get(id) ?? []) row.set(to, Math.max(row.get(to) ?? 0, (row.get(id) ?? 0) + 1))
  return row
}

/** Moves each part outside a boundary out of that boundary's rows, so its outline holds only its own parts. */
function clearBoundaries(model: ArchitectureModel, row: Map<string, number>) {
  for (const b of model.boundaries) {
    const inside = model.parts.filter((p) => p.boundary === b.id)
    if (inside.length === 0) continue
    const rows = inside.map((p) => row.get(p.id) ?? 0)
    const top = Math.min(...rows)
    const bottom = Math.max(...rows)
    const members = new Set(inside.map((p) => p.id))
    for (const p of model.parts) {
      const r = row.get(p.id) ?? 0
      if (members.has(p.id) || r < top || r > bottom) continue
      const callsIn = model.arrows.some((a) => a.from === p.id && members.has(a.to))
      const calledFrom = model.arrows.some((a) => a.to === p.id && members.has(a.from))
      row.set(p.id, callsIn && !calledFrom ? top - 1 : bottom + 1)
    }
  }
  const least = Math.min(...row.values())
  for (const [id, r] of row) row.set(id, r - least)
}

/** The model laid out: a part's box, each boundary round its parts and each arrow from its caller's foot to the part's top. */
export function layoutOf(model: ArchitectureModel): DiagramLayout {
  const { part, gap, row: rowGap, inset, label, edge, lane } = layoutSizes
  const row = rowsOf(model)
  clearBoundaries(model, row)
  const count = Math.max(...row.values()) + 1
  const index = new Map(model.parts.map((p, i) => [p.id, i]))
  const place = new Map<string, number>()
  const rows: ArchitecturePart[][] = Array.from({ length: count }, () => [])
  for (const p of model.parts) rows[row.get(p.id) ?? 0]?.push(p)
  for (const parts of rows) {
    const mean = (p: ArchitecturePart) => {
      const at = model.arrows.flatMap((a) => (a.to === p.id ? [place.get(a.from)] : [])).filter((x) => x !== undefined)
      return at.length === 0 ? Number.POSITIVE_INFINITY : at.reduce((s, x) => s + x, 0) / at.length
    }
    const boundaryOrder = (p: ArchitecturePart) =>
      p.boundary === undefined ? -1 : model.boundaries.findIndex((b) => b.id === p.boundary)
    parts.sort(
      (a, b) =>
        boundaryOrder(a) - boundaryOrder(b) || mean(a) - mean(b) || (index.get(a.id) ?? 0) - (index.get(b.id) ?? 0),
    )
    parts.forEach((p, i) => place.set(p.id, i))
  }
  // A boundary adds its inset on each side of its parts and its label row over them.
  const hasBoundary = model.boundaries.length > 0
  const pad = hasBoundary ? inset : 0
  const widest = Math.max(...rows.map((parts) => parts.length * part.width + (parts.length - 1) * gap))
  // An arrow that skips a row runs in a lane of its own right of every part, so it crosses no part between.
  const skips = model.arrows.filter((a) => Math.abs((row.get(a.from) ?? 0) - (row.get(a.to) ?? 0)) > 1)
  const content = widest + 2 * (edge + pad)
  const width = content + skips.length * lane
  const yOf = (r: number) => edge + (hasBoundary ? label + inset : 0) + r * (part.height + rowGap)
  const laid: LaidPart[] = rows.flatMap((parts, r) => {
    const span = parts.length * part.width + (parts.length - 1) * gap
    const start = (content - span) / 2
    return parts.map((p, i) => ({ ...p, x: start + i * (part.width + gap), y: yOf(r), ...part }))
  })
  const box = new Map(laid.map((p) => [p.id, p]))
  const boundaries = model.boundaries.flatMap((b) => {
    const inside = laid.filter((p) => p.boundary === b.id)
    if (inside.length === 0) return []
    const x = Math.min(...inside.map((p) => p.x)) - inset
    const y = Math.min(...inside.map((p) => p.y)) - inset - label
    const right = Math.max(...inside.map((p) => p.x + p.width)) + inset
    const bottom = Math.max(...inside.map((p) => p.y + p.height)) + inset
    return [{ id: b.id, label: b.label, x, y, width: right - x, height: bottom - y }]
  })
  const arrows = model.arrows.flatMap((a) => {
    const from = box.get(a.from)
    const to = box.get(a.to)
    if (from === undefined || to === undefined || a.from === a.to) return []
    const fromX = from.x + from.width / 2
    const toX = to.x + to.width / 2
    const skip = skips.indexOf(a)
    if (to.y === from.y) {
      const right = to.x > from.x
      const y = from.y + from.height / 2
      const points = [
        { x: right ? from.x + from.width : from.x, y },
        { x: right ? to.x : to.x + to.width, y },
      ]
      return [
        {
          id: `${a.from} ${a.to}`,
          from: a.from,
          to: a.to,
          label: a.label,
          points,
          labelAt: { x: (fromX + toX) / 2, y },
        },
      ]
    }
    // Out of the caller's foot (or top, up) into the row gap; a skip runs down its lane to the gap by the part.
    const down = to.y > from.y
    const out = down ? from.y + from.height + rowGap / 2 : from.y - rowGap / 2
    const into = down ? to.y - rowGap / 2 : to.y + to.height + rowGap / 2
    const x = content - edge + (skip + 0.5) * lane
    const lanes = skip < 0 ? [] : [out, into]
    const points = [
      { x: fromX, y: down ? from.y + from.height : from.y },
      { x: fromX, y: out },
      ...lanes.map((y) => ({ x, y })),
      { x: toX, y: into },
      { x: toX, y: down ? to.y : to.y + to.height },
    ]
    const labelAt = skip < 0 ? { x: (fromX + toX) / 2, y: out } : { x, y: (out + into) / 2 }
    return [{ id: `${a.from} ${a.to}`, from: a.from, to: a.to, label: a.label, points, labelAt }]
  })
  const height = Math.max(...laid.map((p) => p.y + p.height)) + pad + edge
  return { width, height, parts: laid, boundaries, arrows }
}
