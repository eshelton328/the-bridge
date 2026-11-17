// The library (Figma 402:15370): the header with the count, the source
// chips, the search row, and the groups of artifact cards, newest first,
// with what the library found since Erik last looked at the top. The cards
// come from libraryView (the chip and the search over the state's groups).
// Props only; changes go out through onUiChange.
import { FilterChips, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { CardGroup } from '../blocks/CardGroup.tsx'
import { LibraryHeader } from '../blocks/LibraryHeader.tsx'
import { LibraryTools } from '../blocks/LibraryTools.tsx'
import { type ArtifactsData, type ArtifactsUi, ArtifactChip } from '../types.ts'
import { libraryView } from './libraryView.ts'

// D1 402:15370: the library starts 32 in from the rail and 24 down; its rows are 12 apart.
const page = {
  desktop: css({ pt: '24', pb: '32', px: '32' }),
  tablet: css({ pt: '12', pb: '20', px: '24' }),
  phone: css({ pt: '4', pb: '12', px: '12' }),
}
// The chips take their own width (402:15384), not the row's. FilterChips pads its row 2 (for the focus ring);
// the margin takes it back, so the chips sit where Figma has them and the rows under them keep Figma's 12 gaps.
const chips = css({ alignSelf: 'flex-start', maxW: '[100%]', m: '-2' })

export type ArtifactsLibraryProps = {
  data: ArtifactsData
  ui: ArtifactsUi
  layout: Viewport
  onUiChange?: ((change: Partial<ArtifactsUi>) => void) | undefined
  onOpenArtifact?: ((id: string) => void) | undefined
  onAddLink?: (() => void) | undefined
}

export function ArtifactsLibrary({ data, ui, layout, onUiChange, onOpenArtifact, onAddLink }: ArtifactsLibraryProps) {
  const groups = libraryView(data, ui)
  const sort = data.sorts.find((s) => s.value === ui.sort) ?? data.sorts[0]
  return (
    <Stack gap="12" className={page[layout]}>
      <LibraryHeader
        title={data.title}
        count={data.count}
        found={data.found}
        addLink={data.addLink}
        onAddLink={onAddLink}
      />
      <div className={chips} data-figma="filter · chips">
        <FilterChips
          label="Filter by source"
          items={data.chips}
          value={[ui.filter]}
          multiple={false}
          size="compact"
          onValueChange={(values) => {
            const picked = ArtifactChip.shape.value.safeParse(values[0])
            if (picked.success) onUiChange?.({ filter: picked.data })
          }}
        />
      </div>
      <LibraryTools
        placeholder={data.searchPlaceholder}
        query={ui.query}
        onQueryChange={(query) => {
          onUiChange?.({ query })
        }}
        sortLabel={sort?.label ?? ''}
        view={ui.view}
        onViewChange={(view) => {
          onUiChange?.({ view })
        }}
      />
      {groups.map((group) => (
        <CardGroup
          key={group.id}
          group={group}
          layout={layout}
          open={ui.groupsOpen[group.id]}
          onOpenChange={(open) => {
            onUiChange?.({ groupsOpen: { ...ui.groupsOpen, [group.id]: open } })
          }}
          onOpenArtifact={onOpenArtifact}
        />
      ))}
    </Stack>
  )
}
