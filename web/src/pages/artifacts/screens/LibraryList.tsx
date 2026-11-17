// The library as a list beside an open artifact (Figma "library list", D2
// 403:143): the header with the count and Add a link, the source chips,
// the search with Sort and Filter, and a RowGroup per group. The rows come
// from libraryView, as the grid's cards do. Props only; changes go out
// through onUiChange.
import { Button, FilterChips, PageHeader, PlusIcon, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { RowGroup } from '../blocks/RowGroup.tsx'
import { LibraryTools } from '../blocks/LibraryTools.tsx'
import { type ArtifactsData, type ArtifactsUi, ArtifactChip } from '../types.ts'
import { libraryView } from './libraryView.ts'

// 403:143: the pane fills the shell's list column, 12 in, as the Inbox list pane does; it scrolls.
const pane = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  overflowY: 'auto',
  p: '12',
  bg: 'surface.pane',
})
// 403:144: the title sits 4 in from the pane's padding and 2 below it.
const header = css({ pt: '2', px: '4' })
// As in ArtifactsLibrary: the chips take their own width, and the margin takes back FilterChips' 2 px focus room.
const chips = css({ alignSelf: 'flex-start', maxW: '[100%]', m: '-2' })

export type LibraryListProps = {
  data: ArtifactsData
  ui: ArtifactsUi
  /** The open artifact, whose row is selected. */
  selectedId: string
  onUiChange?: ((change: Partial<ArtifactsUi>) => void) | undefined
  onOpenArtifact?: ((id: string) => void) | undefined
  onAddLink?: (() => void) | undefined
}

export function LibraryList({ data, ui, selectedId, onUiChange, onOpenArtifact, onAddLink }: LibraryListProps) {
  const groups = libraryView(data, ui)
  const sort = data.sorts.find((s) => s.value === ui.sort) ?? data.sorts[0]
  return (
    <section aria-label="Artifacts list" className={pane} data-figma="library list">
      <Stack gap="8">
        <div className={header} data-figma="header">
          <PageHeader title={data.title} count={data.count} countLabel={`${String(data.count)} artifacts`}>
            <span data-figma="button · Add a link">
              <Button iconOnly aria-label={data.addLink} onClick={onAddLink}>
                <PlusIcon />
              </Button>
            </span>
          </PageHeader>
        </div>
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
        />
      </Stack>
      <Stack gap="2">
        {groups.map((group) => (
          <RowGroup
            key={group.id}
            group={group}
            open={ui.groupsOpen[group.id]}
            selectedId={selectedId}
            onOpenChange={(open) => {
              onUiChange?.({ groupsOpen: { ...ui.groupsOpen, [group.id]: open } })
            }}
            onOpenArtifact={onOpenArtifact}
          />
        ))}
      </Stack>
    </section>
  )
}
