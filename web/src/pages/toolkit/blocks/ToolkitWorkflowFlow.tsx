// A workflow's steps by phase (Figma `kind section · workflow`, D8
// 433:1034): the section's label and Open full page over a bordered box with
// one lane for each phase, left to right, each with its label over it and
// its step cards (`ToolkitFlowStep`) in rows, all one size. An arrow joins
// the steps of a phase that run one after another, and an arrow comes into
// a phase from the one before it, at the rows the state names; the loop
// back to the start is its label under the lanes. Under the box: the agents
// the workflow runs, each a button that opens it, and a note. Each arrow is
// the library's `FlowLine`, from one card's edge to the next, its tip 2
// before the card; the library has no elbow that leaves one step and enters
// two others at their own rows, and its `FlowLoop` points into the side of
// the step it returns to, not up into its foot (LIBRARY_GAPS.md, Workflow
// flow by phase), so an arrow into a phase is a straight line at each row
// it enters, and the loop is its label alone.
// On a tablet (T18 487:768) the box is the same flow drawn smaller
// (`size="sm"`): narrower lanes, smaller cards and text. The phone (M21
// 487:1863) has no room for the flow: the header and the agents' row keep
// one line each and run past the screen's edge, and the line that says where
// the steps are (`flow.elsewhere`) takes the box's place (`steps={false}`).
// Props only.
import { AgentIcon, Badge, Button, ExternalLinkIcon, FlowLine } from '@eshelton328/component-library-1701'
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
// M21 487:1864: on the phone the header is one line, cut at the item's edge (378) as Figma's `toolkit` cuts it, and
// it scrolls sideways to the rest of Open full page. Figma's heading (296 wide) ends at 308 and the button starts at
// 325, after a spacer 8 from each; the render's heading is 7 px narrower, so 24 apart puts the button at Figma's x.
const headerOneLine = css({ display: 'flex', alignItems: 'center', gap: '24', whiteSpace: 'nowrap', overflowX: 'auto' })
const keepWidth = css({ flexShrink: '0' })
// M21 487:2275: the line that says where the steps are, 10 under the agents' row, in the description's style.
const elsewhere = css({ textStyle: 'body', color: 'fg.muted' })
// D8 458:2: 948 × 384, the lane labels 12 under the top and the lanes 14 in from the sides and 12 over the end.
// Four lanes 212 wide and 24 apart: the arrow columns between them are 24 wide (a 12 px icon with 6 each side).
// Rows: the labels, the lanes' 10 px top, three card rows with an arrow row between each, and the loop's row. The
// card rows are equal (1fr), so every card has the size of the tallest.
const boxBase = css.raw({
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
// T18 487:768: 712 × 288, the lane labels 9 under the top, the lanes (487:769, 159 wide, 18 apart) 10.5 in from the
// sides and 9 over the end. The arrow columns are 16 (the 12 px icon with 2 each side), so the lanes are 160.5 wide.
const box = { md: css(boxBase), sm: css(boxBase, { px: '10', pt: '8', pb: '8' }) }
// D8 458:3: a lane is a tinted rounded box under its steps; its label (458:7) is 8 in, 3 over it.
const lane = css({ gridRow: '[2 / 9]', bg: 'surface.raised', borderRadius: 'lg' })
// T18 487:773: the label 6 in, 2 over the lane; the first cards 7.5 under the lane's top (487:777), 6 in from its sides.
const laneLabel = {
  md: css({ gridRow: '[1]', ps: '8', pb: '4', textStyle: 'eyebrow', color: 'fg.muted' }),
  sm: css({ gridRow: '[1]', ps: '6', textStyle: 'eyebrow', color: 'fg.muted' }),
}
const laneTop = {
  md: css({ gridRow: '[2]', gridColumn: '[1]', pt: '10' }),
  sm: css({ gridRow: '[2]', gridColumn: '[1]', pt: '6' }),
}
const cardSides = { md: css({ mx: '8' }), sm: css({ mx: '6' }) }
const arrow = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  color: 'fg.muted',
  textStyle: 'small',
})
// D8 466:2: an arrow across runs from the card's edge over the lane's 8 px side, the 24 px gap and the next lane's
// side, 38 long to 2 before the next card (the label over it, "yes", 458:92). T18: the lanes' sides are 6 and the gap
// 16.
const across = {
  md: css({ alignSelf: 'center', alignItems: 'stretch', w: '[token(spacing.24)]' }),
  sm: css({ alignSelf: 'center', alignItems: 'stretch', w: '[token(spacing.16)]' }),
}
const acrossLine = { md: css({ mx: '-8' }), sm: css({ mx: '-6' }) }
// D8 466:4: a line down between the cards of a lane, 14 long in the 16 between them; T18: 12 between them. A long line
// past an empty row (466:3, "no") fills the rows it spans; out of a gate it is amber, as the gate's way out.
const down = { md: css({ minH: '[token(spacing.16)]' }), sm: css({ minH: '[token(spacing.12)]' }) }
const arrowText = { md: undefined, sm: css({ textStyle: 'smallXs' }) }
// D8 466:11: the loop's label sits on the dashed line, 24 under the last row and centred on the box; the lanes end
// 52 under the last row (458:3 ends at 675).
const loopRowBase = css.raw({
  gridRow: '[8]',
  gridColumn: '[1 / -1]',
  display: 'flex',
  justifyContent: 'center',
  pt: '24',
  pb: '8',
})
// T18 487:858: the label 18 under the last row; the lanes end 3 under it (487:769 ends at 639).
const loopRow = { md: css(loopRowBase), sm: css(loopRowBase, { pt: '16', pb: '2' }) }
// D8 433:1086: as wide as its content (445), the link 27 high.
const runs = css({
  display: 'flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: '8',
  textStyle: 'small',
  color: 'fg.muted',
})

// M21 487:1963: on the phone the agents' row is one line too, as wide as the item: the note (487:1970) is cut at its
// edge and the row scrolls sideways to the rest.
const runsOneLine = css({ alignSelf: 'stretch', whiteSpace: 'nowrap', overflowX: 'auto' })

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
  /** Opens the steps on a page of their own (D13); the button is disabled without it (an item with no page). */
  onOpenFullPage?: (() => void) | undefined
  /** Opens an agent the workflow runs, by its path. */
  onOpenItem?: ((path: string) => void) | undefined
  /** `md` on the desktop (D8); `sm`, the smaller flow, on a tablet (T18). */
  size?: 'md' | 'sm' | undefined
  /** Draws the steps by phase; `false` on the phone (M21), which shows where the steps are instead. */
  steps?: boolean | undefined
}

export function ToolkitWorkflowFlow({
  flow,
  onOpenFullPage,
  onOpenItem,
  size = 'md',
  steps = true,
}: ToolkitWorkflowFlowProps) {
  return (
    <section aria-label={flow.label} className={section} data-figma="kind section · workflow">
      <div className={steps ? header : headerOneLine} data-figma="steps header">
        <h3 className={steps ? heading : cx(heading, keepWidth)}>{flow.label}</h3>
        <span className={steps ? open : keepWidth}>
          <Button
            variant="secondary"
            size="sm"
            textSize="sm"
            data-figma="button · Open full page"
            disabled={onOpenFullPage === undefined}
            onClick={onOpenFullPage}
          >
            <ExternalLinkIcon />
            Open full page
          </Button>
        </span>
      </div>
      {steps ? (
        <div className={box[size]} data-figma="flow · by phase">
          <span className={laneTop[size]} />
          {flow.phases.map((phase, i) => (
            <Fragment key={phase.label}>
              <div className={cx(lane, laneColumn(i))} />
              <h4 className={cx(laneLabel[size], laneColumn(i))}>{phase.label}</h4>
              {(phase.from ?? []).map((row, n) => (
                <span
                  key={row}
                  className={cx(arrow, arrowText[size], across[size], gapColumn(i), rows[String(3 + 2 * row)])}
                >
                  {n === 0 && phase.fromLabel !== undefined ? (
                    <span>
                      {phase.fromLabel}
                      <span className={srOnly}>
                        {`, to ${phase.steps.find((step) => step.row === row)?.title ?? phase.label}`}
                      </span>
                    </span>
                  ) : null}
                  <span className={acrossLine[size]}>
                    <FlowLine />
                  </span>
                </span>
              ))}
              {phase.steps.map((step, s) => {
                const next = phase.steps[s + 1]
                return (
                  <Fragment key={step.title}>
                    <ToolkitFlowStep
                      step={step}
                      size={size}
                      className={cx(cardSides[size], laneColumn(i), rows[String(3 + 2 * step.row)])}
                    />
                    {next === undefined || phase.parallel === true ? null : (
                      <span
                        className={cx(
                          arrow,
                          arrowText[size],
                          down[size],
                          laneColumn(i),
                          rows[`${String(4 + 2 * step.row)}/${String(3 + 2 * next.row)}`],
                        )}
                      >
                        <FlowLine
                          direction="down"
                          tone={step.type === 'gate' ? 'needsYou' : 'default'}
                          label={step.down}
                        />
                        {step.down === undefined ? null : <span className={srOnly}>{`, to ${next.title}`}</span>}
                      </span>
                    )}
                  </Fragment>
                )
              })}
            </Fragment>
          ))}
          <div className={loopRow[size]}>
            {flow.loop === undefined ? null : (
              <span data-figma="label · new failure">
                <Badge variant="tag" tone="needsYou" label={flow.loop} />
              </span>
            )}
          </div>
        </div>
      ) : null}
      <p className={steps ? runs : cx(runs, runsOneLine)} data-figma="runs">
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
      {steps || flow.elsewhere === undefined ? null : (
        <p className={elsewhere} data-figma="487:2275">
          {flow.elsewhere}
        </p>
      )}
    </section>
  )
}
