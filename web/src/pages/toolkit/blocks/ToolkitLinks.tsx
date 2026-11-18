// The Links tab of an open item (Figma `links`, D19 482:539): a line on what
// the tab shows, the header (how many links, and the hint), the graph of the
// item's links (`ToolkitLinksGraph`), the two panels side by side with each
// link's file, line and text (`ToolkitLinksPanel`), and the note under them.
// A tap on an item opens it; a tap on a link's file and line opens that file
// on its item's Files tab. On a tablet (T15) the graph is narrower and the
// panels stand one under the other. Props only.
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitKind, ToolkitLinks as Links } from '../types.ts'
import { linkCount } from './linksView.ts'
import { ToolkitLinksGraph } from './ToolkitLinksGraph.tsx'
import { ToolkitLinksPanel } from './ToolkitLinksPanel.tsx'

type Link = Links['from']['links'][number]

// D19 482:539: the intro, the header, the graph, the panels and the note, 12 apart (482:540 ends at 248, the header
// starts at 260; the graph at 289, the panels at 621, the note at 1082).
const root = css({ display: 'flex', flexDirection: 'column', gap: '12' })
const intro = css({ textStyle: 'body', color: 'fg.muted' })
// D19 493:2: the count at the start, the hint at the end.
const header = css({ display: 'flex', alignItems: 'center', gap: '8' })
const label = css({ textStyle: 'monoCaps', color: 'fg.muted' })
const hint = css({ ms: 'auto', textStyle: 'small', color: 'fg.muted' })
// D19 482:541: two panels 468 wide, 12 apart, each as tall as its links.
const panels = css({ display: 'grid', gridTemplateColumns: '[1fr 1fr]', alignItems: 'start', gap: '12' })
// T15 482:910: on a tablet the panels span the item, 12 apart (482:911 ends at 870, 482:956 starts at 882).
const panelsStacked = css({ display: 'flex', flexDirection: 'column', gap: '12' })
const note = css({ textStyle: 'small', color: 'fg.muted' })

export type ToolkitLinksProps = {
  links: Links
  item: { path: string; name: string; kind: ToolkitKind }
  /** The desktop puts the panels side by side; a tablet one under the other, under a narrower graph (T15). */
  layout?: Viewport | undefined
  /** The tab's Figma key: `links`, or the node id where the graph has a layer of that name too (T15 482:908). */
  layer?: string | undefined
  onOpenItem?: ((path: string) => void) | undefined
  /** Opens the file a link is written in: the link's side and the link. */
  onOpenLine?: ((side: 'from' | 'to', link: Link) => void) | undefined
}

export function ToolkitLinks({
  links,
  item,
  layout = 'desktop',
  layer = 'links',
  onOpenItem,
  onOpenLine,
}: ToolkitLinksProps) {
  return (
    <section aria-label="Links" className={root} data-figma={layer}>
      <p className={intro}>{links.intro}</p>
      <div className={header} data-figma="links header">
        <h3 className={label}>
          {links.label} {linkCount(links)}
        </h3>
        <span className={hint}>{links.hint}</span>
      </div>
      <ToolkitLinksGraph links={links} item={item} layout={layout} onOpenItem={onOpenItem} />
      <div className={layout === 'desktop' ? panels : panelsStacked} data-figma="row · in and out">
        <ToolkitLinksPanel
          side={links.from}
          layer="panel · linked from"
          onOpenItem={onOpenItem}
          onOpenLine={(l) => {
            onOpenLine?.('from', l)
          }}
        />
        <ToolkitLinksPanel
          side={links.to}
          layer="panel · links to"
          onOpenItem={onOpenItem}
          onOpenLine={(l) => {
            onOpenLine?.('to', l)
          }}
        />
      </div>
      <p className={note}>{links.note}</p>
    </section>
  )
}
