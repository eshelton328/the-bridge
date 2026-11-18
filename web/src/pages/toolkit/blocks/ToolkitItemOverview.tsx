// The Overview tab of an open item (D3, under `item tabs` 464:408): the
// description in full; for a rule, when it loads (D4 `when it loads`); then
// two columns: the item's main file rendered read-only (`ToolkitFilePreview`)
// and, beside it, what uses the item, its files and the link to its evals
// (`ToolkitItemSide`). An agent (D7) shows how it runs (`ToolkitAgentRuns`)
// between the description and the columns, and a hook (D9) when it runs, with
// its script as code in the preview. A workflow (D8) shows its steps by phase
// (`ToolkitWorkflowFlow`) in the same place; on the phone (M21) only its
// header, its agents and where the steps are. On a tablet or phone (T3, M2) the
// side comes under the file, full width. Props only.
import { ClockIcon, Panel } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitItemDetailView, ToolkitKind } from '../types.ts'
import { ToolkitAgentRuns } from './ToolkitAgentRuns.tsx'
import { ToolkitFilePreview } from './ToolkitFilePreview.tsx'
import { ToolkitItemSide } from './ToolkitItemSide.tsx'
import { ToolkitWorkflowFlow } from './ToolkitWorkflowFlow.tsx'

// D3: the description (427:271) is 16 under the tabs and 16 over the columns (427:272); in D4 the box that says
// when the rule loads (427:628) sits between them, 16 from each, and in D7 how the agent runs (433:526).
const overview = css({ display: 'flex', flexDirection: 'column', gap: '16' })
// M2: on the phone the description (487:142) is 12 over the columns (487:143), and the side (487:162) 16 under the
// file preview, which ends 1 px under the columns' foot; 12 apart keeps each within 3 px of Figma's.
const phoneOverview = css({ display: 'flex', flexDirection: 'column', gap: '12' })
// T17: a rule on a tablet has its description (487:501), the load box (487:502) and the file (487:508) 14 apart; no
// space token has 14, and the Panel pads the box 12 where Figma has 10, so it is 4 px taller. 12 apart keeps each row
// within 2 px of Figma's (LIBRARY_GAPS.md, Tablet item spacing).
const ruleTabletOverview = css({ display: 'flex', flexDirection: 'column', gap: '12' })
// T19: a hook on a tablet has its description (487:1126), when it runs (487:1127) and the code (487:1164) 14 apart too,
// so they are 12 apart as T17's. The files (487:1207) are 16 under the code box, which CodeLines draws 6 px shorter
// than Figma's (LIBRARY_GAPS.md, File preview): 24 under it (12 more than the rows' 12) keeps them within 1 px.
const sideAfterCode = css({ pt: '12' })
// M19: a rule on the phone has its description (487:1403), the load box (487:1404) and the file (487:1410) 12 apart.
// The tabs' list is 32 high, as Figma's, with 4 above the panel (ToolkitItem), and the Panel makes the box 58 high
// (Figma 56), so at 12 apart the file runs 5 px low and its last line (487:1427, which Figma ends 1 px over the tab
// bar) goes under the tab bar. 8 apart keeps each row within 3 px of Figma's and that line in view (LIBRARY_GAPS.md,
// Rule load box).
// M22: a hook on the phone has its description (487:2182), when it runs (487:2183) and the code (487:2219) 12 apart
// too; with the 4 above the panel and the cards 1 to 2 px taller than Figma's 109 (LIBRARY_GAPS.md, Agent fact card), 12
// apart runs the code 5 px low, and 8 apart keeps each row within 3 px of Figma's.
const rulePhoneOverview = css({ display: 'flex', flexDirection: 'column', gap: '8' })
const description = css({ textStyle: 'body', color: 'fg.muted' })
// D4 427:628: a box with the needs-you border and tint, as wide as its line: the clock icon, "Loads when" in the
// needs-you colour and the condition in mono, 10 apart. The Panel pads it 12 above and below, where Figma has 10
// (LIBRARY_GAPS.md, Rule load box).
const loadsBox = css({ alignSelf: 'flex-start' })
// T17 487:502: on a tablet the box spans the page (712 wide); on the phone (M19 487:1404) too.
const loadsBoxPage = css({ alignSelf: 'stretch' })
const loadsLine = css({ display: 'flex', alignItems: 'center', gap: '10', whiteSpace: 'nowrap' })
// M19 487:1404: on the phone the box spans the item too, and the condition (487:1409) wraps onto two lines beside
// the label, which keeps to one.
const loadsLinePhone = css({ display: 'flex', alignItems: 'center', gap: '10' })
const loadsLabelPhone = css({ flexShrink: '0', whiteSpace: 'nowrap' })
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
// T3: the description of writer on a tablet (487:78); T18: skill-eval-round's (487:759); T17: the rule skills's
// (487:501); T19: the hook commit-msg's (487:1126).
const pageDescriptionLayers: Readonly<Record<string, string>> = {
  'skills/writer/': '487:78',
  'workflows/skill-eval-round.md': '487:759',
  'rules/skills.md': '487:501',
  'hooks/commit-msg': '487:1126',
}
// M2: the description of writer on the phone (487:142); M20: writing-reviewer's (487:1613); M21: skill-eval-round's
// (487:1862); M19: the rule skills's (487:1403); M22: the hook commit-msg's (487:2182).
const phoneDescriptionLayers: Readonly<Record<string, string>> = {
  'skills/writer/': '487:142',
  'agents/writing-reviewer.md': '487:1613',
  'workflows/skill-eval-round.md': '487:1862',
  'rules/skills.md': '487:1403',
  'hooks/commit-msg': '487:2182',
}
const descriptionLayersOf = {
  desktop: descriptionLayers,
  tablet: pageDescriptionLayers,
  phone: phoneDescriptionLayers,
}
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
  const phone = layout === 'phone'
  // M22 487:2185: a hook's four When it runs cards sit two by two on the phone, each 178 wide.
  const hookPhone = phone && kind === 'hook'
  const sideColumn = side ? (
    <ToolkitItemSide detail={detail} onTabChange={onTabChange} compact={layout === 'phone'} />
  ) : null
  return (
    <div
      className={
        phone
          ? detail.loads === undefined && kind !== 'hook'
            ? phoneOverview
            : rulePhoneOverview
          : layout === 'tablet' && (detail.loads !== undefined || kind === 'hook')
            ? ruleTabletOverview
            : overview
      }
    >
      <p className={description} data-figma={descriptionLayersOf[layout][detail.path]}>
        {detail.description}
      </p>
      {detail.loads === undefined ? null : (
        <div className={desktop ? loadsBox : loadsBoxPage} data-figma="when it loads">
          <Panel tone="needsYou">
            <p className={phone ? loadsLinePhone : loadsLine}>
              <span className={phone ? cx(loadsLabel, loadsLabelPhone) : loadsLabel}>
                <ClockIcon size="16" />
                {detail.loads.label}
              </span>
              <span className={loadsWhen}>{detail.loads.when}</span>
            </p>
          </Panel>
        </div>
      )}
      {detail.runs === undefined ? null : (
        <ToolkitAgentRuns
          runs={detail.runs}
          kind={kind === 'hook' ? 'hook' : 'agent'}
          compact={(layout === 'tablet' && kind === 'hook') || hookPhone}
          columns={phone ? '2' : '4'}
        />
      )}
      {detail.flow === undefined ? null : (
        <ToolkitWorkflowFlow
          flow={detail.flow}
          size={desktop ? 'md' : 'sm'}
          steps={layout !== 'phone'}
          onOpenFullPage={onOpenFullPage}
          onOpenItem={onOpenItem}
        />
      )}
      <div className={desktop ? columns : oneColumn} data-figma="columns">
        <ToolkitFilePreview
          file={detail.preview.file}
          meta={detail.preview.meta}
          blocks={detail.preview.blocks}
          code={detail.preview.code}
          wrapRefs={layout === 'phone'}
        />
        {desktop ? sideColumn : null}
      </div>
      {desktop ? null : layout === 'tablet' && kind === 'hook' && sideColumn !== null ? (
        <div className={sideAfterCode}>{sideColumn}</div>
      ) : (
        sideColumn
      )}
    </div>
  )
}
