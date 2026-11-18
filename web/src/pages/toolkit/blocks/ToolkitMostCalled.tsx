// The most called items of the Activity view (Figma `panel · MOST CALLED`,
// D11 444:618; T9 `panel · most called` 449:330): a `Panel` with its header
// over the library's `HorizontalBarChart`, each item's kind icon before its
// row. The chart's rows are not buttons, so a column of buttons lies over
// them, one per row and as high: a tap opens the item, and hover or focus
// lights its line. The chart draws every bar in one colour and its labels in
// a column as wide as the longest (LIBRARY_GAPS.md, Most called bars).
// Props only.
import { HorizontalBarChart, Panel } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitActivityCounts } from '../types.ts'
import { calledLayer, panelLayer } from './activityPage.ts'
import { ToolkitEvalsHeader } from './ToolkitEvalsHeader.tsx'
import { ToolkitKindIcon } from './ToolkitKindIcon.tsx'

// D11 444:520: the two panels of a row are as tall as the taller; the section's grid stretches its Panel.
const fill = css({ display: 'grid' })

// D11 444:619 to 444:623: the rows 8 under the header.
const body = css({ display: 'flex', flexDirection: 'column', gap: '8' })
// D11 444:624: the icon, then the name 6 after it.
const chart = css({ position: 'relative', display: 'flex', gap: '6', minW: '[0]' })
// The chart's rows are 8 apart, each as high as its 16 px line: the icons and the buttons keep that pitch.
const column = css({ display: 'grid', gridAutoRows: '[1fr]', rowGap: '8' })
const icon = css({ display: 'flex', alignItems: 'center' })
const bars = css({ flex: '1', minW: '[0]' })
const overlay = css({ position: 'absolute', inset: '0', display: 'grid', gridAutoRows: '[1fr]', rowGap: '8' })
const button = css({
  p: '0',
  bg: 'transparent',
  border: 'none',
  borderRadius: 'sm',
  cursor: 'pointer',
  _hover: { bg: 'surface.selected' },
  _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
})

export type ToolkitMostCalledProps = {
  mostCalled: ToolkitActivityCounts['mostCalled']
  layout: Viewport
  /** Opens an item on its page, by its path. */
  onOpen?: ((path: string) => void) | undefined
}

export function ToolkitMostCalled({ mostCalled, layout, onOpen }: ToolkitMostCalledProps) {
  return (
    <section className={fill} aria-label={mostCalled.label} data-figma={panelLayer(mostCalled.label, layout)}>
      <Panel>
        <div className={body}>
          <ToolkitEvalsHeader
            level={2}
            label={mostCalled.label}
            end={mostCalled.meta === undefined ? null : { type: 'note', label: mostCalled.meta }}
          />
          <div className={chart}>
            <div className={column} aria-hidden="true">
              {mostCalled.rows.map((r) => (
                <span key={r.path} className={icon}>
                  <ToolkitKindIcon kind={r.kind} size="12" />
                </span>
              ))}
            </div>
            <div className={bars}>
              <HorizontalBarChart
                label={mostCalled.label}
                rows={mostCalled.rows.map((r) => ({ label: r.name, value: r.value }))}
              />
            </div>
            <div className={overlay}>
              {mostCalled.rows.map((r) => (
                <button
                  key={r.path}
                  type="button"
                  className={button}
                  aria-label={`Open ${r.name}`}
                  data-figma={calledLayer(r)}
                  onClick={() => {
                    onOpen?.(r.path)
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </section>
  )
}
