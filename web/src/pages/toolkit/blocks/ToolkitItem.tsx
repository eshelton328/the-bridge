// An open toolkit item (Figma `toolkit item`, D3 427:250): the detail pane
// beside the list. The meta row (the kind badge, Discuss and Show on map),
// the name, the path badge that copies the path and when the item changed,
// then the item's tabs; the Overview tab (`ToolkitItemOverview`) shows the
// description, the main file rendered read-only, what uses the item, its
// files and its evals, and the How it works tab (`ToolkitHowItWorks`, D14)
// its steps. Only the selected tab's panel is drawn. On a tablet or phone (T3) the item replaces the list
// in the shared DetailFrame (d-107): the back row to Toolkit, with Discuss and
// Show on map at its end, stays at the top, and only the item under it
// scrolls; opened from another item's links (T7), the back row is a
// breadcrumb back to that item (`ToolkitItemBack`). On the phone (M2) the actions are icon buttons and when the item
// changed sits beside the kind badge. On How it works on a tablet (T10) the back row names the item (Toolkit ›
// writer), and the kind badge and path rows are left out: the title sits over the tabs. An item whose `how` is not
// `named` (T36, a rule) keeps its Overview's header on How it works. On the phone (M12) the
// title is smaller and the rows are 10 apart. Nothing edits the item (R35). Props
// only. A workflow on a page of its own (D13, `fullPage`) fills the page
// without the list: the breadcrumb row (Toolkit › Workflows › the workflow,
// with Discuss and Show on map) tops it on the desktop too, the meta row holds
// only the kind badge, and How it works draws the workflow's page
// (`ToolkitFlowPage`). On a tablet (T8) the same breadcrumb row is the
// DetailFrame's back row, 36 high, and the item's rows start 12 under it. On the phone (M9) the breadcrumb leaves out
// the kind's crumb (Toolkit › the workflow), the actions are icon buttons, when it runs sits beside the kind badge, the
// path row is left out and the rows are 10 apart under the smaller title, as on M12. On the Files tab of a tablet or
// phone (T4) the kind badge is left out: the title and the path row (the item's folder in the toolkit and how many
// files it has, the browser's `badge`) sit 8 apart over the tabs; a browser with no `badge` keeps the item's header
// (T32 to T35). A script with an explanation opens there on a page
// of its own (T6, `filePage`): the back row goes back to Files, and the title and the path row name the file. On the
// phone's Files tab (M5) a browser with a `badge` leaves out the path row too: the title sits over the tabs, the item's
// folder in the toolkit over the tree, and the copy button joins the back row's icon buttons. A file on its own page on
// the phone (M6) has no title: the path badge names the file with its icon, and the copy button joins the back row.
import {
  AgentIcon,
  CodeIcon,
  FileIcon,
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
import { type FileMode, fileMode, filePathIn, findFile, openFile } from './filesView.ts'
import { ToolkitFileBrowser } from './ToolkitFileBrowser.tsx'
import { ToolkitFilePage } from './ToolkitFilePage.tsx'
import { ToolkitFlowPage } from './ToolkitFlowPage.tsx'
import { ToolkitHowItWorks } from './ToolkitHowItWorks.tsx'
import { ToolkitItemActions } from './ToolkitItemActions.tsx'
import { ToolkitItemBack } from './ToolkitItemBack.tsx'
import { ToolkitItemChanged } from './ToolkitItemChanged.tsx'
import { ToolkitItemOverview } from './ToolkitItemOverview.tsx'
import { ToolkitItemPath } from './ToolkitItemPath.tsx'
import { ToolkitLinks } from './ToolkitLinks.tsx'
import { linkFile } from './linksView.ts'

// D3 427:250: the content starts 40 in from the pane's edges and 28 down (no space token has 28: 24); the meta row, the name, the path row and
// the tabs are 16 apart (427:251 ends at 64, writer 427:270 starts at 80, path row 457:45 at 137, tabs 464:408 at 178).
// The pane fills the frame's height; 24 under the content keeps D8's item (its content ends 42 over the frame's foot,
// 940, and the rendered file is 17 px taller than Figma's) inside the frame, with no scroll.
const pane = css({ display: 'flex', flexDirection: 'column', flexGrow: '1', gap: '16', px: '40', pt: '24', pb: '24' })
// D6 432:2141: on the Files tab the file browser runs past the frame's foot (it ends at 988 of 982), so the pane keeps
// no space under it, and the tabs and their open panel grow, so the browser runs to the pane's foot; with the pane's 24
// the tree's 17 rows would push the pane 4 px past the frame.
const paneFiles = css({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: '1',
  gap: '16',
  px: '40',
  pt: '24',
  pb: '0',
  '& > :last-child': { flexGrow: '1' },
  '& > :last-child > [role=tabpanel][data-state=open]': { display: 'flex', flexDirection: 'column', flexGrow: '1' },
})
// T3 428:542: the DetailFrame's Container pads the item at the sides and the foot. The back row (428:543) ends at 77
// and the meta row (428:561) starts at 91, and the rows under it are 14 apart; no space token has 14. The BackRow is
// 32 high against Figma's 36, so 20 above the meta row and 12 between the rows keep each row within 3 px of Figma's
// (the tabs' panel adds 16 above the description, Figma's 14).
const page = css({ display: 'flex', flexDirection: 'column', gap: '12', pt: '20' })
// T10 461:64: on How it works the title (461:255) starts 12 under the back row (461:244, which ends at 77), and the rows
// are 12 apart. The BackRow is 32 high against Figma's 36, so 16 above the title keeps it in place.
const howPage = css({ display: 'flex', flexDirection: 'column', gap: '12', pt: '16' })
// T4 434:405, T6 440:1772: on the Files tab of a tablet with the browser's `badge` there is no meta row, and the title
// starts 14 under the back row (434:394 and 440:1761 end at 77, the title starts at 91). The BackRow is 32 high against
// Figma's 36, so 16 above the title keeps it in place, as on T10 (`page`'s 20 is sized for T3's meta row). The tabs
// (434:512, 464:562) start 14 under the path row; no space token has 14, and 16 keeps the tabs and everything under
// them where `page`'s 20 and 12 put them, within 3 px of Figma's (LIBRARY_GAPS.md, Tablet item spacing).
const filesPage = css({ display: 'flex', flexDirection: 'column', gap: '16', pt: '16' })
// M12 461:404: on How it works on the phone the title (461:560) starts 10 under the back row (461:550), and the title
// and the tabs are 10 apart. M9 448:343, a workflow's own page on the phone, has the same spacing: the meta row
// (448:483) 10 under the breadcrumb row (448:473, ends at 78), and the title (448:491) and the tabs (464:530) 10 apart.
const phoneHowPage = css({ display: 'flex', flexDirection: 'column', gap: '10', pt: '10' })
// M2 429:284: on the phone the meta row (429:297) starts 12 under the back row (429:285), and the rows are 12 apart.
const phonePage = css({ display: 'flex', flexDirection: 'column', gap: '12', pt: '12' })
// D13 446:153: the page starts 32 in from the rail and the window's edge and 24 down; its rows are 14 apart (no space
// token has 14: the gap's 12 and 2 more above each row after the first), so the path row is at Figma's 168 and the tabs
// at 208. The breadcrumb row is 38 high in Figma (Show on map, 446:494), the render's 36: 2 under it and the 14 put the
// meta row at Figma's 76. Figma's page ends 24 under the details row; the tabs' panel adds 4 under it, so 20.
const fullPane = css({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: '1',
  gap: '12',
  px: '32',
  pt: '24',
  pb: '20',
  '& > * + *': { mt: '2' },
})
const fullBack = css({ pb: '2' })
// T8 448:206: on a tablet the meta row starts 12 under the breadcrumb row (448:193, 36 high, ends at 77), and the rows
// are 12 apart.
const fullNarrowPage = css({ display: 'flex', flexDirection: 'column', gap: '12', pt: '12' })
// D3 427:251: the kind badge at the start, the two buttons at the end. The row is 40 high (4 above and below its
// 32 px buttons), so with the pane's 24 the buttons start at Figma's 28.
const metaRow = css({ display: 'flex', alignItems: 'center', gap: '10', py: '4' })
// T3 428:561: on a tablet the meta row holds only the kind badge, and is as wide as it.
const metaRowPage = css({ display: 'flex', alignItems: 'center', alignSelf: 'flex-start' })
// T8 448:206: on a workflow's own page the meta row spans the item.
const metaRowFull = css({ display: 'flex', alignItems: 'center' })
// M9 448:483: on a workflow's own page on the phone the meta row spans the item: the kind badge and, 8 after it, when
// it runs.
const metaRowFullPhone = css({ display: 'flex', alignItems: 'center', gap: '8' })
// M2 429:297: on the phone the meta row holds the kind badge and, 8 after it, when the item changed.
const metaRowPhone = css({ display: 'flex', alignItems: 'center', alignSelf: 'flex-start', gap: '8' })
const title = css({ alignSelf: 'flex-start', textStyle: 'heading', color: 'fg.default' })
// T3 464:494, M2 464:521: Figma's item tabs are 32 high, and the rows above and under them are 14 apart; the item's
// rows are 12 apart (no space token has 14). The compact list has no inset, so it is 4 shorter than the default one;
// 4 above the panel keeps the description and every row under it where the default list put them, within 4 px of
// Figma's.
const panelPage = css({ pt: '4' })
// M12 461:560: on How it works on the phone the title is smaller (57 × 29): the title text style, 28 high.
const phoneHowTitle = css({ alignSelf: 'flex-start', textStyle: 'title', color: 'fg.default' })
// T4 434:405, T6 440:1772: on the Files tab of a tablet the title and the path row are one layer, 8 apart (the name
// ends at 129, the path row starts at 137).
const titleGroup = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  alignSelf: 'flex-start',
  gap: '8',
})

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
// On a tablet the SKILL.md title has the same text, so the node id again: writer in T3 (428:567); writing-reviewer in
// T7 (441:93), whose breadcrumb has the name too; skill-eval-round in T18 (487:612); the rule skills in T17 (487:355);
// the hook commit-msg in T19 (487:980).
const pageTitleLayers: Readonly<Record<string, string>> = {
  'skills/writer/': '428:567',
  'agents/writing-reviewer.md': '441:93',
  'workflows/skill-eval-round.md': '487:612',
  'rules/skills.md': '487:355',
  'hooks/commit-msg': '487:980',
}
// On the phone: writer in M2 (429:303), writing-reviewer in M20 (487:1474), skill-eval-round in M21 (487:1722), the
// rule skills in M19 (487:1264), the hook commit-msg in M22 (487:2043).
const phoneTitleLayers: Readonly<Record<string, string>> = {
  'skills/writer/': '429:303',
  'agents/writing-reviewer.md': '487:1474',
  'workflows/skill-eval-round.md': '487:1722',
  'rules/skills.md': '487:1264',
  'hooks/commit-msg': '487:2043',
}
// On the How it works tab the frame is another one, so another node id: writer in D14 (459:367), the rule skills in
// D37 (495:334), the agent writing-reviewer in D38 (495:846), the hook commit-msg in D39 (495:1443).
const howTitleLayers: Readonly<Record<string, string>> = {
  'skills/writer/': '459:367',
  'rules/skills.md': '495:334',
  'agents/writing-reviewer.md': '495:846',
  'hooks/commit-msg': '495:1443',
}
// The How it works header is a layer named `header`, as the list's header is, so its node id: D14 459:599, D37 495:398,
// D38 495:948, D39 495:1574.
const howHeaderLayers: Readonly<Record<string, string>> = {
  'skills/writer/': '459:599',
  'rules/skills.md': '495:398',
  'agents/writing-reviewer.md': '495:948',
  'hooks/commit-msg': '495:1574',
}
// On How it works on a tablet: writer in T10 (461:255), the rule skills in T36 (495:1827).
const tabletHowTitleLayers: Readonly<Record<string, string>> = {
  'skills/writer/': '461:255',
  'rules/skills.md': '495:1827',
}
// On How it works on the phone: writer in M12 (461:560), the agent writing-reviewer in M40 (495:3255), the hook
// commit-msg in M41 (495:3591).
const phoneHowTitleLayers: Readonly<Record<string, string>> = {
  'skills/writer/': '461:560',
  'agents/writing-reviewer.md': '495:3255',
  'hooks/commit-msg': '495:3591',
}
// On a workflow's own page: skill-eval-round in D13 (446:513; the breadcrumb's last crumb has the same name) and T8
// (448:214).
const fullPageTitleLayers: Readonly<Record<Viewport, Readonly<Record<string, string>>>> = {
  desktop: { 'workflows/skill-eval-round.md': '446:513' },
  tablet: { 'workflows/skill-eval-round.md': '448:214' },
  phone: { 'workflows/skill-eval-round.md': '448:491' },
}
// The description on a workflow's own page is a text layer with no name of its own: D13 446:514, T8 448:215.
const fullPageDescriptionLayers: Readonly<Record<Viewport, Readonly<Record<string, string>>>> = {
  desktop: { 'workflows/skill-eval-round.md': '446:514' },
  tablet: { 'workflows/skill-eval-round.md': '448:215' },
  phone: { 'workflows/skill-eval-round.md': '448:492' },
}
// On the Files tab: writer in D6 (432:2010), and in D10 (440:1198) with a script on Explain.
// On a tablet: writer in T4 (434:406), and the rule, the agent, the workflow and the hook in T32 to T35.
const filesTitleLayers: Readonly<Record<Viewport, Readonly<Record<string, string>>>> = {
  desktop: { 'skills/writer/': '432:2010' },
  tablet: {
    'skills/writer/': '434:406',
    'rules/skills.md': '494:2870',
    'agents/writing-reviewer.md': '494:3203',
    'workflows/skill-eval-round.md': '494:3571',
    'hooks/commit-msg': '494:4073',
  },
  // On the phone: writer in M5 (435:210), the rule skills in M35 (494:4452), writing-reviewer in M36 (494:4717),
  // skill-eval-round in M37 (494:5021) and the hook commit-msg in M38 (494:5369).
  phone: {
    'hooks/commit-msg': '494:5369',
    'skills/writer/': '435:210',
    'rules/skills.md': '494:4452',
    'agents/writing-reviewer.md': '494:4717',
    'workflows/skill-eval-round.md': '494:5021',
  },
}
// A file on a page of its own names it by the item's path and the file's: check in T6 (440:1773).
const filePageTitleLayers: Readonly<Record<Viewport, Readonly<Record<string, string>>>> = {
  desktop: {},
  tablet: { 'skills/writer/scripts/check': '440:1773' },
  phone: {},
}
const explainTitleLayers: Readonly<Record<Viewport, Readonly<Record<string, string>>>> = {
  desktop: { 'skills/writer/': '440:1198' },
  tablet: {},
  phone: {},
}
// On the Links tab: writer in D19 (482:367), the rule skills in D29 (493:626), writing-reviewer in D30 (493:1201),
// skill-eval-round in D31 (493:1984), the hook commit-msg in D32 (493:2794).
const linksTitleLayers: Readonly<Record<string, string>> = {
  'hooks/commit-msg': '493:2794',
  'skills/writer/': '482:367',
  'rules/skills.md': '493:626',
  'agents/writing-reviewer.md': '493:1201',
  'workflows/skill-eval-round.md': '493:1984',
}
// On the Links tab of a tablet: writer in T15 (482:735), the rule skills in T28 (493:3270), writing-reviewer in T29
// (493:3697), skill-eval-round in T30 (493:4281), the hook commit-msg in T31 (493:4892).
const tabletLinksTitleLayers: Readonly<Record<string, string>> = {
  'hooks/commit-msg': '493:4892',
  'skills/writer/': '482:735',
  'rules/skills.md': '493:3270',
  'agents/writing-reviewer.md': '493:3697',
  'workflows/skill-eval-round.md': '493:4281',
}
// T15's graph has a layer named `links` too, so the tab's node id (482:908).
const tabletLinksLayers: Readonly<Record<string, string>> = {
  'skills/writer/': '482:908',
}
// On the Links tab of the phone: writer in M17 (482:1067), the rule skills in M31 (493:5375), writing-reviewer in M32
// (493:5750), skill-eval-round in M33 (493:6286).
const phoneLinksTitleLayers: Readonly<Record<string, string>> = {
  'workflows/skill-eval-round.md': '493:6286',
  'skills/writer/': '482:1067',
  'rules/skills.md': '493:5375',
  'agents/writing-reviewer.md': '493:5750',
}
const linksTitleLayersOf: Readonly<Record<Viewport, Readonly<Record<string, string>>>> = {
  desktop: linksTitleLayers,
  tablet: tabletLinksTitleLayers,
  phone: phoneLinksTitleLayers,
}
const titleLayersOf = { desktop: titleLayers, tablet: pageTitleLayers, phone: phoneTitleLayers }
const howTitleLayersOf: Readonly<Record<Viewport, Readonly<Record<string, string>>>> = {
  desktop: howTitleLayers,
  tablet: tabletHowTitleLayers,
  phone: phoneHowTitleLayers,
}
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
  /** The item it was opened from (T7): on a tablet or phone the back row shows the breadcrumb back to it. */
  from?: { name: string; onOpen?: (() => void) | undefined } | null | undefined
  onTabChange?: ((tab: string) => void) | undefined
  /** Called with the badge's path when its copy button is pressed. */
  onCopyPath?: ((path: string) => void) | undefined
  /** Shows the item on the map. */
  onShowOnMap?: (() => void) | undefined
  onDiscuss?: (() => void) | undefined
  /** Opens a workflow's steps on a page of their own (D8 Open full page, D13). */
  onOpenFullPage?: (() => void) | undefined
  /** The path of the file selected on the Files tab (D6, `ui.file`); the browser's own when not set. */
  file?: string | undefined
  /** Called with a file's path when it is selected on the Files tab. */
  onFileChange?: ((path: string) => void) | undefined
  /** Explain or Code for the Files tab's script (D10, `ui.fileView`); Explain when not set. */
  fileView?: FileMode | undefined
  /** Called with Explain or Code when the Files tab's viewer changes its view. */
  onFileViewChange?: ((mode: FileMode) => void) | undefined
  /** On a tablet or phone, the selected file fills the Files tab on a page of its own (T6, `ui.filePage`). */
  filePage?: boolean | undefined
  /** Leaves the file's page for the Files tab's tree (T6's Back to Files). */
  onCloseFilePage?: (() => void) | undefined
  /** Opens another toolkit item, such as an agent a workflow runs, by its path. */
  onOpenItem?: ((path: string) => void) | undefined
  /** Opens a file of a toolkit item on its Files tab: the item's path and the file's path in it (D19's link lines). */
  onOpenFile?: ((item: string, file: string) => void) | undefined
  /**
   * A workflow on a page of its own (D13): the kind's crumb after Toolkit (Workflows, back to that kind's list), the
   * selected step and the way to select one. Beside the list when not set.
   */
  fullPage?:
    | {
        crumb: { name: string; onOpen?: (() => void) | undefined }
        selectedStep?: string | undefined
        onSelectStep?: ((id: string) => void) | undefined
      }
    | undefined
}

export function ToolkitItem({
  open,
  layout = 'desktop',
  back,
  from,
  onTabChange,
  onCopyPath,
  onShowOnMap,
  onDiscuss,
  onOpenFullPage,
  onOpenItem,
  onOpenFile,
  fullPage,
  file,
  onFileChange,
  fileView,
  onFileViewChange,
  filePage = false,
  onCloseFilePage,
}: ToolkitItemProps) {
  const { item, detail, tab } = open
  const desktop = layout === 'desktop'
  const phone = layout === 'phone'
  const full = fullPage !== undefined
  // The Files tab shows a script's explanation (D10), which names its own title layer.
  const explaining =
    tab === 'files' &&
    detail.browser !== undefined &&
    fileMode(openFile(detail.browser, file).view, fileView) === 'explain'
  // T4: the Files tab of a tablet or phone whose browser names the item's folder (`badge`) has no kind badge, and its
  // path row names that folder. Without a `badge` (T32 to T35) the item keeps its header, as on the Overview (T17).
  const browser = !desktop && tab === 'files' ? detail.browser : undefined
  const narrowFiles = browser !== undefined
  const folderFiles = browser?.badge !== undefined
  const opened = browser === undefined ? undefined : openFile(browser, file)
  // T6: the selected file on a page of its own, when the state has a view of it.
  const pageView = filePage && opened?.view !== undefined ? opened.view : undefined
  const pageFile =
    browser === undefined || opened === undefined || pageView === undefined
      ? undefined
      : {
          path: opened.path,
          name: findFile(browser.tree, opened.path)?.name ?? opened.path,
          view: pageView,
          location: `${browser.badge?.path ?? detail.location}${opened.path}`,
        }
  // M5 435:203: on the phone's Files tab with no path badge (a browser with a `badge`), the copy button joins the back
  // row's icon buttons.
  const phoneFolder = phone && folderFiles && pageFile === undefined
  // M6 435:493: a file on its own page on the phone has no title; the path badge names the file in the item.
  const phoneFile = phone && pageFile !== undefined
  const copied = phoneFile ? filePathIn(detail.location, pageFile.path) : detail.location
  // M5 435:212: on the phone the Files tab names the item's folder in the toolkit over the tree.
  const folder = detail.location.slice(0, detail.location.lastIndexOf('/') + 1)
  // M9 448:473: on the phone a workflow's own page names only the workflow after Toolkit.
  const fullPhone = full && phone
  const crumb = fullPhone ? null : (fullPage?.crumb ?? from)
  // How it works on a tablet or phone, when the item's `how` asks for it (T10): no kind badge or path row, and the
  // back row names the item. Without it (T36) the item keeps its header and spacing, as on the Overview. The Links tab
  // does the same when its `links` asks for it (T15); without it (T28) the item keeps its header.
  const narrowHow =
    !desktop && ((tab === 'how' && detail.how?.named === true) || (tab === 'links' && detail.links?.named === true))
  // D13 446:490: on a workflow's own page Discuss and Show on map are 8 apart, as in the tablet's back row.
  const actions = (
    <ToolkitItemActions
      gap={desktop && !full ? '10' : '8'}
      iconOnly={phone}
      onDiscuss={onDiscuss}
      onShowOnMap={onShowOnMap}
      copy={
        phoneFolder || phoneFile
          ? {
              label: `Copy ${copied}`,
              onCopy: () => {
                onCopyPath?.(copied)
              },
            }
          : undefined
      }
    />
  )
  const heading = (
    <h2
      className={(narrowHow || fullPhone) && phone ? phoneHowTitle : title}
      data-figma={
        pageFile !== undefined
          ? filePageTitleLayers[layout][pageFile.location]
          : full
            ? fullPageTitleLayers[layout][item.path]
            : tab === 'how'
              ? howTitleLayersOf[layout][item.path]
              : tab === 'files'
                ? (explaining ? explainTitleLayers : filesTitleLayers)[layout][item.path]
                : tab === 'links'
                  ? linksTitleLayersOf[layout][item.path]
                  : titleLayersOf[layout][item.path]
      }
    >
      {pageFile?.name ?? item.name}
    </h2>
  )
  const pathRow =
    narrowHow || fullPhone || phoneFolder ? null : phoneFile ? (
      <ToolkitItemPath
        location={pageFile.path}
        changed=""
        icon={opened?.type === 'code' ? <CodeIcon /> : <FileIcon />}
        copyable={false}
        layer={null}
      />
    ) : (
      <ToolkitItemPath
        location={pageFile?.location ?? browser?.badge?.path ?? detail.location}
        changed={
          pageFile !== undefined ? (pageFile.view.meta ?? '') : (browser?.badge?.meta ?? (phone ? '' : detail.changed))
        }
        onCopyPath={onCopyPath}
        layer={phone ? null : 'path row'}
      />
    )
  const article = (
    <article
      aria-label={item.name}
      className={
        desktop
          ? full
            ? fullPane
            : tab === 'files'
              ? paneFiles
              : pane
          : narrowHow || fullPhone
            ? phone
              ? phoneHowPage
              : howPage
            : phone
              ? phonePage
              : full
                ? fullNarrowPage
                : folderFiles
                  ? filesPage
                  : page
      }
      data-figma={desktop && full ? 'toolkit' : itemLayer[layout]}
    >
      {desktop && full ? (
        <div className={fullBack}>
          <ToolkitItemBack
            name={item.name}
            from={crumb}
            onBack={back}
            actions={actions}
            layers={{ row: 'breadcrumb row', trail: null }}
            tall
          />
        </div>
      ) : null}
      {narrowHow || folderFiles || phoneFile ? null : (
        <div
          className={
            desktop && !full
              ? metaRow
              : fullPhone
                ? metaRowFullPhone
                : phone
                  ? metaRowPhone
                  : full && !desktop
                    ? metaRowFull
                    : metaRowPage
          }
          data-figma="meta row"
        >
          <div data-figma="kind badge">
            <KindBadge kind={item.kind} icon={kindIcons[item.kind]} />
          </div>
          {desktop && !full ? actions : null}
          {phone ? <ToolkitItemChanged changed={detail.changed} /> : null}
        </div>
      )}
      {folderFiles && !phone ? (
        <div className={titleGroup} data-figma="title">
          {heading}
          {pathRow}
        </div>
      ) : phoneFile ? (
        pathRow
      ) : (
        <>
          {heading}
          {pathRow}
        </>
      )}
      {/* Figma draws the selected tab's label cyan on every layout (D3, T3, M2); on a tablet and the phone the tabs
          start at the list's edge with 10 px sides (T3 and M2 `item tabs`), on the desktop with the default space. */}
      <ItemTabs
        label={`${item.name} sections`}
        tone="accent"
        density={desktop ? 'default' : 'compact'}
        value={tab}
        onValueChange={onTabChange}
        items={detail.tabs.map((t) => {
          // Only the selected tab's panel is drawn. The other tabs are later frames; until then their panels are
          // empty, as How it works is for an item with no `how`.
          const panel =
            t.value !== tab ? null : t.value === 'overview' ? (
              <ToolkitItemOverview
                detail={detail}
                kind={item.kind}
                layout={layout}
                onTabChange={onTabChange}
                onOpenFullPage={onOpenFullPage}
                onOpenItem={onOpenItem}
              />
            ) : t.value === 'how' && full && detail.flowPage !== undefined ? (
              <ToolkitFlowPage
                flow={detail.flowPage}
                description={detail.description}
                descriptionLayer={fullPageDescriptionLayers[layout][item.path]}
                selected={fullPage.selectedStep}
                onSelectStep={fullPage.onSelectStep}
                layout={layout}
              />
            ) : t.value === 'links' && detail.links !== undefined ? (
              <ToolkitLinks
                links={detail.links}
                item={item}
                layout={layout}
                layer={layout === 'tablet' ? tabletLinksLayers[item.path] : undefined}
                onOpenItem={onOpenItem}
                onOpenLine={(side, l) => {
                  const target = linkFile(side, l, item.path)
                  onOpenFile?.(target.item, target.file)
                }}
              />
            ) : t.value === 'how' && detail.how !== undefined ? (
              <ToolkitHowItWorks how={detail.how} headerLayer={howHeaderLayers[item.path]} layout={layout} />
            ) : t.value === 'files' && pageFile !== undefined ? (
              <ToolkitFilePage
                view={pageFile.view}
                mode={fileMode(pageFile.view, fileView)}
                onModeChange={onFileViewChange}
                layout={layout}
              />
            ) : t.value === 'files' && detail.browser !== undefined ? (
              <ToolkitFileBrowser
                browser={detail.browser}
                open={openFile(detail.browser, file)}
                layout={layout}
                onSelect={onFileChange}
                folder={phone ? folder : undefined}
                marked={phone ? (file ?? null) : undefined}
                mode={fileView}
                onModeChange={onFileViewChange}
                onCopy={(path) => {
                  onCopyPath?.(filePathIn(detail.location, path))
                }}
              />
            ) : null
          return {
            value: t.value,
            label: t.label,
            // T8 448:215: a workflow's own page starts 12 under the tabs; the tabs' panel puts it 15 under them.
            // T4 434:408: on the Files tab of a tablet the tree starts 14 under the tabs, where the tabs' panel puts it.
            // T15 482:909: a named Links tab starts 12 under the tabs, so it takes no space above it either.
            content:
              desktop || full || narrowFiles || panel === null || (narrowHow && tab === 'links') ? (
                panel
              ) : (
                <div className={panelPage}>{panel}</div>
              ),
          }
        })}
      />
    </article>
  )
  if (desktop) return article
  return (
    <DetailFrame
      layout={layout}
      back={
        <ToolkitItemBack
          name={item.name}
          from={crumb}
          named={narrowHow || fullPhone}
          // T6 440:1762: a file on a page of its own goes back to the Files tab's tree.
          label={pageFile === undefined ? undefined : 'Files'}
          onBack={pageFile === undefined ? back : onCloseFilePage}
          actions={actions}
          // T8 448:193: a workflow's own page names the row `breadcrumb row`, 36 high, as D13 does.
          layers={full ? { row: 'breadcrumb row', trail: null } : undefined}
          tall={full}
        />
      }
    >
      {article}
    </DetailFrame>
  )
}
