// One toolkit item as a phone row (Figma `toolkit row · <name>`, M1 429:96):
// the kind tile, the name over its path, and at the end the two link
// counts (→ the files it links to, ← the files that link to it) and a
// chevron, with no surface or border. Props only.
import { ChevronRightIcon, KindTile, ListRow } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitItemView } from '../types.ts'

// M1 429:104: the counts in the path's grey, then the chevron, in one line at the row's end. Figma's chevron
// (429:105) is 14 px, 12 after the counts; no icon token has 14, and with 16 the longest path
// (agents/pr-description-checker.md, 429:243) wraps, so the chevron is 12, 6 after the counts.
const end = css({ display: 'inline-flex', alignItems: 'center', gap: '6', color: 'fg.muted' })

export type ToolkitRowProps = {
  item: ToolkitItemView
  /** The Figma layer the row stands for; none when two shown items share a name. */
  figma?: string | undefined
}

export function ToolkitRow({ item, figma }: ToolkitRowProps) {
  return (
    <div data-figma={figma}>
      <ListRow
        title={item.name}
        leading={<KindTile kind={item.kind} size="lg" />}
        meta={item.path}
        trailing={
          <span className={end}>
            {`→${String(item.linksTo)} ←${String(item.linkedFrom)}`}
            <ChevronRightIcon size="12" />
          </span>
        }
      />
    </div>
  )
}
