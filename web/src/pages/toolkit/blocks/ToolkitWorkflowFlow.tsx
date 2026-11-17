// A workflow's steps by phase (Figma `kind section · workflow`, D8
// 433:1034): the section's label and Open full page over a bordered box with
// one lane for each phase, left to right, each with its label over it and
// its step cards (`ToolkitFlowStep`) in rows, all one size. An arrow joins
// the steps of a phase that run one after another, and an arrow comes into
// a phase from the one before it, at the rows the state names; the loop
// back to the start is its label under the lanes. Under the box: the agents
// the workflow runs, each a button that opens it, and a note. The library
// has no line between steps (LIBRARY_GAPS.md, Workflow flow by phase): the
// arrows are its arrow icons, with no line, no elbow and no dashed loop.
// Props only.
import {
  AgentIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  Badge,
  Button,
  ExternalLinkIcon,
} from '@eshelton328/component-library-1701'
import { Fragment } from 'react'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { ToolkitItemDetailView } from '../types.ts'
import { ToolkitFlowStep } from './ToolkitFlowStep.tsx'

type Flow = NonNullable<ToolkitItemDetailView['flow']>

// D8 433:1034: the header (29 high), the box and the agents' row, 10 apart.
// A branch label ("yes", "no") with its destination for a screen reader; the arrow icons stay hidden.
const srOnly = css({ srOnly: true })
const section = css({ display: 'flex', flexDirection: 'column', gap: '10' })
const header = css({ display: 'flex', alignItems: 'center', gap: '8' })
const heading = css({ textStyle: 'eyebrow', color: 'fg.muted' })
const open = css({ ms: 'auto' })
// D8 458:2: 948 × 384, the lane labels 12 under the top and the lanes 14 in from the sides and 12 over the end.
// Four lanes 212 wide and 24 apart: the arrow columns between them are 24 wide (a 12 px icon with 6 each side).
// Rows: the labels, the lanes' 10 px top, three card rows with an arrow row between each, and the loop's row. The
// card rows are equal (1fr), so every card has the size of the tallest.
const box = css({
  display: 'grid',
  gridTemplateColumns: '[1fr auto 1fr auto 1fr auto 1fr]',
  gridTemplateRows: '[auto auto 1fr auto 1fr auto 1fr auto]',
  px: '12',
  pt: '12',
  pb: '12',
  bg: 'surface.pane',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'xl',
})
// D8 458:3: a lane is a tinted rounded box under its steps; its label (458:7) is 8 in, 3 over it.
const lane = css({ gridRow: '[2 / 9]', bg: 'surface.raised', borderRadius: 'lg' })
const laneLabel = css({ gridRow: '[1]', ps: '8', pb: '4', textStyle: 'eyebrow', color: 'fg.muted' })
const laneTop = css({ gridRow: '[2]', gridColumn: '[1]', pt: '10' })
const cardSides = css({ mx: '8' })
const arrow = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  color: 'fg.muted',
  textStyle: 'small',
})
// The icon alone is padded to the column's 24 px; the label over it ("yes", 22 wide) fits inside.
const across = css({ alignSelf: 'center' })
const acrossIcon = css({ display: 'inline-flex', px: '6' })
const down = css({ py: '2' })
// D8 466:11: the loop's label sits on the dashed line, 24 under the last row and centred on the box; the lanes end
// 52 under the last row (458:3 ends at 675).
const loopRow = css({
  gridRow: '[8]',
  gridColumn: '[1 / -1]',
  display: 'flex',
  justifyContent: 'center',
  pt: '24',
  pb: '8',
})
// D8 433:1086: as wide as its content (445), the link 27 high.
const runs = css({
  display: 'flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: '8',
  textStyle: 'small',
  color: 'fg.muted',
})

const columns = ['[1]', '[2]', '[3]', '[4]', '[5]', '[6]', '[7]'] as const
const column = {
  '[1]': css({ gridColumn: '[1]' }),
  '[2]': css({ gridColumn: '[2]' }),
  '[3]': css({ gridColumn: '[3]' }),
  '[4]': css({ gridColumn: '[4]' }),
  '[5]': css({ gridColumn: '[5]' }),
  '[6]': css({ gridColumn: '[6]' }),
  '[7]': css({ gridColumn: '[7]' }),
}
// A card's row (3, 5, 7) and the arrow rows under it (4, 6); `4 / 7` is an arrow past an empty row.
const rows: Readonly<Record<string, string>> = {
  '3': css({ gridRow: '[3]' }),
  '5': css({ gridRow: '[5]' }),
  '7': css({ gridRow: '[7]' }),
  '4/5': css({ gridRow: '[4 / 5]' }),
  '6/7': css({ gridRow: '[6 / 7]' }),
  '4/7': css({ gridRow: '[4 / 7]' }),
}
const laneColumn = (i: number) => column[columns[2 * i] ?? '[1]']
const gapColumn = (i: number) => column[columns[2 * i - 1] ?? '[2]']

export type ToolkitWorkflowFlowProps = {
  flow: Flow
  /** Opens the steps on a page of their own (D13). */
  onOpenFullPage?: (() => void) | undefined
  /** Opens an agent the workflow runs, by its path. */
  onOpenItem?: ((path: string) => void) | undefined
}

export function ToolkitWorkflowFlow({ flow, onOpenFullPage, onOpenItem }: ToolkitWorkflowFlowProps) {
  return (
    <section aria-label={flow.label} className={section} data-figma="kind section · workflow">
      <div className={header} data-figma="steps header">
        <h3 className={heading}>{flow.label}</h3>
        <span className={open}>
          <Button
            variant="secondary"
            size="sm"
            textSize="sm"
            data-figma="button · Open full page"
            onClick={onOpenFullPage}
          >
            <ExternalLinkIcon />
            Open full page
          </Button>
        </span>
      </div>
      <div className={box} data-figma="flow · by phase">
        <span className={laneTop} />
        {flow.phases.map((phase, i) => (
          <Fragment key={phase.label}>
            <div className={cx(lane, laneColumn(i))} />
            <h4 className={cx(laneLabel, laneColumn(i))}>{phase.label}</h4>
            {(phase.from ?? []).map((row, n) => (
              <span key={row} className={cx(arrow, across, gapColumn(i), rows[String(3 + 2 * row)])}>
                {n === 0 && phase.fromLabel !== undefined ? (
                  <span>
                    {phase.fromLabel}
                    <span className={srOnly}>
                      {`, to ${phase.steps.find((step) => step.row === row)?.title ?? phase.label}`}
                    </span>
                  </span>
                ) : null}
                <span aria-hidden="true" className={acrossIcon}>
                  <ArrowRightIcon size="12" />
                </span>
              </span>
            ))}
            {phase.steps.map((step, s) => {
              const next = phase.steps[s + 1]
              return (
                <Fragment key={step.title}>
                  <ToolkitFlowStep
                    step={step}
                    className={cx(cardSides, laneColumn(i), rows[String(3 + 2 * step.row)])}
                  />
                  {next === undefined || phase.parallel === true ? null : (
                    <span
                      className={cx(
                        arrow,
                        down,
                        laneColumn(i),
                        rows[`${String(4 + 2 * step.row)}/${String(3 + 2 * next.row)}`],
                      )}
                    >
                      {step.down === undefined ? null : (
                        <span>
                          {step.down}
                          <span className={srOnly}>{`, to ${next.title}`}</span>
                        </span>
                      )}
                      <ArrowDownIcon size="12" aria-hidden="true" />
                    </span>
                  )}
                </Fragment>
              )
            })}
          </Fragment>
        ))}
        <div className={loopRow}>
          {flow.loop === undefined ? null : (
            <span data-figma="label · new failure">
              <Badge variant="tag" tone="needsYou" label={flow.loop} />
            </span>
          )}
        </div>
      </div>
      <p className={runs} data-figma="runs">
        {flow.agents.label}
        {flow.agents.items.map((agent) => (
          <Button
            key={agent.path}
            variant="secondary"
            size="sm"
            data-figma={`link · ${agent.name}`}
            onClick={() => {
              onOpenItem?.(agent.path)
            }}
          >
            <AgentIcon />
            {agent.name}
          </Button>
        ))}
        {flow.note === undefined ? null : <span>{flow.note}</span>}
      </p>
    </section>
  )
}
