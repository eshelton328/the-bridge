// An open toolkit item (Figma `toolkit item`, D3 427:250): the detail pane
// beside the list. The meta row (the kind badge, Discuss and Show on map),
// the name, the path badge that copies the path and when the item changed,
// then the item's tabs; the Overview tab (`ToolkitItemOverview`) shows the
// description, the main file rendered read-only, what uses the item, its
// files and its evals. On a tablet or phone (T3) the item replaces the list
// in the shared DetailFrame (d-107): the back row to Toolkit, with Discuss and
// Show on map at its end, stays at the top, and only the item under it
// scrolls. On the phone (M2) the actions are icon buttons and when the item
// changed sits beside the kind badge. Nothing edits the item (R35). Props
// only.
import {
  AgentIcon,
  BackRow,
  HookIcon,
  ItemTabs,
  KindBadge,
  RuleIcon,
  SkillIcon,
  WorkflowIcon,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { DetailFrame } from '../../../blocks/DetailFrame.tsx'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitOpenItem } from '../types.ts'
import { ToolkitItemActions } from './ToolkitItemActions.tsx'
import { ToolkitItemChanged } from './ToolkitItemChanged.tsx'
import { ToolkitItemOverview } from './ToolkitItemOverview.tsx'
import { ToolkitItemPath } from './ToolkitItemPath.tsx'

// D3 427:250: the content starts 40 in from the pane's edges and 28 down (no space token has 28: 24); the meta row, the name, the path row and
// the tabs are 16 apart (427:251 ends at 64, writer 427:270 starts at 80, path row 457:45 at 137, tabs 464:408 at 178).
// The pane fills the frame's height; 24 under the content keeps D8's item (its content ends 42 over the frame's foot,
// 940, and the rendered file is 17 px taller than Figma's) inside the frame, with no scroll.
const pane = css({ display: 'flex', flexDirection: 'column', flexGrow: '1', gap: '16', px: '40', pt: '24', pb: '24' })
// T3 428:542: the DetailFrame's Container pads the item at the sides and the foot. The back row (428:543) ends at 77
// and the meta row (428:561) starts at 91, and the rows under it are 14 apart; no space token has 14. The BackRow is
// 32 high against Figma's 36, so 20 above the meta row and 12 between the rows keep each row within 3 px of Figma's
// (the tabs' panel adds 16 above the description, Figma's 14).
const page = css({ display: 'flex', flexDirection: 'column', gap: '12', pt: '20' })
// M2 429:284: on the phone the meta row (429:297) starts 12 under the back row (429:285), and the rows are 12 apart.
const phonePage = css({ display: 'flex', flexDirection: 'column', gap: '12', pt: '12' })
// D3 427:251: the kind badge at the start, the two buttons at the end. The row is 40 high (4 above and below its
// 32 px buttons), so with the pane's 24 the buttons start at Figma's 28.
const metaRow = css({ display: 'flex', alignItems: 'center', gap: '10', py: '4' })
// T3 428:561: on a tablet the meta row holds only the kind badge, and is as wide as it.
const metaRowPage = css({ display: 'flex', alignItems: 'center', alignSelf: 'flex-start' })
// M2 429:297: on the phone the meta row holds the kind badge and, 8 after it, when the item changed.
const metaRowPhone = css({ display: 'flex', alignItems: 'center', alignSelf: 'flex-start', gap: '8' })
const title = css({ alignSelf: 'flex-start', textStyle: 'heading', color: 'fg.default' })

// The item's title is a text layer named after the item, and a list row has the same name, so its Figma key is the
// node id of the frame that shows the item: writer in D3 (427:270), the rule skills in D4 (427:626), the agent
// writing-reviewer in D7 (433:524), the hook commit-msg in D9 (433:1536), the workflow skill-eval-round in D8 (433:1032).
const titleLayers: Readonly<Record<string, string>> = {
  'skills/writer/': '427:270',
  'rules/skills.md': '427:626',
  'agents/writing-reviewer.md': '433:524',
  'hooks/commit-msg': '433:1536',
  'workflows/skill-eval-round.md': '433:1032',
}
// On a tablet the SKILL.md title has the same text, so the node id again: writer in T3 (428:567).
const pageTitleLayers: Readonly<Record<string, string>> = { 'skills/writer/': '428:567' }
// On the phone: writer in M2 (429:303).
const phoneTitleLayers: Readonly<Record<string, string>> = { 'skills/writer/': '429:303' }
const titleLayersOf = { desktop: titleLayers, tablet: pageTitleLayers, phone: phoneTitleLayers }
// The item's Figma frame: `toolkit item` on the desktop and a tablet (427:250, 428:542), `toolkit` on the phone (429:284).
const itemLayer = { desktop: 'toolkit item', tablet: 'toolkit item', phone: 'toolkit' }

// D3 500:8143: the kind badge starts with the kind's icon.
const kindIcons = {
  skill: <SkillIcon />,
  agent: <AgentIcon />,
  rule: <RuleIcon />,
  workflow: <WorkflowIcon />,
  hook: <HookIcon />,
}

export type ToolkitItemProps = {
  open: ToolkitOpenItem
  /** The desktop shows the item as a pane beside the list; a tablet or phone in place of the list, under Back. */
  layout?: Viewport | undefined
  /** Back to the list, on a tablet or phone. */
  back?: (() => void) | undefined
  onTabChange?: ((tab: string) => void) | undefined
  /** Called with the badge's path when its copy button is pressed. */
  onCopyPath?: ((path: string) => void) | undefined
  /** Shows the item on the map. */
  onShowOnMap?: (() => void) | undefined
  onDiscuss?: (() => void) | undefined
  /** Opens a workflow's steps on a page of their own (D8 Open full page, D13). */
  onOpenFullPage?: (() => void) | undefined
  /** Opens another toolkit item, such as an agent a workflow runs, by its path. */
  onOpenItem?: ((path: string) => void) | undefined
}

export function ToolkitItem({
  open,
  layout = 'desktop',
  back,
  onTabChange,
  onCopyPath,
  onShowOnMap,
  onDiscuss,
  onOpenFullPage,
  onOpenItem,
}: ToolkitItemProps) {
  const { item, detail, tab } = open
  const desktop = layout === 'desktop'
  const phone = layout === 'phone'
  const actions = (
    <ToolkitItemActions gap={desktop ? '10' : '8'} iconOnly={phone} onDiscuss={onDiscuss} onShowOnMap={onShowOnMap} />
  )
  const article = (
    <article
      aria-label={item.name}
      className={desktop ? pane : phone ? phonePage : page}
      data-figma={itemLayer[layout]}
    >
      <div className={desktop ? metaRow : phone ? metaRowPhone : metaRowPage} data-figma="meta row">
        <div data-figma="kind badge">
          <KindBadge kind={item.kind} icon={kindIcons[item.kind]} />
        </div>
        {desktop ? actions : null}
        {phone ? <ToolkitItemChanged changed={detail.changed} /> : null}
      </div>
      <h2 className={title} data-figma={titleLayersOf[layout][item.path]}>
        {item.name}
      </h2>
      <ToolkitItemPath
        location={detail.location}
        changed={phone ? '' : detail.changed}
        onCopyPath={onCopyPath}
        layer={phone ? null : 'path row'}
      />
      <ItemTabs
        label={`${item.name} sections`}
        value={tab}
        onValueChange={onTabChange}
        items={detail.tabs.map((t) => ({
          value: t.value,
          label: t.label,
          content:
            // The other tabs are later frames (D4, D7 to D9); until then their panels are empty.
            t.value === 'overview' ? (
              <ToolkitItemOverview
                detail={detail}
                kind={item.kind}
                layout={layout}
                onTabChange={onTabChange}
                onOpenFullPage={onOpenFullPage}
                onOpenItem={onOpenItem}
              />
            ) : null,
        }))}
      />
    </article>
  )
  if (desktop) return article
  return (
    <DetailFrame
      layout={layout}
      back={
        <div data-figma="back row">
          <BackRow label="Toolkit" onBack={back}>
            {actions}
          </BackRow>
        </div>
      }
    >
      {article}
    </DetailFrame>
  )
}
