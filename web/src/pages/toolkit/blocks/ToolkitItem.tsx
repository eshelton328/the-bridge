// An open toolkit item (Figma `toolkit item`, D3 427:250): the detail pane
// beside the list. The meta row (the kind badge, Discuss and Show on map),
// the name, the path badge that copies the path and when the item changed,
// then the item's tabs; the Overview tab (`ToolkitItemOverview`) shows the
// description, the main file rendered read-only, what uses the item, its
// files and its evals. On a tablet or phone a back row to the list comes
// first. Nothing edits the item (R35). Props only.
import {
  AgentIcon,
  BackRow,
  Button,
  ChatIcon,
  CopyIcon,
  FolderIcon,
  HookIcon,
  ItemTabs,
  KindBadge,
  MapIcon,
  PathBadge,
  RuleIcon,
  SkillIcon,
  WorkflowIcon,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitOpenItem } from '../types.ts'
import { ToolkitItemOverview } from './ToolkitItemOverview.tsx'

// D3 427:250: the content starts 40 in from the pane's edges and 28 down (no space token has 28: 24); the meta row, the name, the path row and
// the tabs are 16 apart (427:251 ends at 64, writer 427:270 starts at 80, path row 457:45 at 137, tabs 464:408 at 178).
const pane = css({ display: 'flex', flexDirection: 'column', flexGrow: '1', gap: '16', px: '40', pt: '24', pb: '40' })
// D3 427:251: the kind badge at the start, the two buttons 10 apart at the end. Show on map (427:258) is 36 high,
// but the lg button is 9 px wider than Figma's 136, so it takes the md size, as Discuss does (34 in Figma).
// The row is 40 high (4 above and below its 32 px buttons), so with the pane's 24 the buttons start at Figma's 28.
const metaRow = css({ display: 'flex', alignItems: 'center', gap: '10', py: '4' })
const actions = css({ display: 'flex', alignItems: 'center', gap: '10', ms: 'auto' })
const title = css({ alignSelf: 'flex-start', textStyle: 'heading', color: 'fg.default' })
// D3 457:45: the path badge, then when it changed in mono, 10 apart.
const pathRow = css({ display: 'flex', alignItems: 'center', alignSelf: 'flex-start', gap: '10' })
const changed = css({ textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap' })
// D3 457:50: the copy icon is a bare 12 px icon inside the badge; the library's smallest button is 24 high.
const copy = css({
  display: 'inline-flex',
  p: '0',
  color: 'fg.muted',
  bg: 'transparent',
  border: 'none',
  cursor: 'pointer',
  _hover: { color: 'fg.default' },
  _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
})

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
  /** On a tablet or phone the item fills the screen, under a back row to the list. */
  back?: (() => void) | undefined
  onTabChange?: ((tab: string) => void) | undefined
  /** Called with the badge's path when its copy button is pressed. */
  onCopyPath?: ((path: string) => void) | undefined
  /** Shows the item on the map. */
  onShowOnMap?: (() => void) | undefined
  onDiscuss?: (() => void) | undefined
}

export function ToolkitItem({ open, back, onTabChange, onCopyPath, onShowOnMap, onDiscuss }: ToolkitItemProps) {
  const { item, detail, tab } = open
  return (
    <article aria-label={item.name} className={pane} data-figma="toolkit item">
      {back === undefined ? null : <BackRow label="Toolkit" onBack={back} />}
      <div className={metaRow} data-figma="meta row">
        <div data-figma="kind badge">
          <KindBadge kind={item.kind} icon={kindIcons[item.kind]} />
        </div>
        <div className={actions}>
          <Button variant="primary" data-figma="button · Discuss" onClick={onDiscuss}>
            <ChatIcon />
            Discuss
          </Button>
          <Button variant="secondary" data-figma="button · Show on map" onClick={onShowOnMap}>
            <MapIcon />
            Show on map
          </Button>
        </div>
      </div>
      <h2 className={title} data-figma="427:270">
        {item.name}
      </h2>
      <div className={pathRow} data-figma="path row">
        <div data-figma="path badge">
          <PathBadge
            path={detail.location}
            icon={<FolderIcon />}
            trailing={
              <button
                type="button"
                className={copy}
                aria-label={`Copy ${detail.location}`}
                onClick={() => {
                  onCopyPath?.(detail.location)
                }}
              >
                <CopyIcon />
              </button>
            }
          />
        </div>
        {detail.changed === '' ? null : <span className={changed}>{detail.changed}</span>}
      </div>
      <ItemTabs
        label={`${item.name} sections`}
        value={tab}
        onValueChange={onTabChange}
        items={detail.tabs.map((t) => ({
          value: t.value,
          label: t.label,
          content:
            // The other tabs are later frames (D4, D7 to D9); until then their panels are empty.
            t.value === 'overview' ? <ToolkitItemOverview detail={detail} onTabChange={onTabChange} /> : null,
        }))}
      />
    </article>
  )
}
