// The icon size part of the position check: each Figma icon (a layer
// named "icon/…", "kind · …", "logo · …" or "chevron · …") draws at its Figma size, give or take iconSlack px.
// Library #217 drew the Workspaces sidebar rows' 16 px icons at 12 px in
// 28 frames, and no check saw it. An icon is matched by place: the
// render's icon (an outermost svg, inPage.ts) whose centre is nearest the
// Figma icon's centre, within the frame's tolerance. A Figma icon with no
// render icon there is left to the text and position checks, as a moved
// or missing part is theirs.
import type { FrameRef, Layer } from './figmaMetadata.ts'
import type { IconBox } from './inPage.ts'

/**
 * Size differences up to this many px pass. Figma's icon frames come in
 * odd sizes (13, 15, 22) that the library draws at its icon sizes (12, 14,
 * 16, 24); a change of size class, such as 16 to 12, is more.
 */
const iconSlack = 2

export type IconSizeDiff = {
  /** The Figma icon's node id; a position exception names it as its layer. */
  key: string
  layer: string
  selector: string
  problem: 'iconSize'
  figma: { x: number; y: number; w: number; h: number }
  render: { x: number; y: number; w: number; h: number }
  delta: { x: number; y: number; w: number; h: number }
  detail: string
}

const round = (n: number) => Math.round(n * 10) / 10
/**
 * The Figma layers that are icons: `icon/…` from the icon set, and the
 * agent kind marks, logos and chevrons that the frames name by role
 * (`kind · claude`, the 16 px mark of a Workspaces sidebar row).
 */
const isIcon = (name: string) => /^(icon\/|kind · |logo · |chevron · )/i.test(name)
const isSetIcon = (name: string) => /^icon\//i.test(name)

function holdsIcon(layers: readonly Layer[], outer: Layer): boolean {
  const inside = outer.path === '' ? outer.name : `${outer.path} > ${outer.name}`
  return layers.some(
    (l) =>
      l !== outer &&
      isIcon(l.name) &&
      (l.path === inside || l.path.startsWith(`${inside} > `)) &&
      l.x >= outer.x &&
      l.y >= outer.y &&
      l.x + l.w <= outer.x + outer.w &&
      l.y + l.h <= outer.y + outer.h,
  )
}

/** `icons` are measured below Figma's status bar, as the position check's boxes are; each y moves down by `statusBar`. */
export function iconSizeDiffs(
  ref: Pick<FrameRef, 'h' | 'tolerance' | 'layers'>,
  icons: readonly IconBox[],
  statusBar: number,
): { checked: number; diffs: IconSizeDiff[] } {
  const placed = icons.map((i) => ({ ...i, y: i.y + statusBar }))
  const diffs: IconSizeDiff[] = []
  let checked = 0
  for (const layer of ref.layers) {
    if (!isIcon(layer.name)) continue
    // A part inside an icon of the set is the icon's own drawing.
    if (layer.path.split(' > ').some(isSetIcon)) continue
    // A role layer that holds an icon (the 28 px tile \`kind · Approval\`
    // around its 16 px \`icon/approve\`) is a container: its icon is checked.
    if (!isSetIcon(layer.name) && holdsIcon(ref.layers, layer)) continue
    // Under Figma's status bar or past the frame's foot: not in the render.
    if (layer.y < statusBar || layer.y + layer.h > ref.h) continue
    const cx = layer.x + layer.w / 2
    const cy = layer.y + layer.h / 2
    let best: IconBox | undefined
    let bestDistance = Infinity
    for (const icon of placed) {
      const dx = Math.abs(icon.x + icon.w / 2 - cx)
      const dy = Math.abs(icon.y + icon.h / 2 - cy)
      if (dx > ref.tolerance || dy > ref.tolerance || dx + dy >= bestDistance) continue
      best = icon
      bestDistance = dx + dy
    }
    if (best === undefined) continue
    checked += 1
    const dw = round(best.w - layer.w)
    const dh = round(best.h - layer.h)
    if (Math.abs(dw) <= iconSlack && Math.abs(dh) <= iconSlack) continue
    const render = { x: round(best.x), y: round(best.y), w: round(best.w), h: round(best.h) }
    diffs.push({
      key: layer.id,
      layer: layer.id,
      selector: best.selector,
      problem: 'iconSize',
      figma: { x: layer.x, y: layer.y, w: layer.w, h: layer.h },
      render,
      delta: { x: round(best.x - layer.x), y: round(best.y - layer.y), w: dw, h: dh },
      detail: `${layer.name} is ${String(layer.w)} × ${String(layer.h)} px in Figma and ${String(render.w)} × ${String(render.h)} px in the render (slack ${String(iconSlack)})`,
    })
  }
  return { checked, diffs }
}
