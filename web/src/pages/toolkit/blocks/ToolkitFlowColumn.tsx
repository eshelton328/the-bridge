// A workflow's steps on its own page on a tablet or phone (Figma `steps`, T8
// 448:216): the stages stand in one column with no panel or header, each step
// card (`ToolkitFlowStep variant="column"`) as wide as the column, and a
// parallel stage's steps side by side (`parallel · 4 and 5` 448:256). Between
// two stages an arrow points down (448:223); into a parallel stage an arrow
// points at each of its steps (`fork · 4 and 5` 502:2) and out of it one
// arrow in the middle (`join · 4 and 5` 502:8), as `columnArrow` in
// flowLayout.ts says. The library has no connector line or 14 px icon
// (LIBRARY_GAPS.md, Workflow page flow): the arrows are its 16 px arrow icon,
// with no line or elbow. A gate's way out, when the page has one, is the stop
// box under the column. On the phone (M9 `steps` 448:493) the column is the
// same, as wide as the phone's item; its fork and join are 24 high and named
// `arrows · into 4 and 5` (464:558) and `arrows · out of 4 and 5` (464:560).
// Props only.
import { ArrowDownIcon, Panel, WorkflowIcon } from '@eshelton328/component-library-1701'
import { Fragment } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { type ColumnArrow, columnArrow, type FlowPage } from './flowLayout.ts'
import { ToolkitFlowStep } from './ToolkitFlowStep.tsx'

const column = css({ display: 'flex', flexDirection: 'column', alignItems: 'stretch' })
// T8 448:256: a parallel stage's steps side by side, 8 apart.
const stageRow = css({ display: 'grid', gridAutoColumns: '[1fr]', gridAutoFlow: 'column', gap: '8' })
// T8 448:223: an arrow 18 high, its icon 2 under the card; 502:2 and 502:8: a fork or a join 22 high, its icons 8 under
// the card over it (the 16 px icon 6 under it, against Figma's 14 px icon 8 under it).
const down = css.raw({ display: 'flex', justifyContent: 'center', pt: '2', color: 'fg.muted' })
const fork = css.raw({
  display: 'grid',
  gridAutoColumns: '[1fr]',
  gridAutoFlow: 'column',
  gap: '8',
  justifyItems: 'center',
  pt: '6',
  color: 'fg.muted',
})
const join = css.raw({ display: 'flex', justifyContent: 'center', pt: '6', color: 'fg.muted' })
// M9 464:558 and 464:560: on the phone a fork or a join is 24 high, its icons 8 under the card over it.
const phoneForkJoin = css.raw({ pt: '8' })
const arrows: Readonly<Record<'tablet' | 'phone', Readonly<Record<ColumnArrow, string>>>> = {
  tablet: { down: css(down), fork: css(fork), join: css(join) },
  phone: { down: css(down), fork: css(fork, phoneForkJoin), join: css(join, phoneForkJoin) },
}
const stop = css({ mt: '12' })
const stopLine = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6',
  textStyle: 'small',
  color: 'status.needsYou.fg',
})

type Stage = FlowPage['stages'][number]

const marks = (stage: Stage) => stage.map((s) => s.mark).join(' and ')

export type ToolkitFlowColumnProps = {
  page: FlowPage
  /** The id of the selected step. */
  selected?: string | undefined
  onSelect?: ((id: string) => void) | undefined
  /** `tablet` (T8) or `phone` (M9): the phone's fork and join are taller and named for the arrows. */
  layout?: Exclude<Viewport, 'desktop'> | undefined
}

export function ToolkitFlowColumn({ page, selected, onSelect, layout = 'tablet' }: ToolkitFlowColumnProps) {
  const phone = layout === 'phone'
  const card = (step: Stage[number]) => (
    <ToolkitFlowStep
      key={step.id}
      step={step}
      variant="column"
      selected={step.id === selected}
      onSelect={
        onSelect === undefined
          ? undefined
          : () => {
              onSelect(step.id)
            }
      }
    />
  )
  const arrow = (from: Stage, to: Stage) => {
    const kind = columnArrow(from.length, to.length)
    const layer =
      kind === 'fork'
        ? phone
          ? `arrows · into ${marks(to)}`
          : `fork · ${marks(to)}`
        : kind === 'join'
          ? phone
            ? `arrows · out of ${marks(from)}`
            : `join · ${marks(from)}`
          : undefined
    const icons = kind === 'fork' ? to.map((s) => s.id) : ['down']
    return (
      <div className={arrows[layout][kind]} aria-hidden="true" data-figma={layer}>
        {icons.map((id) => (
          <ArrowDownIcon key={id} size="16" />
        ))}
      </div>
    )
  }
  return (
    <div className={column} data-figma="steps">
      {page.stages.map((stage, i) => {
        const before = page.stages[i - 1]
        return (
          <Fragment key={stage.map((s) => s.id).join()}>
            {before === undefined ? null : arrow(before, stage)}
            {stage.length === 1 ? (
              stage.map((step) => card(step))
            ) : (
              <div className={stageRow} data-figma={`parallel · ${marks(stage)}`}>
                {stage.map((step) => card(step))}
              </div>
            )}
          </Fragment>
        )
      })}
      {page.exit === undefined ? null : (
        <div className={stop} data-figma={`stop · ${page.exit.workflow}`}>
          <Panel variant="notice" tone="needsYou">
            <p className={stopLine}>
              <WorkflowIcon size="12" />
              {page.exit.text}
            </p>
          </Panel>
        </div>
      )}
    </div>
  )
}
