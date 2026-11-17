// The Overview tab of an open item (D3, under `item tabs` 464:408): the
// description in full; for a rule, when it loads (D4 `when it loads`); then
// two columns: the item's main file rendered read-only (`ToolkitFilePreview`)
// and, beside it, what uses the item, its files and the link to its evals
// (`ToolkitItemSide`). An agent (D7) shows how it runs (`ToolkitAgentRuns`)
// between the description and the columns. Props only.
import { ClockIcon, Panel } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitItemDetailView } from '../types.ts'
import { ToolkitAgentRuns } from './ToolkitAgentRuns.tsx'
import { ToolkitFilePreview } from './ToolkitFilePreview.tsx'
import { ToolkitItemSide } from './ToolkitItemSide.tsx'

// D3: the description (427:271) is 16 under the tabs and 16 over the columns (427:272); in D4 the box that says
// when the rule loads (427:628) sits between them, 16 from each, and in D7 how the agent runs (433:526).
const overview = css({ display: 'flex', flexDirection: 'column', gap: '16' })
const description = css({ textStyle: 'body', color: 'fg.muted' })
// D4 427:628: a box with the needs-you border and tint, as wide as its line: the clock icon, "Loads when" in the
// needs-you colour and the condition in mono, 10 apart. The Panel pads it 12 above and below, where Figma has 10
// (LIBRARY_GAPS.md, Rule load box).
const loadsBox = css({ alignSelf: 'flex-start' })
const loadsLine = css({ display: 'flex', alignItems: 'center', gap: '10', whiteSpace: 'nowrap' })
const loadsLabel = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10',
  textStyle: 'label',
  color: 'status.needsYou.fg',
})
const loadsWhen = css({ textStyle: 'mono', color: 'fg.default' })
// Item-specific Figma keys: the description is a text layer named after its first 40 characters, so the node id
// names it in each frame (D3 427:271, D4 427:627, D7 433:525).
const descriptionLayers: Readonly<Record<string, string>> = {
  'skills/writer/': '427:271',
  'rules/skills.md': '427:627',
  'agents/writing-reviewer.md': '433:525',
}
// D3 427:272: the preview (560) and the side (364) are 24 apart. No size token has either width, so the columns
// share the row 3 to 2 (LIBRARY_GAPS.md, Item overview columns).
const columns = css({ display: 'grid', gridTemplateColumns: '[3fr 2fr]', columnGap: '24', alignItems: 'start' })

export type ToolkitItemOverviewProps = {
  detail: ToolkitItemDetailView
  onTabChange?: ((tab: string) => void) | undefined
}

export function ToolkitItemOverview({ detail, onTabChange }: ToolkitItemOverviewProps) {
  const side = detail.usedIn !== undefined || detail.files !== undefined || detail.evals !== undefined
  return (
    <div className={overview}>
      <p className={description} data-figma={descriptionLayers[detail.path]}>
        {detail.description}
      </p>
      {detail.loads === undefined ? null : (
        <div className={loadsBox} data-figma="when it loads">
          <Panel tone="needsYou">
            <p className={loadsLine}>
              <span className={loadsLabel}>
                <ClockIcon size="16" />
                {detail.loads.label}
              </span>
              <span className={loadsWhen}>{detail.loads.when}</span>
            </p>
          </Panel>
        </div>
      )}
      {detail.runs === undefined ? null : <ToolkitAgentRuns runs={detail.runs} />}
      <div className={columns} data-figma="columns">
        <ToolkitFilePreview file={detail.preview.file} meta={detail.preview.meta} blocks={detail.preview.blocks} />
        {side ? <ToolkitItemSide detail={detail} onTabChange={onTabChange} /> : null}
      </div>
    </div>
  )
}
