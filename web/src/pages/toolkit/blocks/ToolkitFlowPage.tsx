// The How it works tab of a workflow on a page of its own (D13 446:153, under
// the item tabs): the description, the flow (`ToolkitFlowSteps`) and the row
// of the selected step, the gates and the rounds (`ToolkitFlowDetails`),
// 14 apart in Figma (12). On a tablet or phone (T8) the flow is the column of
// `ToolkitFlowColumn` and the rows are 12 apart. A click on a step selects it
// (`onSelectStep`). Props only.
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { type FlowPage, selectedStep } from './flowLayout.ts'
import { ToolkitFlowColumn } from './ToolkitFlowColumn.tsx'
import { ToolkitFlowDetails } from './ToolkitFlowDetails.tsx'
import { ToolkitFlowSteps } from './ToolkitFlowSteps.tsx'

// D13: the description starts 14 under the tabs (the tabs' panel puts it 12 under them), and the rows are 14 apart
// (16: the flow's panel is 390 high against Figma's 393, so 16 under it keeps the details row at Figma's 716).
const page = css({ display: 'flex', flexDirection: 'column', gap: '16' })
// T8 448:215: the description 12 under the tabs (244 to 256), the steps 12 under it and the details 12 under them.
const narrowPage = css({ display: 'flex', flexDirection: 'column', gap: '12' })
// D13 446:514: the description in the body style, muted, in two lines 1100 wide. No size token has 1100, so it runs
// the page's width on one line (LIBRARY_GAPS.md, Workflow page description); 20 under it keeps its box Figma's 40 high,
// and 2 less after it puts the flow 14 under it, at Figma's 309.
const description = css({ textStyle: 'body', color: 'fg.muted', pb: '20', mb: '-2' })
// T8 448:215: the description in small text, muted, wrapping in the item's width.
const narrowDescription = css({ textStyle: 'small', color: 'fg.muted' })

export type ToolkitFlowPageProps = {
  flow: FlowPage
  description: string
  /** The description's Figma key: its node id (D13 446:514, T8 448:215). */
  descriptionLayer?: string | undefined
  /** The id of the selected step (`ui.flowStep`); its first step with fields when not set. */
  selected?: string | undefined
  onSelectStep?: ((id: string) => void) | undefined
  layout?: Viewport | undefined
}

export function ToolkitFlowPage({
  flow,
  description: text,
  descriptionLayer,
  selected,
  onSelectStep,
  layout = 'desktop',
}: ToolkitFlowPageProps) {
  const step = selectedStep(flow, selected)
  const desktop = layout === 'desktop'
  return (
    <div className={desktop ? page : narrowPage}>
      <p className={desktop ? description : narrowDescription} data-figma={descriptionLayer}>
        {text}
      </p>
      {desktop ? (
        <ToolkitFlowSteps page={flow} selected={step?.id} onSelect={onSelectStep} />
      ) : (
        <ToolkitFlowColumn page={flow} selected={step?.id} onSelect={onSelectStep} />
      )}
      <ToolkitFlowDetails page={flow} step={step} layout={layout} />
    </div>
  )
}
