# M04 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit D01 T01 M01 M04`, 2026-11-17, against the
installed library 1.0.0-beta.8), each with its reason. The library gaps
are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/moreDrawer.ts`: M1's data
(`toolkitListTablet`) with the drawer open. The drawer is the shared
block `web/src/blocks/MoreDrawer.tsx`, on the library's `MoreDrawer`.
D01, T01 and M01 give the same results as before M04.

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
    `skills/project-setup/`, `→1 ←0` and `Search the toolkit`.
  - The Inbox tab's badge `4` (424:6912) is in `exceptions.json`: the
    drawer covers it in Figma as in the render.
- Position: 3 of 38 layers pass (`header`, `tab bar`, `icon/flow`).
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
  against the four Artifacts chips) and `search` (y +8, w +84: the
  Toolkit search is full width under the chips, the Artifacts search
  shares its row with Sort and Filter).
- **Selected item.** Toolkit, the page on screen, has the selected fill
  and border; Figma selects Artifacts, the page it draws under the
  drawer. The block selects the page the drawer opens from.
- **Focus ring on Artifacts.** The drawer opens with the focus on its
  first item, so Artifacts has a cyan focus ring that Figma does not
  draw. `MoreDrawer` has no `initialFocus` (gap: More drawer first
  focus).
- **Item spacing.** The drawer's items stand about 71 px apart against
  Figma's 66 to 68, and the Later label sits higher, so each item above
  Workflows is higher than Figma's: `icon/layers` y -22 (Artifacts),
  `icon/toolkit` y -17 (Toolkit), `icon/brain` y -9 (Brain). Workflows
  (`icon/flow`) passes, and the drawer's bottom edge is Figma's (gap:
  More drawer item spacing).
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
