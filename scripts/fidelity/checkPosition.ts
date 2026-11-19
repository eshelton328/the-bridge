// The position check (fidelity loop step 4): each element that carries
// data-figma="<layer name or node id>" sits where the Figma layer sits,
// within the frame's tolerance (4 px unless frame.json sets another).
// On a tablet or phone frame Figma draws an iOS status bar that the app
// does not (d-089), so fidelity.ts renders the page that much shorter and
// this check adds the bar's height to each render y (d-101).
import { statusBarReason, type FrameRef, type Layer } from './figmaMetadata.ts'
import { iconSizeDiffs, iconSlack, type IconSizeDiff } from './checkIcons.ts'
import type { FigmaBox, IconBox } from './inPage.ts'
import type { Exceptions } from './references.ts'

type PositionDiff =
  | IconSizeDiff
  | {
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
  /** Height of Figma's status bar in px, added to each render y; 0 when the frame has none. */
  statusBar: number
  /** Figma icons matched to a render icon and compared by size (checkIcons.ts). */
  iconsChecked: number
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

/**
 * Height of the iOS status bar that Figma draws at the top of the frame, in
 * px; 0 when the frame has none (desktop). The bar is the top-level layer at
 * y 0 that holds a text layer `exclude` lists as the status bar.
 */
export function statusBarHeight(ref: Pick<FrameRef, 'layers' | 'exclude'>): number {
  const ids = new Set(ref.exclude.filter((e) => e.reason === statusBarReason).map((e) => e.id))
  const heights = new Set<number>()
  for (const text of ref.layers.filter((l) => ids.has(l.id))) {
    const top = text.path.split(' > ')[0]
    const bar = ref.layers.find(
      (l) =>
        l.path === '' &&
        l.name === top &&
        l.y === 0 &&
        l.x <= text.x &&
        l.y <= text.y &&
        l.x + l.w >= text.x + text.w &&
        l.y + l.h >= text.y + text.h,
    )
    if (bar === undefined) throw new Error(`No top-level layer at y 0 holds the status bar text ${text.id}`)
    heights.add(bar.h)
  }
  if (heights.size > 1)
    throw new Error(`The status bar texts sit in bars of different heights: ${[...heights].join(', ')}`)
  return [...heights][0] ?? 0
}

/**
 * The viewport every check renders a frame in: the frame's width by its
 * height less Figma's status bar, which the app does not draw (d-089), so
 * the text, position and rule checks see the screen a device shows below
 * its bar (d-102). A desktop frame has no bar and keeps its full size.
 */
export function renderViewport(ref: Pick<FrameRef, 'w' | 'h' | 'layers' | 'exclude'>): {
  w: number
  h: number
  statusBar: number
} {
  const statusBar = statusBarHeight(ref)
  return { w: ref.w, h: ref.h - statusBar, statusBar }
}

/**
 * `boxes` are measured in a viewport the status bar's height shorter than
 * the frame (fidelity.ts), so each y moves down by that height.
 */
export function checkPosition(
  ref: Pick<FrameRef, 'layers' | 'tolerance' | 'exclude'> & { h?: number },
  exceptions: Pick<Exceptions, 'position'>,
  boxes: readonly FigmaBox[],
  tolerance = ref.tolerance,
  icons: readonly IconBox[] = [],
): PositionResult {
  // NaN or a negative tolerance would pass or fail every box unseen.
  if (!Number.isFinite(tolerance) || tolerance < 0)
    throw new Error(`The position tolerance must be a finite number of px, 0 or more; got ${String(tolerance)}`)
  const statusBar = statusBarHeight(ref)
  const allowed = new Set(exceptions.position.map((p) => p.layer))
  const diffs: PositionDiff[] = []
  const passed: string[] = []
  const excepted: string[] = []
  const counts = new Map<string, number>()
  for (const b of boxes) counts.set(b.key, (counts.get(b.key) ?? 0) + 1)

  for (const measured of boxes) {
    const box = { ...measured, y: measured.y + statusBar }
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
  const iconSizes = iconSizeDiffs({ ...ref, tolerance, h: ref.h ?? Number.POSITIVE_INFINITY }, icons, statusBar)
  for (const diff of iconSizes.diffs) {
    const entry = exceptions.position.find((p) => p.layer === diff.key)
    if (entry === undefined) diffs.push(diff)
    else if (entry.iconSize === undefined) excepted.push(diff.key)
    else if (
      Math.abs(diff.render.w - entry.iconSize) <= iconSlack &&
      Math.abs(diff.render.h - entry.iconSize) <= iconSlack
    )
      excepted.push(diff.key)
    else
      diffs.push({
        ...diff,
        detail: `${diff.detail}; its position exception allows ${String(entry.iconSize)} px`,
      })
  }
  return {
    ok: diffs.length === 0,
    tolerance,
    statusBar,
    checked: boxes.length,
    iconsChecked: iconSizes.checked,
    passed,
    diffs,
    excepted,
  }
}
