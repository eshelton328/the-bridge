# M04 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit D01 T01 M01 M04`, 2026-11-17, against the
installed library 1.0.0-beta.8), each with its reason. The library gaps
are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/moreDrawer.ts`: M1's data
(`toolkitListTablet`) with the drawer open. The drawer is the shared
block `web/src/blocks/MoreDrawer.tsx`, on the library's `MoreDrawer`.
D01, T01 and M01 give the same results as before M04. The numbers below
are from the run with library 1.0.0-beta.15 and the props that library
#115 added: `Button pressedTone="accent"` and `FilterChips padding="none"`.
The Checks below are from `pnpm fidelity toolkit` on 2026-11-18,
against library 1.0.0-beta.47, with the props that library #166 added to
M1's rows under the scrim (`ListRow padding="phone"`,
`trailingAlign="center"` and `leadingGap="12"`); the drawer is as it
was.

Most of the failures come from one cause. Figma draws M4's drawer over
the Artifacts list (`library`, 424:6653), but the state belongs to the
Toolkit page, and a page cannot draw another page (`web/AGENTS.md`). The
render shows the Toolkit list (M1) under the scrim. The drawer itself
has all its text and is the same in both.

## Checks

- Text: fail. Every string of the drawer and the tab bar is in the
  render. The Artifacts list behind the drawer is not, because the
  render shows the Toolkit list there (see Page under the drawer):
  - missing: `17`, `New`, `Search artifacts`,
    `Checked Claude and Codex 2m ago`, `FOUND SINCE YOU LAST LOOKED`,
    `Skill eval pass rates`, `12m`, `skill-evals`, `Hono server spike`,
    `40m`, `ncc-1701`, `Inbox task lifecycle`, `1h`,
    `Tailscale access check`, `2h`, `EARLIER`, `20`,
    `the-bridge theme ideas`, `1d`,
    `Application versioning and releases`, `2d`, `omni`,
    `Panda tokens playground`, `3d`,
    `Agent factory and session tracking`, `4d`, `Brain map prototype`,
    `5d` and `omni-brain`.
  - not visible: `24` (424:6664, the All chip, and 424:6952), `Claude`,
    `Codex`, `4` (424:6699) and `Artifacts` (424:6950). Figma has
    `Artifacts` and `24` twice, as the page title and in the drawer;
    the render has them only in the drawer, so the check counts one
    layer of each as unseen.
  - extra (the Toolkit list under the scrim): `Skills`, `9`, `Rules`,
    `8`, `Read-only · from toolkit/ in the brain`, `SKILLS`,
    `agents-md`, `skills/agents-md/`, `→0 ←1`, `ambitious`,
    `skills/ambitious/`, `→0 ←0`, `audit-slop`, `skills/audit-slop/`,
    `→1 ←2`, `eval-cases`, `skills/eval-cases/`, `→3 ←3`,
    `mermaid-diagrams`, `skills/mermaid-diagrams/`, `→2 ←2`,
    `pr-description`, `skills/pr-description/`, `project-setup`,
    `skills/project-setup/`, `→1 ←0`, `readme`, `skills/readme/`,
    `writer`, `skills/writer/`, `→7 ←4` and `Search the toolkit`. The
    rows are 58 px high since #166 (62 before), so the writer row
    shows under the scrim too. Since the tab bar lies over the page (AppShell
    `tabBarOverlay`, library 1.0.0-beta.26), the list runs under the
    tab bar, so the readme row there counts as shown under the drawer
    too (`readme`, `skills/readme/`).
  - The Inbox tab's badge `4` (424:6912) is in `exceptions.json`: the
    drawer covers it in Figma as in the render.
- Position: 11 of 43 layers pass (`header`, `tab bar`, `icon/layers`,
  `icon/toolkit`, `icon/brain`, `icon/flow`).
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects` and `tab · More`.
- Rules: pass. Two `hiddenOverflow` findings are in `exceptions.json`,
  as in M01: the Toolkit list scrolls under the pinned tab bar
  (`main.app-shell__detail`), and its kind chips scroll sideways
  (`[data-figma="filter · chips"] > div.filter-chips__root`).

## Deviations

- **Page under the drawer.** The scrim covers the Toolkit list (M1),
  not the Artifacts list: the title reads Toolkit 27 with the List, Map
  and Activity buttons, the chips are the kinds, and the rows are skills.
  The Toolkit list's layers have no layer of the same name in M4
  (`noLayer`): `toolkit`, `button · list`, `button · map`,
  `button · activity`, `read-only line`, `group · SKILLS`,
  `toolkit row · agents-md`, `toolkit row · ambitious`,
  `toolkit row · audit-slop`, `toolkit row · eval-cases`,
  `toolkit row · mermaid-diagrams`, `toolkit row · pr-description`,
  `toolkit row · project-setup`, `toolkit row · readme`,
  `group · AGENTS`, `toolkit row · diagram-reviewer`,
  `toolkit row · eval-case-writer`, `toolkit row · eval-grader`,
  `toolkit row · pr-description-checker`,
  `toolkit row · readme-cold-reader`, `toolkit row · writing-reviewer`,
  `group · RULES`, `toolkit row · commits-and-prs`,
  `toolkit row · diagrams`, `toolkit row · linear`,
  `toolkit row · readmes`, `toolkit row · releases`,
  `toolkit row · skills`, `toolkit row · ste100` and
  `toolkit row · writing`. Two keys match an Artifacts layer of the same
  name but a different part: `filter · chips` (w +96, the kind chips
  against the four Artifacts chips) and `search` (w +84: the
  Toolkit search is full width under the chips, the Artifacts search
  shares its row with Sort and Filter).
- **Selected item.** Toolkit, the page on screen, has the selected fill
  and border; Figma selects Artifacts, the page it draws under the
  drawer. The block selects the page the drawer opens from.
- **Focus ring.** Closed. Measured on beta.47, the drawer opens with
  the focus on its sheet (`bottom-sheet__content`), whose outline is
  transparent, so no item has a focus ring, as in Figma.
- **Item spacing.** Library #115 (beta.14) closed it: the four item
  icons (`icon/layers`, `icon/toolkit`, `icon/brain`, `icon/flow`)
  now pass the position check. Before it, the items stood about 71 px
  apart against Figma's 66 to 68. Measured on beta.47, the title to
  subtitle spacing matches Figma (22 px from the title's top to the
  subtitle's top, as 424:6950 to 424:6951), and the subtitles are within
  1.2 px of Figma's widths. The item titles are about 7 % narrower than
  Figma's: Artifacts 56.5 px against 61, Toolkit 43.6 against 47, Brain
  34.2 against 37 and Workflows 69.8 against 75. `MoreDrawer` draws them
  in `label` (14/20), and Figma's widths fit a 15 px title; the drawer
  has no title size option (gap: More drawer item titles).
- **Workflows icon.** Figma's `icon/flow` (424:6973) is two circles on a
  branch; the library has no flow icon, and `BranchIcon` draws the same
  shape.

## M4 against Artifacts M8

`pnpm fidelity artifacts M08` cannot run: the Artifacts page has no state
for M8 (its only state is `library`, D1), and this branch does not add
one there. M8 (415:2, `references/artifacts/M08/`) draws the same drawer
before Toolkit moved. Against M8's picture, M4's drawer differs in these
places, all of them as M4's note asks:

- Toolkit is in the first group, after Artifacts, with its count `27`
  and a chevron, and it can be picked (`more item · Toolkit` 429:512,
  y 579). In M8 it is the first item under LATER (415:332, y 615),
  dimmed, with no count or chevron, and its icon is `icon/tool`.
- LATER moves down 66 px (M8 415:330 at y 579, M4 424:6955 at y 645)
  and holds only Brain and Workflows. Brain and Workflows are at the
  same place in both (y 681 and 747), and the drawer has the same top
  (y 450) and height.
- The Artifacts page does not show the drawer yet. The block takes
  `selected` and the counts, so when that page passes `artifacts` and
  `24`, its top item looks like M8's (Artifacts selected, `24`).

## Inbox phone frames

The Inbox opens the same drawer from the phone's More.
`pnpm fidelity inbox M01 M02 M03 M04 M05` gives the same report for each
frame on this branch as on its parent commit (d844587): the drawer is
closed in each of them, and no `AppTabBar` or `AppRail` item changed.

## Second review

- **Item titles.** The reviewer saw the drawer item titles about 6 %
  wider than Figma's, with 22 px from title to subtitle against 20. The
  measure on beta.47 (see Item spacing) finds the spacing equal to
  Figma's and the titles about 7 % narrower (gap: More drawer item
  titles).

## Settings row (d-119)

In the app, the More drawer has a Settings row after its pages, which this
frame does not draw: Settings has no Figma page, and decision d-119 puts
its entry in the drawer (`web/src/blocks/MoreDrawer.tsx`). The
Notifications switch that d-118 put below the drawer's pages moved to the
Settings page, so the drawer no longer draws it.
