// The library on a phone (Figma M1 406:69): the header with the count and
// a plus button for Add a link, the source chips, the search with
// icon-only Sort and Filter, when the library last checked its sources,
// and a RowGroup per group: a list of rows with small previews, the age
// and New at each row's end. With a Filter menu, Filter opens it as a
// sheet over the tab bar (M3), as on a tablet, and with a Sort menu, Sort
// opens it as a sheet too (M4). The rows come from libraryView, as the
// grid's cards do. Props only; changes go out through onUiChange.
import { FilterChips, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { FoundStatus } from '../blocks/FoundStatus.tsx'
import { LibraryHeader } from '../blocks/LibraryHeader.tsx'
import { LibraryTools } from '../blocks/LibraryTools.tsx'
import { RowGroup } from '../blocks/RowGroup.tsx'
import { type ArtifactsData, type ArtifactsUi, ArtifactChip } from '../types.ts'
import { libraryView } from './libraryView.ts'

// 406:69: the library starts 4 under the status bar and 12 in; its end scrolls clear of the tab bar (AppShell).
const page = css({ pt: '4', pb: '12', px: '12' })
// 406:77: the chips take their own width; FilterChips' 2 px focus room is Figma's 2 above the chips (406:78).
const chips = css({ alignSelf: 'flex-start', maxW: '[100%]' })
// 406:90 and 406:110: the search row's frame is 44 high with its 36 px controls 8 from the top, and the status's 23
// high with its text 6 from the top.
const toolsRow = css({ pt: '8' })
const statusRow = css({ pt: '6' })

export type LibraryPhoneProps = {
  data: ArtifactsData
  ui: ArtifactsUi
  onUiChange?: ((change: Partial<ArtifactsUi>) => void) | undefined
  onOpenArtifact?: ((id: string) => void) | undefined
  onAddLink?: (() => void) | undefined
}

export function LibraryPhone({ data, ui, onUiChange, onOpenArtifact, onAddLink }: LibraryPhoneProps) {
  const groups = libraryView(data, ui)
  const sort = data.sorts.find((s) => s.value === ui.sort) ?? data.sorts[0]
  const shown = groups.reduce((n, group) => n + group.cards.length, 0)
  return (
    // Figma's rows are 2 apart (406:70 to 406:114), each in a frame with its own padding. FilterChips pads its row 2
    // below the chips too, where Figma's chip frame ends (406:77), so the search row follows it with no gap.
    <Stack gap="2" className={page}>
      <Stack gap="0">
        <Stack gap="2">
          <LibraryHeader
            title={data.title}
            count={ui.query.trim() === '' ? data.count : `${String(shown)} of ${String(data.count)}`}
            found={data.found}
            addLink={data.addLink}
            layout="phone"
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
        </Stack>
        <LibraryTools
          placeholder={data.searchPlaceholder}
          query={ui.query}
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
          // M4: Sort opens the Sort menu as a sheet over the tab bar, as Filter does (M3).
          sortAs="sheet"
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
          // M3: Filter opens the Filter menu as a sheet over the tab bar, as on a tablet (T3).
          filterAs="sheet"
          size="lg"
          iconOnly
          className={toolsRow}
        />
      </Stack>
      <div className={chips}>
        <FoundStatus text={data.found} className={statusRow} />
      </div>
      {/* 406:196: Earlier's header sits 2 under Found's last row; the phone's rows end 4 higher (see RowGroup). */}
      <Stack gap="4">
        {groups.map((group) => (
          <RowGroup
            key={group.id}
            group={group}
            layout="phone"
            open={ui.groupsOpen[group.id]}
            onOpenChange={(open) => {
              onUiChange?.({ groupsOpen: { ...ui.groupsOpen, [group.id]: open } })
            }}
            onOpenArtifact={onOpenArtifact}
          />
        ))}
      </Stack>
    </Stack>
  )
}
