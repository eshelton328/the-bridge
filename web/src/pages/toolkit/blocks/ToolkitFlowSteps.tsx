// A workflow's steps on its own page (Figma `panel · flow`, D13 446:515): a
// panel with the header (where the steps come from, and the legend of gate,
// script, agent and person), then the stages left to right, each a column of
// step cards (`ToolkitFlowStep variant="page"`) with an arrow between stages.
// A parallel stage stands its two steps one over the other, and a single step
// sits level with the gap between them (`stepRows`, `arrowRows` in
// screens/flowView.ts). Under the stage with the gate, its way out ("no") and
// the stop it leads to; the loop back to the stop is its label, under the
// step the state names. The library has no connector line (LIBRARY_GAPS.md,
// Workflow page flow): the arrows are its arrow icons, with no line, no elbow
// and no dashed loop. On a tablet or phone the stages stand in one column,
// the steps of a parallel stage side by side. Props only.
import { ArrowDownIcon, ArrowRightIcon, Panel, WorkflowIcon } from '@eshelton328/component-library-1701'
import { Fragment } from 'react'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { arrowRows, type FlowPage, type FlowRows, stepRows } from './flowLayout.ts'
import { ToolkitFlowStep } from './ToolkitFlowStep.tsx'

// D13 446:515: the content 15 under the top and over the foot (the Panel's 12, 2 more and the border), 17 in at the
// sides (its 16 and the border); the header and the flow 10 apart.
const body = css({ display: 'flex', flexDirection: 'column', gap: '10', py: '2' })
const header = css({ display: 'flex', alignItems: 'center', gap: '12' })
const label = css({ textStyle: 'monoCaps', color: 'fg.muted' })
// D13 446:519: the legend's items 14 apart (12), each a swatch and its word, 5 apart (4).
const legend = css({ display: 'flex', alignItems: 'center', gap: '12', ms: 'auto' })
const legendItem = css({ display: 'flex', alignItems: 'center', gap: '4', textStyle: 'small', color: 'fg.muted' })
// D13 446:520: a 9 px square; no size token has 9, so the 12 px icon size (LIBRARY_GAPS.md, Workflow page flow).
const swatchBase = css.raw({ display: 'inline-block', w: 'icon.12', h: 'icon.12', borderRadius: 'hair' })
const swatch = {
  gate: css(swatchBase, { bg: 'status.needsYou.fg' }),
  script: css(swatchBase, { bg: 'fg.accent' }),
  agent: css(swatchBase, { bg: 'kind.agent' }),
  person: css(swatchBase, { bg: 'fg.default' }),
}
// D13 446:531: the stages in a row; every stage and arrow column is four equal rows 32 apart, so each card spans two
// (128 high) and a single step sits level with the gap between two parallel ones (447:31, 447:2, 447:39).
const flow = css({ display: 'flex', flexDirection: 'column', gap: '12' })
const stages = css({ display: 'flex', alignItems: 'stretch' })
const column = css({ display: 'grid', gridTemplateRows: '[repeat(4, 1fr)]', rowGap: '32', flex: '1', minW: '[0]' })
// D13 447:74: the arrows between stages are 20 wide: the 12 px icon with 4 at each side.
const arrowColumn = css({ display: 'grid', gridTemplateRows: '[repeat(4, 1fr)]', rowGap: '32', px: '4' })
const rows: Readonly<Record<FlowRows, string>> = {
  '1/3': css({ gridRow: '[1 / 3]' }),
  '2/4': css({ gridRow: '[2 / 4]' }),
  '3/5': css({ gridRow: '[3 / 5]' }),
}
const arrow = css({ display: 'flex', alignItems: 'center', color: 'fg.muted' })
// D13 447:83, 447:85: the way out of the gate runs down under it, its label beside the arrow, in amber; the stop is 12
// under the flow's lowest card (447:68). The row under the cards is empty under a single step, so the label and the
// arrow take it, 20 higher (into the gap over it), as Figma starts them under the gate (559).
const exitCell = css({
  gridRow: '[4]',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4',
  mt: '-20',
  textStyle: 'small',
  color: 'status.needsYou.fg',
})
const loopDown = css({
  gridRow: '[4]',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-end',
  color: 'status.needsYou.fg',
})
// The stop row mirrors the stages, so the loop's label sits under the stage of its `under` step.
const stopRow = css({ display: 'flex', alignItems: 'flex-end' })
const slot = css({ display: 'flex', flex: '1', minW: '[0]' })
const slotGap = css({ display: 'inline-block', w: 'icon.12', mx: '4' })
const stop = css({ flexShrink: '0' })
const stopLine = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6',
  textStyle: 'small',
  color: 'status.needsYou.fg',
})
// D13 447:86: the label 20 after the start of its stage, in amber mono, under the dashed line.
const loopLabel = css({ ms: '20', textStyle: 'mono', color: 'status.needsYou.fg', whiteSpace: 'nowrap' })
// A tablet or phone: the stages in one column, an arrow down between them, a parallel stage's steps side by side.
const narrowStages = css({ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '4' })
const narrowStage = css({ display: 'grid', gridAutoColumns: '[1fr]', gridAutoFlow: 'column', gap: '8' })
const narrowArrow = css({ display: 'flex', justifyContent: 'center', color: 'fg.muted' })

export type ToolkitFlowStepsProps = {
  page: FlowPage
  /** The id of the selected step. */
  selected?: string | undefined
  onSelect?: ((id: string) => void) | undefined
  layout?: Viewport | undefined
}

export function ToolkitFlowSteps({ page, selected, onSelect, layout = 'desktop' }: ToolkitFlowStepsProps) {
  const desktop = layout === 'desktop'
  const card = (step: FlowPage['stages'][number][number], className?: string) => (
    <ToolkitFlowStep
      key={step.id}
      step={step}
      variant="page"
      className={className}
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
  const exitStage = page.stages.findIndex((stage) => stage.some((s) => s.id === page.exit?.from))
  const loopStage = page.stages.findIndex((stage) => stage.some((s) => s.id === page.loop?.under))
  const last = page.stages.length - 1
  const stopBox =
    page.exit === undefined ? null : (
      <div className={stop} data-figma={`stop · ${page.exit.workflow}`}>
        <Panel variant="notice" tone="needsYou">
          <p className={stopLine}>
            <WorkflowIcon size="12" />
            {page.exit.text}
          </p>
        </Panel>
      </div>
    )
  return (
    <div data-figma="panel · flow">
      <Panel>
        <div className={body}>
          <div className={header} data-figma="flow header">
            <h3 className={label}>{page.label}</h3>
            <ul className={legend} aria-label="Legend">
              {page.legend.map((l) => (
                <li key={l.type} className={legendItem} data-figma={`legend · ${l.type}`}>
                  <span className={swatch[l.type]} aria-hidden="true" />
                  {l.label}
                </li>
              ))}
            </ul>
          </div>
          {desktop ? (
            <div className={flow} data-figma="flow">
              <div className={stages}>
                {page.stages.map((stage, i) => (
                  <Fragment key={stage.map((s) => s.id).join()}>
                    {i === 0 ? null : (
                      <div className={arrowColumn} aria-hidden="true">
                        {arrowRows(page.stages[i - 1]?.length ?? 1, stage.length).map((r) => (
                          <span key={r} className={cx(arrow, rows[r])}>
                            <ArrowRightIcon size="12" />
                          </span>
                        ))}
                      </div>
                    )}
                    <div className={column}>
                      {stage.map((step, s) => card(step, rows[stepRows(stage.length)[s] ?? '2/4']))}
                      {i === exitStage && page.exit !== undefined ? (
                        <span className={exitCell}>
                          <ArrowDownIcon size="12" aria-hidden="true" />
                          {page.exit.label}
                        </span>
                      ) : null}
                      {i === last && page.loop !== undefined ? (
                        <span className={loopDown} aria-hidden="true">
                          <ArrowDownIcon size="12" />
                        </span>
                      ) : null}
                    </div>
                  </Fragment>
                ))}
              </div>
              <div className={stopRow}>
                {page.stages.map((stage, i) => (
                  <Fragment key={stage.map((s) => s.id).join()}>
                    {i === 0 ? null : <span className={slotGap} />}
                    <div className={slot}>
                      {i === exitStage ? stopBox : null}
                      {i === loopStage && page.loop !== undefined ? (
                        <span className={loopLabel} data-figma={page.loop.label}>
                          {page.loop.label}
                        </span>
                      ) : null}
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>
          ) : (
            <div className={narrowStages} data-figma="flow">
              {page.stages.map((stage, i) => (
                <Fragment key={stage.map((s) => s.id).join()}>
                  {i === 0 ? null : (
                    <span className={narrowArrow} aria-hidden="true">
                      <ArrowDownIcon size="12" />
                    </span>
                  )}
                  <div className={narrowStage}>{stage.map((step) => card(step))}</div>
                </Fragment>
              ))}
              {stopBox}
            </div>
          )}
        </div>
      </Panel>
    </div>
  )
}
