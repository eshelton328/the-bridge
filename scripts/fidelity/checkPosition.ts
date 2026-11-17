// The position check (fidelity loop step 4): each element that carries
// data-figma="<layer name or node id>" sits where the Figma layer sits,
// within the frame's tolerance (4 px unless frame.json sets another).
import type { FrameRef, Layer } from './figmaMetadata.ts'
import type { FigmaBox } from './inPage.ts'
import type { Exceptions } from './references.ts'

type PositionDiff = {
  key: string
  layer: string | null
  selector: string
  problem: 'noLayer' | 'ambiguousLayer' | 'duplicateElement' | 'offBy'
  figma?: { x: number; y: number; w: number; h: number }
  render?: { x: number; y: number; w: number; h: number }
  /** render minus Figma, per edge value. */
  delta?: { x: number; y: number; w: number; h: number }
  detail: string
}

export type PositionResult = {
  ok: boolean
  tolerance: number
  checked: number
  passed: string[]
  diffs: PositionDiff[]
  excepted: string[]
}

const round = (n: number) => Math.round(n * 10) / 10

/** The layer a data-figma key names: a node id ("346:146") or a name unique in the frame. */
export function findLayer(layers: readonly Layer[], key: string): Layer | Layer[] | undefined {
  if (/^\d+:\d+$/.test(key)) return layers.find((l) => l.id === key)
  const named = layers.filter((l) => l.name === key)
  return named.length === 1 ? named[0] : named.length > 1 ? named : undefined
}

export function checkPosition(
  ref: Pick<FrameRef, 'layers' | 'tolerance'>,
  exceptions: Pick<Exceptions, 'position'>,
  boxes: readonly FigmaBox[],
  tolerance = ref.tolerance,
): PositionResult {
  const allowed = new Set(exceptions.position.map((p) => p.layer))
  const diffs: PositionDiff[] = []
  const passed: string[] = []
  const excepted: string[] = []
  const counts = new Map<string, number>()
  for (const b of boxes) counts.set(b.key, (counts.get(b.key) ?? 0) + 1)

  for (const box of boxes) {
    if (allowed.has(box.key)) {
      excepted.push(box.key)
      continue
    }
    const base = { key: box.key, selector: box.selector }
    if ((counts.get(box.key) ?? 0) > 1) {
      diffs.push({
        ...base,
        layer: null,
        problem: 'duplicateElement',
        detail: `${String(counts.get(box.key))} elements carry data-figma="${box.key}"; give each a node id`,
      })
      continue
    }
    const found = findLayer(ref.layers, box.key)
    if (found === undefined) {
      diffs.push({ ...base, layer: null, problem: 'noLayer', detail: `the frame has no layer "${box.key}"` })
      continue
    }
    if (Array.isArray(found)) {
      diffs.push({
        ...base,
        layer: null,
        problem: 'ambiguousLayer',
        detail: `${String(found.length)} layers are named "${box.key}"; use a node id: ${found.map((l) => l.id).join(', ')}`,
      })
      continue
    }
    const figma = { x: found.x, y: found.y, w: found.w, h: found.h }
    const render = { x: round(box.x), y: round(box.y), w: round(box.w), h: round(box.h) }
    const delta = {
      x: round(box.x - found.x),
      y: round(box.y - found.y),
      w: round(box.w - found.w),
      h: round(box.h - found.h),
    }
    const worst = Math.max(...Object.values(delta).map(Math.abs))
    if (worst > tolerance) {
      const off = Object.entries(delta)
        .filter(([, d]) => Math.abs(d) > tolerance)
        .map(([k, d]) => `${k} ${d > 0 ? '+' : ''}${String(d)}`)
        .join(', ')
      diffs.push({
        ...base,
        layer: found.id,
        problem: 'offBy',
        figma,
        render,
        delta,
        detail: `${off} px (tolerance ${String(tolerance)})`,
      })
    } else passed.push(box.key)
  }
  return { ok: diffs.length === 0, tolerance, checked: boxes.length, passed, diffs, excepted }
}
