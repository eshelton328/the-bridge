// The row under a workflow's flow on its own page (Figma `row · details`, D13
// 446:620): three panels of one height. The selected step's panel (446:621)
// has the cyan border, its heading in cyan and the hint at the end, then each
// field of the step: what it runs (in mono), its agent, input, output, model,
// what runs beside it and what happens when it fails. The gates' panel
// (446:647) gives each gate's place in amber and what it checks. The rounds'
// panel (446:658) lists the rounds in the ledgers, each a bordered row with
// its date at the end, and a note on cost and live status. On a tablet or
// phone the panels stand one under another. The library has no field list or
// round row (LIBRARY_GAPS.md, Workflow page details): the fields are a grid of
// small text and the rows a bordered line drawn with the card tokens. Props
// only.
import { Panel } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { type FlowPage, type FlowPageStep, stepHeading } from './flowLayout.ts'

// D13 446:620: three columns 16 apart, each panel as high as the row (242).
const row = {
  desktop: css({ display: 'grid', gridTemplateColumns: '[repeat(3, 1fr)]', gap: '16' }),
  narrow: css({ display: 'flex', flexDirection: 'column', gap: '12' }),
}
const fill = css({ display: 'flex', flexDirection: 'column', '& > section': { flex: '1' } })
// D13 446:622: the header 15 under the panel's top (the Panel's 12, 2 more and the border), the rows under it 10 apart.
const body = css({ display: 'flex', flexDirection: 'column', gap: '10', pt: '2' })
const header = css({ display: 'flex', alignItems: 'center', gap: '8' })
const heading = css({ textStyle: 'monoCaps', color: 'fg.muted' })
const accent = css({ color: 'fg.accent' })
const meta = css({ ms: 'auto', textStyle: 'small', color: 'fg.muted' })
// D13 446:626: each field a row, the label in an 80 px column and the value 10 after it; no size token has 80, so the
// column is as wide as the longest label and the value 40 after it, at Figma's x (LIBRARY_GAPS.md, Workflow page details).
// The rows are 27 apart in Figma (17 high, 10 apart) and 26 here (small is 16 high): 4 more above the first keeps every
// row within 3 px.
const fields = css({
  display: 'grid',
  gridTemplateColumns: '[auto 1fr]',
  columnGap: '40',
  rowGap: '10',
  m: '0',
  mt: '4',
})
const fieldLabel = css({ textStyle: 'small', color: 'fg.muted' })
// D13 446:628: a command's value is in mono; css() merges the two, so mono wins over small.
const fieldValueRaw = css.raw({ m: '0', textStyle: 'small', color: 'fg.default' })
const fieldValue = css(fieldValueRaw)
const fieldMono = css(fieldValueRaw, { textStyle: 'mono' })
// Each field is a row of the list's grid (subgrid), so the labels share one column and the row has a box to measure.
const field = css({ display: 'grid', gridTemplateColumns: 'subgrid', gridColumn: '[1 / -1]' })
// D13 446:649: each gate its place (label, amber) and its text 3 under it; the gates 10 apart.
const gate = css({ display: 'flex', flexDirection: 'column', gap: '4' })
const gateTitle = css({ textStyle: 'label', color: 'status.needsYou.fg' })
const text = css({ textStyle: 'small', color: 'fg.muted' })
const gateText = css({ textStyle: 'small', color: 'fg.default' })
// D13 446:663: the rounds 8 apart, each 31 high: the name 11 in and 7 down, the date at the end, in mono.
const rounds = css({ display: 'flex', flexDirection: 'column', gap: '8', listStyle: 'none', m: '0', p: '0' })
const round = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8',
  px: '10',
  py: '6',
  bg: 'surface.raised',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'md',
  textStyle: 'small',
  color: 'fg.default',
})
const date = css({ ms: 'auto', textStyle: 'mono', color: 'fg.muted' })

export type ToolkitFlowDetailsProps = {
  page: FlowPage
  /** The selected step; the panel shows only its hint when none is selected. */
  step: FlowPageStep | null
  layout?: Viewport | undefined
}

export function ToolkitFlowDetails({ page, step, layout = 'desktop' }: ToolkitFlowDetailsProps) {
  return (
    <div className={layout === 'desktop' ? row.desktop : row.narrow} data-figma="row · details">
      <div className={fill} data-figma={step === null ? undefined : `panel · step ${step.mark}`}>
        <Panel tone="accent">
          <div className={body}>
            <div className={header}>
              {step === null ? null : <h3 className={cx(heading, accent)}>{stepHeading(step)}</h3>}
              <span className={meta}>{page.hint}</span>
            </div>
            {step?.fields === undefined ? null : (
              <dl className={fields}>
                {step.fields.map((f) => (
                  <div key={f.label} className={field} data-figma={`field · ${f.label}`}>
                    <dt className={fieldLabel}>{f.label}</dt>
                    <dd className={f.mono === true ? fieldMono : fieldValue}>{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </Panel>
      </div>
      <div className={fill} data-figma="panel · gates">
        <Panel>
          <div className={body}>
            <h3 className={heading}>{page.gates.label}</h3>
            {page.gates.items.map((g) => (
              <div key={g.title} className={gate} data-figma={`gate · ${g.title}`}>
                <h4 className={gateTitle}>{g.title}</h4>
                <p className={gateText}>{g.text}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className={fill} data-figma="panel · runs">
        <Panel>
          <div className={body}>
            <div className={header}>
              <h3 className={heading}>{page.rounds.label}</h3>
              <span className={meta}>{page.rounds.source}</span>
            </div>
            <ul className={rounds}>
              {page.rounds.items.map((r) => (
                <li key={r.name} className={round} data-figma={`round · ${r.name}`}>
                  {r.name}
                  <span className={date}>{r.date}</span>
                </li>
              ))}
            </ul>
            {page.rounds.note === undefined ? null : <p className={text}>{page.rounds.note}</p>}
          </div>
        </Panel>
      </div>
    </div>
  )
}
