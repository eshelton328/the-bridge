// The list beside an open item (Figma `toolkit list`, D3 427:54): the list
// pane of the app shell, 420 wide, with the header (title, count and
// Read-only), the kind chips, the search and the groups as one column of
// rows, the open item's row selected. A click on a row opens its item; the
// pane scrolls on its own. Props only.
import { FilterChips } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { ToolkitKindChip, type ToolkitData, type ToolkitGroupView, type ToolkitKind, type ToolkitUi } from '../types.ts'
import { ToolkitGroup } from './ToolkitGroup.tsx'
import { ToolkitHeader } from './ToolkitHeader.tsx'
import { ToolkitListTools } from './ToolkitListTools.tsx'

// D3 427:54: the pane's content starts 17 px in from its edges (16 and the 1 px border), the header 21 down, and
// its rows are 10 apart (header 427:55 to the chips 427:64, the search 427:84, the groups and their rows).
const pane = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '10',
  flex: '1',
  minH: '[0]',
  overflowY: 'auto',
  px: '16',
  pt: '20',
  pb: '16',
  bg: 'surface.pane',
  borderInlineWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
})
// D3 427:64: the chip row runs past the pane's right edge, cut after Workflows' dot; the row scrolls sideways.
const chips = css({ maxW: '[100%]' })

export type ToolkitListPaneProps = {
  data: ToolkitData
  ui: ToolkitUi
  /** The groups the chip and the search leave (listView). */
  groups: readonly ToolkitGroupView[]
  /** Names more than one shown item has; those rows get no Figma layer name. */
  sharedNames: ReadonlySet<string>
  onUiChange: (change: Partial<ToolkitUi>) => void
}

export function ToolkitListPane({ data, ui, groups, sharedNames, onUiChange }: ToolkitListPaneProps) {
  const setGroupOpen = (kind: ToolkitKind, isOpen: boolean) => {
    onUiChange({ groupsOpen: { ...ui.groupsOpen, [kind]: isOpen } })
  }
  return (
    <section aria-label="Toolkit" className={pane} data-figma="toolkit list">
      <ToolkitHeader count={data.count} view={ui.view} layout="pane" />
      <div className={chips} data-figma="filter · chips">
        <FilterChips
          label="Filter by kind"
          multiple={false}
          items={data.chips.map((c) => ({
            value: c.value,
            label: c.label,
            count: c.count,
            kind: c.value === 'all' ? undefined : c.value,
          }))}
          value={[ui.filter]}
          onValueChange={(value) => {
            const parsed = ToolkitKindChip.shape.value.safeParse(value[0])
            if (parsed.success) onUiChange({ filter: parsed.data })
          }}
        />
      </div>
      <ToolkitListTools
        query={ui.query}
        layout="pane"
        onQueryChange={(query) => {
          onUiChange({ query })
        }}
      />
      {groups.map((group) => (
        <ToolkitGroup
          key={group.kind}
          group={group}
          layout="pane"
          sharedNames={sharedNames}
          selected={ui.open}
          open={ui.groupsOpen[group.kind] ?? true}
          onOpenChange={(open) => {
            setGroupOpen(group.kind, open)
          }}
          onOpen={(path) => {
            onUiChange({ open: path })
          }}
        />
      ))}
    </section>
  )
}
