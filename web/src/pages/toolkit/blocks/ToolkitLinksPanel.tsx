// One side of the Links tab (Figma `panel · linked from`, D19 482:542): a
// section Panel with the side's label and count and its caption, then each
// link: the item at the other end, where the link is written (its file and
// line) and the line itself. The item is the library's `MapNode`, as the
// graph draws it, in the faint kind border of a link row (`tone="faint"`); a
// tap on it opens the item, and a tap on the file and line opens that file.
// The library has no link row and no text link in mono
// (LIBRARY_GAPS.md, Links panel rows): the file and line is a plain button
// styled with tokens. A side with no links says why. Props only.
import { MapNode, Panel, focusRing } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitLinks } from '../types.ts'
import { sideLabel } from './linksView.ts'

type Side = ToolkitLinks['from']
type Link = Side['links'][number]

// D19 482:543: the label at the start, the caption at the end. The section Panel pads 12 above and 16 at the sides
// inside its border, and its rows are 8 apart, as Figma's (482:544 at 13 and 17 in; the links 58 apart).
const header = css({ display: 'flex', alignItems: 'center', gap: '8' })
const label = css({ textStyle: 'monoCaps', color: 'fg.muted' })
const caption = css({ ms: 'auto', textStyle: 'small', color: 'fg.muted' })
// D19 482:547: the top row (29 high) and the line 4 under it. The node is 28 high (`control.sm`; no size token has 29),
// so 6 under it keeps the line and every link after it at Figma's place.
const link = css({ display: 'flex', flexDirection: 'column', gap: '6' })
// The file and line sits at the row's end (`ms: auto`), so the gap shows only on a row too full for both: on the
// phone (M33 493:6665) Figma's file and line ends 5 px past the row, inside the panel, and the render's node is 7 px
// wider than Figma's (LIBRARY_GAPS.md, Links panel rows); a gap of 4 keeps `skills/eval-cases/SKILL.md:97` (493:6672)
// inside the row.
const top = css({ display: 'flex', alignItems: 'center', gap: '4' })
// D19 482:549: the node as wide as its name, 28 high; MapNode fills the box it is placed in.
const node = css({ display: 'inline-grid', h: 'control.sm' })
const at = css({
  ms: 'auto',
  p: '0',
  bg: 'transparent',
  border: 'none',
  textStyle: 'mono',
  color: 'fg.accent',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  outline: 'none',
  [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
})
const line = css({ textStyle: 'small', color: 'fg.muted' })

export type ToolkitLinksPanelProps = {
  side: Side
  /** `panel · linked from` or `panel · links to`: the panel's Figma layer. */
  layer: string
  onOpenItem?: ((path: string) => void) | undefined
  /** Opens the file a link is written in, at its line. */
  onOpenLine?: ((link: Link) => void) | undefined
}

export function ToolkitLinksPanel({ side, layer, onOpenItem, onOpenLine }: ToolkitLinksPanelProps) {
  return (
    <section aria-label={sideLabel(side)} data-figma={layer}>
      <Panel>
        <div className={header}>
          <h3 className={label}>{sideLabel(side)}</h3>
          <span className={caption}>{side.caption}</span>
        </div>
        {side.links.length === 0 && side.empty !== undefined ? <p className={line}>{side.empty.panel}</p> : null}
        {side.links.map((l) => (
          <div key={`${l.path}:${l.at}`} className={link} data-figma={`link · ${l.name} · ${l.at}`}>
            <div className={top}>
              <span className={node}>
                <MapNode
                  label={l.name}
                  kind={l.kind}
                  tone="faint"
                  onClick={() => {
                    onOpenItem?.(l.path)
                  }}
                />
              </span>
              <button
                type="button"
                className={at}
                onClick={() => {
                  onOpenLine?.(l)
                }}
              >
                {l.at}
              </button>
            </div>
            <p className={line}>{l.text}</p>
          </div>
        ))}
      </Panel>
    </section>
  )
}
