// What an open run shows under its header (D12 `side panel · run` 445:465):
// the line on the run (445:477), Open the session in Workbench (445:478),
// its values with where each comes from (`fields` 445:482, a row each:
// the label, the value, the source in mono), its steps (`steps` 445:520:
// the time, green for the step running, the tool and what it did)
// and what its result will show. A run with no detail shows its row's line
// and the button. The Workbench has no state that takes a toolkit run, so
// the button is disabled with a title, as Open in Workbench of a discussion
// is. The library has no field table or step timeline (LIBRARY_GAPS.md, Run
// panel), so they are text in its styles. Props only.
import { Button, ExternalLinkIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitRun } from '../types.ts'

/** Why Open the session in Workbench does nothing yet: its title. */
export const sessionWaiting = 'The Workbench cannot open a toolkit run’s session yet'

const root = css({ display: 'flex', flexDirection: 'column', gap: '12', minW: '[0]' })
const text = css({ textStyle: 'small', color: 'fg.muted', m: '0' })
const open = css({ display: 'grid' })
// D12 445:482: a 398 wide box, each field a row 12 in and 8 down: the label, the value and the source 100, 140 and 120 wide (5:7:6).
const fields = css({
  display: 'flex',
  flexDirection: 'column',
  m: '0',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'md',
  bg: 'surface.pane',
})
const field = css({
  display: 'grid',
  gridTemplateColumns: '[5fr 7fr 6fr]',
  columnGap: '10',
  px: '12',
  py: '8',
  '&:not(:first-child)': { borderTopWidth: 'default', borderTopStyle: 'solid', borderTopColor: 'border.default' },
})
const label = css({ textStyle: 'small', color: 'fg.muted', m: '0' })
const value = css({ textStyle: 'small', color: 'fg.default', m: '0' })
const source = css({ textStyle: 'mono', color: 'fg.muted', m: '0' })
const heading = css({ textStyle: 'monoCaps', color: 'fg.muted', m: '0' })
// D12 445:521: the steps 50 apart: the time, then the text.
const steps = css({ display: 'flex', flexDirection: 'column', gap: '12', listStyle: 'none', m: '0', p: '0' })
const step = css({ display: 'flex', alignItems: 'flex-start', gap: '10' })
const time = css({ textStyle: 'mono', color: 'fg.muted', fontVariantNumeric: 'tabular-nums', flexShrink: '0' })
// D12 445:546: the step running has a green dot; the library has no step dot (LIBRARY_GAPS.md, Run panel), so its
// time is green instead.
const timeNow = css({ textStyle: 'mono', color: 'status.done.fg', fontVariantNumeric: 'tabular-nums', flexShrink: '0' })
const stepText = css({ display: 'flex', flexDirection: 'column', minW: '[0]' })
const name = css({ textStyle: 'label', color: 'fg.default' })

export type ToolkitRunDetailProps = {
  run: ToolkitRun
  /** The button's label, such as "Open the session in Workbench". */
  openSession: string
}

export function ToolkitRunDetail({ run, openSession }: ToolkitRunDetailProps) {
  const detail = run.detail
  return (
    <div className={root}>
      <p className={text}>{detail?.summary ?? run.meta}</p>
      <div className={open}>
        <Button
          variant="primary"
          size="lg"
          aria-disabled="true"
          title={sessionWaiting}
          data-figma={detail?.layers?.openSession}
        >
          <ExternalLinkIcon size="16" />
          {openSession}
        </Button>
      </div>
      {detail === undefined ? null : (
        <>
          <dl className={fields} data-figma="fields">
            {detail.fields.map((f) => (
              <div key={f.label} className={field} data-figma={`field · ${f.label}`}>
                <dt className={label}>{f.label}</dt>
                <dd className={value}>{f.value}</dd>
                <dd className={source}>{f.source}</dd>
              </div>
            ))}
          </dl>
          <h3 className={heading}>{detail.stepsLabel}</h3>
          <ol className={steps} data-figma="steps">
            {detail.steps.map((s) => (
              <li key={s.time} className={step} data-figma={`step · ${s.time}`}>
                <span className={s.now === true ? timeNow : time}>{s.time}</span>
                <span className={stepText}>
                  <span className={name}>{s.name}</span>
                  <span className={text}>{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <h3 className={heading}>{detail.resultLabel}</h3>
          <p className={text}>{detail.result}</p>
        </>
      )}
    </div>
  )
}
