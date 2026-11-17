// The Overview tab of an open item (D3, under `item tabs` 464:408): the
// description in full; for a rule, when it loads (D4 `when it loads`); then
// two columns: the item's main file rendered read-only (`ToolkitFilePreview`)
// and, beside it, what uses the item, its files and the link to its evals
// (`ToolkitItemSide`). An agent (D7) shows how it runs (`ToolkitAgentRuns`)
// between the description and the columns, and a hook (D9) when it runs, with
// its script as code in the preview. A workflow (D8) shows its steps by phase
// (`ToolkitWorkflowFlow`) in the same place. On a tablet (T3) the side comes
// under the file, full width. Props only.
import { ClockIcon, Panel } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitItemDetailView, ToolkitKind } from '../types.ts'
import { ToolkitAgentRuns } from './ToolkitAgentRuns.tsx'
import { ToolkitFilePreview } from './ToolkitFilePreview.tsx'
import { ToolkitItemSide } from './ToolkitItemSide.tsx'
import { ToolkitWorkflowFlow } from './ToolkitWorkflowFlow.tsx'

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
  'hooks/commit-msg': '433:1537',
  'workflows/skill-eval-round.md': '433:1033',
}
// T3: the description of writer on a tablet (487:78).
const pageDescriptionLayers: Readonly<Record<string, string>> = { 'skills/writer/': '487:78' }
// D3 427:272: the preview (560) and the side (364) are 24 apart. No size token has either width, so the columns
// share the row 3 to 2 (LIBRARY_GAPS.md, Item overview columns).
const columns = css({ display: 'grid', gridTemplateColumns: '[3fr 2fr]', columnGap: '24', alignItems: 'start' })
// T3 487:79: on a tablet the columns hold only the file, full width; the side (487:98) is 16 under it, full width.
const oneColumn = css({ display: 'flex', flexDirection: 'column' })

export type ToolkitItemOverviewProps = {
  detail: ToolkitItemDetailView
  /** The open item's kind: a hook's facts are drawn as D9 draws them. */
  kind?: ToolkitKind | undefined
  /** The desktop puts the side beside the file; a tablet or phone under it. */
  layout?: Viewport | undefined
  onTabChange?: ((tab: string) => void) | undefined
  /** Opens a workflow's steps on a page of their own (D8 Open full page, D13). */
  onOpenFullPage?: (() => void) | undefined
  /** Opens another toolkit item, such as an agent a workflow runs, by its path. */
  onOpenItem?: ((path: string) => void) | undefined
}

export function ToolkitItemOverview({
  detail,
  kind,
  layout = 'desktop',
  onTabChange,
  onOpenFullPage,
  onOpenItem,
}: ToolkitItemOverviewProps) {
  const side = detail.usedIn !== undefined || detail.files !== undefined || detail.evals !== undefined
  const desktop = layout === 'desktop'
  const sideColumn = side ? <ToolkitItemSide detail={detail} onTabChange={onTabChange} /> : null
  return (
    <div className={overview}>
      <p className={description} data-figma={(desktop ? descriptionLayers : pageDescriptionLayers)[detail.path]}>
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
      {detail.runs === undefined ? null : (
        <ToolkitAgentRuns runs={detail.runs} kind={kind === 'hook' ? 'hook' : 'agent'} />
      )}
      {detail.flow === undefined ? null : (
        <ToolkitWorkflowFlow flow={detail.flow} onOpenFullPage={onOpenFullPage} onOpenItem={onOpenItem} />
      )}
      <div className={desktop ? columns : oneColumn} data-figma="columns">
        <ToolkitFilePreview
          file={detail.preview.file}
          meta={detail.preview.meta}
          blocks={detail.preview.blocks}
          code={detail.preview.code}
        />
        {desktop ? sideColumn : null}
      </div>
      {desktop ? null : sideColumn}
    </div>
  )
}
