// A group of the list beside an open artifact (Figma "group · …", D2
// 403:186): the group header with the count and the New dot, as CardGroup
// draws it, and under it, while the group is open, one row per artifact.
// Props only.
import { GroupHeader, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactGroup } from '../types.ts'
import { ArtifactRow } from './ArtifactRow.tsx'

// Figma's rows are 58 high, 2 apart (403:193 to 403:219); `ListRow` pads 10 inside its border, so a row is 62
// (LIBRARY_GAPS.md: List row padding). Each row after the first starts 2 up into the last one's padding, so the rows
// keep Figma's 60 px pitch and the groups below stay where Figma has them.
const rows = css({ '& > * + *': { mt: '-2' } })

export type RowGroupProps = {
  group: ArtifactGroup
  open: boolean
  /** The open artifact, whose row is selected. */
  selectedId: string
  onOpenChange?: ((open: boolean) => void) | undefined
  onOpenArtifact?: ((id: string) => void) | undefined
}

export function RowGroup({ group, open, selectedId, onOpenChange, onOpenArtifact }: RowGroupProps) {
  const contentId = `artifacts-rows-${group.id}`
  return (
    <Stack gap="2">
      {/* Level 2 under the list's h1, around the toggle, as CardGroup's heading. */}
      <div role="heading" aria-level={2} data-figma={`group · ${group.label.toUpperCase()}`}>
        <GroupHeader
          label={group.label}
          count={group.count}
          dot={group.dot ? 'working' : undefined}
          open={open}
          onOpenChange={onOpenChange}
          contentId={contentId}
        />
      </div>
      {open ? (
        <Stack gap="0" id={contentId} className={rows}>
          {group.cards.map((card) => (
            <ArtifactRow key={card.id} card={card} selected={card.id === selectedId} onOpen={onOpenArtifact} />
          ))}
        </Stack>
      ) : null}
    </Stack>
  )
}
