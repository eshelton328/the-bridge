// One toolkit item as a card (Figma `toolkit card · <name>`, D1 425:77):
// the kind tile, the name over its path, one line of description, and the
// counts: the files it links to (→), the files that link to it (←) and
// its files; the page's legend names the arrows. A long path or
// description ends with an ellipsis and shows in full in a tooltip. Props
// only.
import { Card, KindTile } from '@eshelton328/component-library-1701'
import type { ToolkitItemView } from '../types.ts'

export type ToolkitCardProps = {
  item: ToolkitItemView
  /** The Figma layer the card stands for; none when two shown items share a name. */
  figma?: string | undefined
}

export function ToolkitCard({ item, figma }: ToolkitCardProps) {
  return (
    <div data-figma={figma}>
      <Card
        title={item.name}
        leading={<KindTile kind={item.kind} size="lg" />}
        subtitle={item.path}
        description={item.description}
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
