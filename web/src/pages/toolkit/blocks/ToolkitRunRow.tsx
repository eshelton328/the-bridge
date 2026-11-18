// A run in progress in the Activity view (Figma `run · writing-reviewer`, D11
// 444:526, T9 449:263, M10 449:569): the library's `ListRow` as a card, with
// the live dot, the kind's icon, the name, the line under it and how long it
// has run. On the desktop the row's chips (the project and the feature) sit
// under the line and Open session at its end (444:540); on a tablet or phone
// a chevron ends the row. A tap on the row, or on Open session, opens the run
// (D12); the open run's row is selected. Props only.
import {
  Button,
  ChevronRightIcon,
  ExternalLinkIcon,
  Inline,
  ListRow,
  MetaChip,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitRun } from '../types.ts'
import { runLayer } from './activityPage.ts'
import { ToolkitKindIcon } from './ToolkitKindIcon.tsx'

const elapsed = css({ textStyle: 'mono', color: 'fg.default', whiteSpace: 'nowrap' })
// D11 444:539 to 444:540: the time, then Open session 10 after it; T9 449:271: the time, then the chevron.
const end = css({ display: 'flex', alignItems: 'center', gap: '10', color: 'fg.muted' })
// D11 444:533: the line under the name is Regular 12, the small style of the row's lines (its meta is mono).
const line = css({ display: 'block', truncate: true, minW: '[0]', maxW: '[100%]' })

export type ToolkitRunRowProps = {
  run: ToolkitRun
  layout: Viewport
  /** What the run's status dot says, such as "Running". */
  status: string
  /** The row's button on the desktop, such as "Open session". */
  open?: string | undefined
  selected?: boolean | undefined
  onOpen?: ((id: string) => void) | undefined
}

export function ToolkitRunRow({ run, layout, status, open, selected = false, onOpen }: ToolkitRunRowProps) {
  const desktop = layout === 'desktop'
  const select = () => {
    onOpen?.(run.id)
  }
  return (
    <li data-figma={runLayer(run)}>
      <ListRow
        title={run.name}
        leading={<ToolkitKindIcon kind={run.kind} size="16" />}
        dot="done"
        dotLabel={status}
        surface="card"
        // D11 444:532: the name 8 under the row's top, the chips ending 8 above its foot.
        padding="sm"
        trailingAlign="center"
        selected={selected}
        onSelect={select}
        trailing={
          <span className={end}>
            <span className={elapsed}>{run.elapsed}</span>
            {desktop && open !== undefined ? (
              // On the title's line with the time: the row's actions slot puts its buttons on a line of their own.
              <Button
                variant="secondary"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation()
                  select()
                }}
              >
                <ExternalLinkIcon size="12" />
                {open}
              </Button>
            ) : (
              <ChevronRightIcon size="16" />
            )}
          </span>
        }
      >
        {run.meta === '' ? null : <span className={line}>{run.meta}</span>}
        {desktop && run.chips !== undefined && run.chips.length > 0 ? (
          <Inline gap="6">
            {run.chips.map((c) => (
              <MetaChip key={c} label={c} size="sm" />
            ))}
          </Inline>
        ) : null}
      </ListRow>
    </li>
  )
}
