// One toolkit item as a card. On the desktop (Figma `toolkit card · <name>`,
// D1 425:77): the kind tile, the name over its path, one line of
// description, and the counts: the files it links to (→), the files that
// link to it (←) and its files; the page's legend names the arrows. On a
// tablet or phone it is a row (Figma `toolkit row · <name>`, T1 428:59):
// the kind tile, the name over its path and the two link counts at the
// row's end, with no description. A long path or description ends with an
// ellipsis and shows in full in a tooltip. Props only.
import { Card, KindTile } from '@eshelton328/component-library-1701'
import type { ToolkitItemView } from '../types.ts'

export type ToolkitCardProps = {
  item: ToolkitItemView
  /** The Figma layer the card stands for; none when two shown items share a name. */
  figma?: string | undefined
  /** The tablet row: no description, and the link counts at the row's end. */
  compact?: boolean | undefined
  /** Called when the card is clicked, to open its item; the card is not interactive without it. */
  onSelect?: (() => void) | undefined
}

export function ToolkitCard({ item, figma, compact = false, onSelect }: ToolkitCardProps) {
  if (compact) {
    return (
      <div data-figma={figma}>
        {/* T1 428:59: a 60 px row, the tile 13 in, and the counts (428:67, one mono line "→0 ←1") centred at its end. */}
        <Card
          title={item.name}
          leading={<KindTile kind={item.kind} size="sm" />}
          subtitle={item.path}
          onSelect={onSelect}
          padding="compact"
          trailing={`→${String(item.linksTo)} ←${String(item.linkedFrom)}`}
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
        // D1 425:86: the spacer puts the counts 34 under the description, so the card is 148 high (Figma 150).
        metaSpacer
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
