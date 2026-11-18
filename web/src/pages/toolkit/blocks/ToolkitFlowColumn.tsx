// A workflow's steps on its own page on a tablet or phone (Figma `steps`, T8
// 448:216): the stages stand in one column with no panel or header, each step
// card (`ToolkitFlowStep variant="column"`) as wide as the column, and a
// parallel stage's steps side by side (`parallel · 4 and 5` 448:256). The
// library draws each connector, as `columnArrow` in flowLayout.ts says: a
// `FlowLine` down between two stages (448:223), a `FlowBranch` fork into a
// parallel stage (`fork · 4 and 5` 502:2, an arm into each step) and a join
// out of it (`join · 4 and 5` 502:8); each tip ends 2 before the card under
// it. A gate's way out, when the page has one, is the stop box under the
// column. On the phone (M9 `steps` 448:493) the column is the same, as wide
// as the phone's item; its fork and join are 24 high and named
// `arrows · into 4 and 5` (464:558) and `arrows · out of 4 and 5` (464:560).
// Props only.
import { FlowBranch, FlowLine, Panel, WorkflowIcon } from '@eshelton328/component-library-1701'
import { Fragment } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { type ColumnArrow, columnArrow, type FlowPage } from './flowLayout.ts'
import { ToolkitFlowStep } from './ToolkitFlowStep.tsx'

const column = css({ display: 'flex', flexDirection: 'column', alignItems: 'stretch' })
// T8 448:256: a parallel stage's steps side by side, 8 apart.
const stageRow = css({ display: 'grid', gridAutoColumns: '[1fr]', gridAutoFlow: 'column', gap: '8' })
// T8 448:223: a connector 18 high, its line from 2 under the card to the card under it; 502:2 and 502:8: a fork or a
// join 22 high, from 2 under the card over it. Figma's arrow heads are 14 px icons; the library's head is drawn on the
// line (LIBRARY_GAPS.md, Workflow page flow).
const down = css.raw({ display: 'grid', justifyContent: 'center', gridTemplateRows: '[token(spacing.16)]', pt: '2' })
const forkJoin = css.raw({ display: 'grid', gridTemplateRows: '[token(spacing.20)]', pt: '2' })
// M9 464:558 and 464:560: on the phone a fork or a join is 24 high, its elbow from the card over it (464:559).
const phoneForkJoin = css.raw({ gridTemplateRows: '[token(spacing.24)]', pt: '0' })
const arrows: Readonly<Record<'tablet' | 'phone', Readonly<Record<ColumnArrow, string>>>> = {
  tablet: { down: css(down), fork: css(forkJoin), join: css(forkJoin) },
  phone: { down: css(down), fork: css(forkJoin, phoneForkJoin), join: css(forkJoin, phoneForkJoin) },
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
    return (
      <div className={arrows[layout][kind]} data-figma={layer}>
        {kind === 'down' ? <FlowLine direction="down" /> : <FlowBranch kind={kind} direction="down" gap="8" />}
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
