# D02 deviations

What still differs from Figma after round 1 of the fidelity loop
(`pnpm fidelity artifacts D02`, 2026-11-17, against the installed
library 1.0.0-beta.8), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`.

## Checks

- Text: passes. `Toolkit` is an `extra` exception (`exceptions.json`).
- Position: 30 of 39 layers pass, among them every artifact row, both
  group headers, the header, the artifact pane, its bar, title block,
  preview and "Made in". Nine fail; each is listed below.
- Rules: pass.

## Deviations

- **Source chips.** `filter · chips` w +7.2. `FilterChips size="compact"`
  puts the chips 6 apart with 8 px sides; Figma has 5 apart and 9 px
  sides. Library gap "Compact chip spacing".
- **Search, Sort and Filter.** `search` w -11.8, `button · Sort` x -11.8,
  w +8.4, `button · Filter` w +4.4. `Button textSize="sm"` pads its sides
  more than Figma's 11 px, so Sort and Filter are wider and the search,
  which takes the free width, is narrower. Library gap "Sort and Filter
  button widths".
- **List tools row.** `list tools` y +6, h -8. Figma's row frame (403:165)
  starts 8 above the search and buttons; the render's row is only the
  controls, which sit 2 px higher than Figma's.
- **Discuss.** `button · Discuss` x -4.2, w +4.8: the same `Button` side
  padding. Library gap "Sort and Filter button widths".
- **Project chip.** `project · File in a project` x +6, w -16.8,
  `chips` w -12.8, `chip · updated 12m ago` x -10.8. The project chip is
  a read-only `MetaChip` with no chevron and no menu, so it is narrower
  and the updated chip sits further left. The detail column also starts
  4 px further right (below). Library gaps "Project chip menu" and
  "Detail column inset".
- **Row thumbnails.** The list's previews are 44 × 27.5 against Figma's
  64 × 40, so each row's text starts about 18 px further left. Library
  gap "List row thumbnail".
- **Row height and age.** Each row is 62 high against Figma's 58, and its
  age sits on the title line, not centred down the row. Each row after
  the first starts 2 up, so the rows keep Figma's 60 px pitch and the
  position check passes. Library gap "List row padding and age".
- **New dot.** The dot of a new artifact sits beside its age, 12 apart,
  on the title line, as Figma's; it is drawn with tokens, as no library
  part has it. Library gap "New dot in a list row".
- **Artifact title.** "Skill eval pass rates" is 28 px type (`heading`)
  against Figma's about 26 px, so it is a little larger and its box is
  40 high against 34. Library gap "Artifact title size".
- **Detail column.** The artifact column is 40 in from the list
  (`Container size="detail"`) against Figma's 36. Library gap "Detail
  column inset".
- **Preview.** The chart's bars are the library's `Thumbnail kind="chart"`
  drawing, not Figma's heights and colours, and the frame around it is
  built from tokens. Library gaps "Thumbnail colour" and "Artifact
  preview frame". The readme cold-reader row's chart is cyan and violet,
  not amber ("Thumbnail colour").
- **Page title.** "Artifacts" is 20 px type (`PageHeader size="page"`)
  against Figma's about 24 px. Library gap "Desktop page title size".
- **Buttons with no screen yet.** Add a link, Discuss, Copy link,
  Remove, Open in workspace, Sort and Filter are buttons with no action;
  the project chip opens no menu. Discuss opens the discussion (D7) in
  Figma's note, but D7's state does not exist on this branch, so it is
  not wired. Open artifact is a button with no action, and the link under
  the preview opens the artifact's address in a new tab.
- **Rail.** The shared rail (`AppRail`, not changed here: another chat
  holds the navigation) has a Toolkit item after Artifacts (d-105), which
  this frame does not draw, so More sits one item lower.

## Values picked (d-100)

Each value with no token is recorded for the library in
`LIBRARY_GAPS.md` and drawn with the nearest token until it lands: the
row thumbnail 64 (Figma's; drawn 44, `control.xl`), the row padding 8
(Figma's; drawn 10 by `ListRow`), the title 26/36 (Figma's size on the
4 px grid; drawn `heading` 28/40), the detail inset 36 (Figma's; drawn
40), and the made-in box's side padding 16 (Figma 15, on the 4 px grid).
The New pill takes `Badge tone="working" size="sm"` (20 px, Figma 22), as
D1's cards do; Remove takes `variant="secondaryDanger"` and Open artifact
`variant="primary"`. The stack gaps are Figma's: 20 between the bar,
title block, preview and "Made in", 8 under "MADE IN", 10 in the bar.
