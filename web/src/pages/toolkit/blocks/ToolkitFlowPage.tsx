// The How it works tab of a workflow on a page of its own (D13 446:153, under
// the item tabs): the description, the flow (`ToolkitFlowSteps`) and the row
// of the selected step, the gates and the rounds (`ToolkitFlowDetails`),
// 14 apart in Figma (12). A click on a step selects it (`onSelectStep`).
// Props only.
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { type FlowPage, selectedStep } from './flowLayout.ts'
import { ToolkitFlowDetails } from './ToolkitFlowDetails.tsx'
import { ToolkitFlowSteps } from './ToolkitFlowSteps.tsx'

// D13: the description starts 14 under the tabs (the tabs' panel puts it 4 higher, so 4 more), and the rows are 14
// apart (16).
const page = css({ display: 'flex', flexDirection: 'column', gap: '16', pt: '4' })
// D13 446:514: the description in the body style, muted, in two lines 1100 wide. No size token has 1100, so it runs
// the page's width on one line (LIBRARY_GAPS.md, Workflow page description); 20 under it keeps the flow at Figma's y.
const description = css({ textStyle: 'body', color: 'fg.muted', pb: '20' })

export type ToolkitFlowPageProps = {
  flow: FlowPage
  description: string
  /** The id of the selected step (`ui.flowStep`); its first step with fields when not set. */
  selected?: string | undefined
  onSelectStep?: ((id: string) => void) | undefined
  layout?: Viewport | undefined
}

export function ToolkitFlowPage({ flow, description: text, selected, onSelectStep, layout }: ToolkitFlowPageProps) {
  const step = selectedStep(flow, selected)
  return (
    <div className={page}>
      <p className={description} data-figma="446:514">
        {text}
      </p>
      <ToolkitFlowSteps page={flow} selected={step?.id} onSelect={onSelectStep} layout={layout} />
      <ToolkitFlowDetails page={flow} step={step} layout={layout} />
    </div>
  )
}
