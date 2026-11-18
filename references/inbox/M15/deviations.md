# M15 deviations

What still differs from Figma M15 · Sorted by project (`sortedList`), after the last
fidelity run (`pnpm fidelity inbox`, 2026-11-17, library
1.0.0-beta.8, which adds #109), each with its reason. The library gaps are in
`web/src/pages/inbox/LIBRARY_GAPS.md`.

## Checks

- Text: pass (62 strings checked; none under exceptions.json).
- Position: 13 of 15 layers pass (`header`, `filter · chips`, `list tools`, `sort applied`, `group · NEXT STEPS`, `group · SNOOZED`, `group · RUNNING`, `tab bar`).
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects` and `tab · More`.
- Rules: pass (2 findings under exceptions.json).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101).

- `inbox list`: x +0, y +0, w +0, h -7.
- `group · NEEDS YOU`: x +0, y -6, w +0, h +2.

## Deviations

- **Status bar.** Figma draws a 38 px status bar (9:41) at the top of
  the frame; the app has none (d-089: device chrome belongs to the
  canvas). All three checks render the page 38 px shorter (d-102),
  so text under its bottom edge counts as not shown, and the position
  check adds 38 to each render y (d-101), so a layer anchored to the top or to the
  bottom compares true, and the side-by-side draws the render 38 px
  lower, under a blank band where Figma has the bar. Figma's home indicator (the bar at the bottom) and the frame's
  rounded corners are device chrome too (d-089): the render draws
  neither. Library gap:
  Top and bottom safe areas on the phone.
- **List rows and group headers.** As in M01: `ListRow
  density="compact"` rows are 56 px against Figma's 55 and group
  headers 36 against 34, the 4 px grid values nearest Figma's (d-100,
  library #108). The project headings (`GroupHeader variant="project"`)
  are 24 px, as Figma's (library #109, beta.8; was 26). The later groups
  (`group · NEXT STEPS`, `group · SNOOZED`, `group · RUNNING`) are
  within the tolerance. The list's box hugs its rows and runs under the
  tab bar, as Figma's 919 px list does (346:12126); it is 7 px shorter
  than Figma's (`inbox list` h -7), from the 4 px shorter header and
  tools rows (see Header, chips and tools) against the 1 px taller rows
  and 2 px taller group headers. Before beta.8 the 2 px taller project
  headings made up the difference. The list's end lies under the tab
  bar, so no viewer sees it.
- **Header, chips and tools.** As in M01: `PageHeader size="phone"` is
  40 px high against Figma's 44 (`header` h -4) and the tools row 40
  against 44 (`list tools` h -4); the chip row's box is 34 against
  Figma's 30 (`filter · chips` h +4), so it and the first group start
  4 px higher. Library gap: Breakpoint tokens. The search field's text and placeholder are 13 px
  (`SearchField textSize="sm"`, `bodySm`), and an idle chip's count is
  `fg.subtle` (#7986a6, beta.5); Figma's #4a5675 stays out by d-099,
  because it fails WCAG AA (d-055).
- **Rows and chips on the phone.** As in M01: the rows are pulled 6 px
  out of the list's padding so the kind tiles line up under the group
  chevrons (Library gap: List row padding on the phone), and each chip
  pads its label 8 against Figma's 12 (Library gap: Filter chip padding
  on the phone).
- **Chip row.** The chips scroll sideways and the row clips them, as
  Figma does, and fades the cut edge over 24 px
  against Figma's 36 (the `hiddenOverflow`
  exception says why). Library gap: Chip row fade.
- **Sorted by project.** On the phone a sort other than Newest first
  shows a line under the tools, "Sorted by project" and Reset, which
  brings back Newest first (`InboxRoute.test.tsx`); the Sort icon is
  pressed with its cyan dot (`Button indicator`). The line is 16 px
  high against Figma's 18 (`sort applied` h -2). Each group has a
  heading per project (`GroupHeader variant="project"`).
- **Below the fold.** SNOOZED and RUNNING lie under the tab bar in
  Figma and in the render; the list runs under the bar (AppShell
  `tabBarOverlay`, library 1.0.0-beta.26), so the text check passes them
  with no exception.
- **Last next step above the tab bar.** The checks render 806 px high,
  the screen below the status bar (d-102). With the 24 px project
  headings (beta.8) the last Next steps row shows whole above the tab
  bar, as in Figma: its title (`Run the readme cross-family round x2`),
  its age (`5h`) and its meta line (`skill-evals · readme`), which
  beta.7 put under the bar. The text check passes.
- **Button labels.** The approval row's Allow once, Deny and Open chat
  are `Button textSize="xs"` (`labelXs`, Medium 12/16), as Figma's
  Medium 12 (d-100). Sort and Filter are icons, and the sort line's
  Reset is a link. The labels match.
- **Beta.7 (2026-11-17).** Library 1.0.0-beta.6 and beta.7 (#107,
  #108) move these layers: `inbox list` within tolerance (was x +0, y
  +0, w +0, h +33); `group · NEEDS YOU` x +0, y -6, w +0, h +2 (was x
  +0, y -6, w +0, h +4); `group · NEXT STEPS` within tolerance (was x
  +0, y +18, w +0, h +4); `group · SNOOZED` x +0, y +10, w +0, h +2
  (was x +0, y +32, w +0, h +4); `group · RUNNING` x +0, y +12, w +0,
  h +2 (was x +0, y +36, w +0, h +4). The cause is #108's compact
  `ListRow` (56 px, was 58; Figma 55) and list `GroupHeader` (36 px,
  was 38; Figma 34).
- **Beta.8 (2026-11-17).** Library 1.0.0-beta.8 (#109) puts the project
  `GroupHeader` at Figma's 24 px (was 26), which moves these layers:
  `group · SNOOZED` within the tolerance (was x +0, y +10, w +0, h +2);
  `group · RUNNING` within the tolerance (was x +0, y +12, w +0, h +2);
  `inbox list` x +0, y +0, w +0, h -7 (was within the tolerance). The
  text check passes: `skill-evals · readme` shows above the tab bar.
