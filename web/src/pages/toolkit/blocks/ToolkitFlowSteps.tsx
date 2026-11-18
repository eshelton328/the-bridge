// A workflow's steps on its own page (Figma `panel · flow`, D13 446:515): a
// panel with the header (where the steps come from, and the legend of gate,
// script, agent and person), then the stages left to right, each a column of
// step cards (`ToolkitFlowStep variant="page"`) with a connector between
// stages. A parallel stage stands its two steps one over the other, and a
// single step sits level with the gap between them (`stepRows`, `arrowRows`
// in flowLayout.ts). The library draws each connector (`columnArrow` says
// which): a `FlowLine` between two single steps, a `FlowBranch` into and out
// of the parallel steps, the gate's way out (a `FlowLine` down with its
// label, "no") to the stop under it, and the dashed `FlowLoop` from the last
// step back to the stop, with its label under the step the state names.
// Each tip ends short of the box it points at. A tablet or phone draws the
// column of `ToolkitFlowColumn` instead. Props only.
import { FlowBranch, FlowLine, FlowLoop, Panel, WorkflowIcon } from '@eshelton328/component-library-1701'
import { Fragment } from 'react'
import { css, cx } from '../../../../styled-system/css/index.js'
import { arrowRows, columnArrow, type FlowPage, type FlowRows, stepRows } from './flowLayout.ts'
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
// D13 446:531: the stages in a row; every stage and connector column is four equal rows 32 apart, so each card spans
// two (128 high) and a single step sits level with the gap between two parallel ones (447:31, 447:2, 447:39). The
// flow is the box the loop is placed in, and the scope of the anchors it is placed by.
const flow = css({ position: 'relative', display: 'flex', flexDirection: 'column', gap: '12', anchorScope: 'all' })
const stages = css({ display: 'flex', alignItems: 'stretch' })
const column = css({ display: 'grid', gridTemplateRows: '[repeat(4, 1fr)]', rowGap: '32', flex: '1', minW: '[0]' })
// D13 447:74: the connectors between stages are 20 wide, from one card's edge to the next; the line's tip ends 2
// before the next card (Figma's cards are 22 apart, LIBRARY_GAPS.md, Workflow page flow).
const arrowColumn = css({
  display: 'grid',
  gridTemplateRows: '[repeat(4, 1fr)]',
  rowGap: '32',
  w: '[token(spacing.20)]',
})
const rows: Readonly<Record<FlowRows | '1/5', string>> = {
  '1/3': css({ gridRow: '[1 / 3]' }),
  '2/4': css({ gridRow: '[2 / 4]' }),
  '3/5': css({ gridRow: '[3 / 5]' }),
  '1/5': css({ gridRow: '[1 / 5]' }),
}
const across = css({ display: 'flex', alignItems: 'center' })
// D13 447:79 to 447:82: a fork or a join spans the two parallel steps, its arms at their middles.
const branch = css({ display: 'flex' })
// D13 447:83, 447:85: the way out of the gate runs down from the gate (559, the foot of row 3) to the stop under the
// flow (651, 12 under row 4), with its label beside it.
const exitCell = css({ gridRow: '[4]', display: 'flex', justifyContent: 'center', mt: '-32', mb: '-12' })
// D13 447:84: the loop runs down from the middle of the last step and back along the bottom into the stop's middle.
// Its box is placed by anchors: from the stop's right edge to the last card's middle, and from that card's foot to the
// stop's middle.
const loopFrom = css({ anchorName: '--flow-loop-from' })
const stopAnchor = css({ anchorName: '--flow-stop' })
const loop = css({
  position: 'absolute',
  left: '[anchor(--flow-stop right)]',
  right: '[anchor(--flow-loop-from center)]',
  top: '[anchor(--flow-loop-from bottom)]',
  bottom: '[anchor(--flow-stop center)]',
  display: 'flex',
})
// The stop row mirrors the stages, so the loop's label sits under the stage of its `under` step.
const stopRow = css({ display: 'flex', alignItems: 'flex-end' })
const slot = css({ display: 'flex', flex: '1', minW: '[0]' })
const slotGap = css({ display: 'inline-block', w: '[token(spacing.20)]' })
const stop = css({ flexShrink: '0' })
const stopLine = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6',
  textStyle: 'small',
  color: 'status.needsYou.fg',
})
// D13 447:86: the label 20 after the start of its stage, in amber mono, under the dashed line. `FlowLoop` centres its
// own label on the line (843 here) where Figma's sits under the step it names (992; LIBRARY_GAPS.md, Workflow page
// flow), so the label is drawn here.
const loopLabel = css({ ms: '20', textStyle: 'mono', color: 'status.needsYou.fg', whiteSpace: 'nowrap' })

export type ToolkitFlowStepsProps = {
  page: FlowPage
  /** The id of the selected step. */
  selected?: string | undefined
  onSelect?: ((id: string) => void) | undefined
}

export function ToolkitFlowSteps({ page, selected, onSelect }: ToolkitFlowStepsProps) {
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
  // The loop runs from the last stage back to the stop, so it needs both.
  const looped = page.loop !== undefined && page.exit !== undefined
  const stopBox =
    page.exit === undefined ? null : (
      <div className={cx(stop, stopAnchor)} data-figma={`stop · ${page.exit.workflow}`}>
        <Panel variant="notice" tone="needsYou">
          <p className={stopLine}>
            <WorkflowIcon size="12" />
            {page.exit.text}
          </p>
        </Panel>
      </div>
    )
  const connector = (from: number, to: number) => {
    const kind = columnArrow(from, to)
    if (kind === 'down')
      return arrowRows(from, to).map((r) => (
        <span key={r} className={cx(across, rows[r])}>
          <FlowLine />
        </span>
      ))
    // A fork or a join spans the rows of both parallel steps (1/3 and 3/5), so its arms meet their middles.
    return (
      <span className={cx(branch, rows['1/5'])}>
        <FlowBranch kind={kind} direction="right" gap="32" />
      </span>
    )
  }
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
          <div className={flow} data-figma="flow">
            <div className={stages}>
              {page.stages.map((stage, i) => (
                <Fragment key={stage.map((s) => s.id).join()}>
                  {i === 0 ? null : (
                    <div className={arrowColumn}>{connector(page.stages[i - 1]?.length ?? 1, stage.length)}</div>
                  )}
                  <div className={column}>
                    {stage.map((step, s) => {
                      const r = rows[stepRows(stage.length)[s] ?? '2/4']
                      return card(step, i === last && looped ? cx(r, loopFrom) : r)
                    })}
                    {i === exitStage && page.exit !== undefined ? (
                      <span className={exitCell}>
                        <FlowLine direction="down" tone="needsYou" label={page.exit.label} />
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
            {looped ? (
              <span className={loop}>
                <FlowLoop />
              </span>
            ) : null}
          </div>
        </div>
      </Panel>
    </div>
  )
}
