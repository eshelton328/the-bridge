// One toolkit item as a card. On the desktop (Figma `toolkit card · <name>`,
// D1 425:77): the kind tile, the name over its path, one line of
// description, and the counts: the files it links to (→), the files that
// link to it (←) and its files; the page's legend names the arrows. On a
// tablet or phone it is a row (Figma `toolkit row · <name>`, T1 428:59):
// the kind tile, the name over its path and the two link counts, with no
// description. A long path or description ends with an ellipsis and shows
// in full in a tooltip. Props only.
import { Card, KindTile } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitItemView } from '../types.ts'

// T1 428:67: the counts are one mono line, "→0 ←1".
const counts = css({ textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap' })

export type ToolkitCardProps = {
  item: ToolkitItemView
  /** The Figma layer the card stands for; none when two shown items share a name. */
  figma?: string | undefined
  /** The tablet and phone row: no description, and the link counts beside the name. */
  compact?: boolean | undefined
  /** Called when the card is clicked, to open its item; the card is not interactive without it. */
  onSelect?: (() => void) | undefined
}

export function ToolkitCard({ item, figma, compact = false, onSelect }: ToolkitCardProps) {
  if (compact) {
    return (
      <div data-figma={figma}>
        <Card
          title={item.name}
          leading={<KindTile kind={item.kind} size="sm" />}
          subtitle={item.path}
          onSelect={onSelect}
          badge={<span className={counts}>{`→${String(item.linksTo)} ←${String(item.linkedFrom)}`}</span>}
        />
      </div>
    )
  }
  return (
    <div data-figma={figma}>
      <Card
        title={item.name}
        leading={<KindTile kind={item.kind} size="lg" />}
        subtitle={item.path}
        description={item.description}
        onSelect={onSelect}
        meta={
          <>
            <span>{`→ ${String(item.linksTo)}`}</span>
            <span>{`← ${String(item.linkedFrom)}`}</span>
            <span>{`${String(item.files)} ${item.files === 1 ? 'file' : 'files'}`}</span>
          </>
        }
      />
    </div>
  )
}
