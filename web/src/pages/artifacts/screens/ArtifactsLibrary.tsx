// The library (Figma 402:15370): the header with the count, the source
// chips, the search row, and the groups of artifact cards, newest first,
// with what the library found since the owner last looked at the top. The cards
// come from libraryView (the chip and the search over the state's groups).
// The List view (D4) shows them as rows (LibraryRows). During a search the
// count says how many of the library's artifacts show, such as "3 of 24".
// With `data.addLinkForm` Add a link opens the Add a link dialog (D5), and
// with `data.sortMenu` Sort opens the Sort menu (D6). On a tablet Filter
// opens its menu as a sheet (T3).
// Props only; changes go out through onUiChange.
import { FilterChips, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { AddLinkDialog } from '../blocks/AddLinkDialog.tsx'
import { CardGroup } from '../blocks/CardGroup.tsx'
import { LibraryHeader } from '../blocks/LibraryHeader.tsx'
import { LibraryTools } from '../blocks/LibraryTools.tsx'
import { type ArtifactsData, type ArtifactsUi, ArtifactChip } from '../types.ts'
import { LibraryRows } from './LibraryRows.tsx'
import { libraryView } from './libraryView.ts'

// D1 402:15370: the library starts 32 in from the rail and 24 down; its rows are 12 apart.
const page = {
  desktop: css({ pt: '24', pb: '32', px: '32' }),
  // T1 405:105: the header starts 24 under the status bar and 22 in (20 on the 4 px grid, d-100, so the two card
  // columns are wide enough for Figma's whole descriptions; see CardGroup); rows 10 apart.
  tablet: css({ pt: '24', pb: '20', px: '20' }),
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
  const shown = groups.reduce((n, group) => n + group.cards.length, 0)
  return (
    <Stack gap={layout === 'tablet' ? '10' : '12'} className={page[layout]}>
      <LibraryHeader
        title={data.title}
        count={ui.query.trim() === '' ? data.count : `${String(shown)} of ${String(data.count)}`}
        found={data.found}
        addLink={data.addLink}
        layout={layout}
        onAddLink={
          data.addLinkForm === undefined
            ? onAddLink
            : () => {
                onUiChange?.({ addLinkOpen: true })
              }
        }
      />
      {data.addLinkForm === undefined ? null : (
        <AddLinkDialog
          form={data.addLinkForm}
          open={ui.addLinkOpen ?? false}
          source={ui.addLinkSource ?? 'claude'}
          onOpenChange={(addLinkOpen) => {
            onUiChange?.({ addLinkOpen })
          }}
          onSourceChange={(addLinkSource) => {
            onUiChange?.({ addLinkSource })
          }}
          onSubmit={() => {
            onUiChange?.({ addLinkOpen: false })
          }}
        />
      )}
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
        searchFocus={ui.searchFocus}
        onQueryChange={(query) => {
          onUiChange?.({ query })
        }}
        sortLabel={sort?.label ?? ''}
        sortMenu={data.sortMenu}
        sort={ui.sort}
        sortOpen={ui.sortOpen}
        onSortOpenChange={(sortOpen) => {
          onUiChange?.({ sortOpen })
        }}
        onSortChange={(picked) => {
          onUiChange?.({ sort: picked, sortOpen: false })
        }}
        filterMenu={data.filterMenu}
        filterChecks={ui.filterChecks}
        filterOpen={ui.filterOpen}
        onFilterOpenChange={(filterOpen) => {
          onUiChange?.({ filterOpen })
        }}
        onFilterChecksChange={(filterChecks) => {
          onUiChange?.({ filterChecks })
        }}
        onFilterApply={() => {
          onUiChange?.({ filterOpen: false })
        }}
        // T3: a tablet or phone opens the Filter menu as a sheet over the tab bar.
        filterAs={layout === 'desktop' ? 'popover' : 'sheet'}
        size={layout === 'desktop' ? 'md' : 'lg'}
        view={ui.view}
        onViewChange={(view) => {
          onUiChange?.({ view })
        }}
      />
      {ui.view === 'list' ? (
        <LibraryRows data={data} ui={ui} onUiChange={onUiChange} onOpenArtifact={onOpenArtifact} />
      ) : null}
      {(ui.view === 'list' ? [] : groups).map((group) => (
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
