# D02 deviations

What still differs from Figma after round 1 of the fidelity loop (`pnpm
fidelity artifacts D02`, 2026-11-17, against the installed library
1.0.0-beta.15; checked again 2026-11-18 with 1.0.0-beta.36), each with its
reason. The library gaps are in `web/src/pages/artifacts/LIBRARY_GAPS.md`.

## Checks

- Text: passes. `Toolkit` is an `extra` exception (`exceptions.json`).
- Position: 34 of 45 layers pass, among them every artifact row, both
  group headers, the header, the artifact pane, its bar, title block,
  preview and "Made in". Nine fail; each is listed below.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects` and `rail · Artifacts`.
- Rules: pass.

## Deviations

- **Source chips.** `filter · chips` w +7.2. `FilterChips size="compact"`
  draws Figma's 9 px sides (8 px padding in a 1 px border) and puts the
  chips 6 apart against Figma's 5: 5 ties 4 and 6 on the 4 px grid and the
  tie takes the larger (d-072), so no library change closes it. Library
  gap "Compact chip spacing".
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
- **Row thumbnails.** None left: since library 1.0.0-beta.36 the rows
  draw `Thumbnail size="sm"`, 64 × 40 as Figma's (403:194), with each
  kind's row drawing (the grid as six round-cornered cells, the ui as a
  window with a side bar and rows), not the card's drawing scaled down.
- **Row height and age.** None left: since library 1.0.0-beta.39
  (#147) each row is `ListRow padding="sm"`, 58 high as Figma's
  (403:219), 2 apart, and its age is centred down the row
  (`trailingAlign="center"`, 403:218).
- **New dot.** None left: since library 1.0.0-beta.39 (#147) the dot of
  a new artifact is `ListRow dot="working" dotPosition="end"`, 6 px at
  the end of the title line, 12 before the age, as Figma's (403:213).
- **Artifact title.** "Skill eval pass rates" is 28 px type (`heading`)
  against Figma's about 26 px, so it is a little larger and its box is
  40 high against 34. Library gap "Artifact title size".
- **Detail column.** The artifact column is 40 in from the list
  (`Container size="detail"`) against Figma's 36. Library gap "Detail
  column inset".
- **Preview.** The chart's bars are the library's `Thumbnail kind="chart"`
  drawing, not Figma's heights and colours, and the frame around it is
  built from tokens. The window bar's dots are about 10 px and 18 apart
  against Figma's 5 and 9 (403:485 to 403:487), and the chart's axis is
  about 557 wide, 96 in from each side, against Figma's 628 and 60
  (403:498): `Thumbnail` draws both inside its SVG and scales them with
  the banner. Library gaps "Thumbnail colour" and "Artifact preview
  frame". The readme cold-reader row's chart is cyan and violet, not
  amber ("Thumbnail colour").
- **Buttons with no screen yet.** Add a link, Discuss, Copy link,
  Remove, Open in workspace, Sort and Filter are buttons with no action;
  the project chip opens no menu. Discuss opens the discussion (D7) in
  Figma's note, but D7's state does not exist on this branch, so it is
  not wired. Open artifact is a button with no action, and the link under
  the preview opens the artifact's address in a new tab.
- **Nav rail.** Figma's rail has no Toolkit item, so `rail · Toolkit`
  has no layer, and `rail · More` sits 52 px lower (y +52). The design
  predates d-105, which adds the Toolkit (and Artifacts) item; the app
  draws the six-item navigation.

## Values picked (d-100)

Each value with no token is recorded for the library in `LIBRARY_GAPS.md`
and drawn with the nearest token until it lands: the row thumbnail 64
(Figma's; `Thumbnail size="sm"` since beta.36), the row padding 8
(Figma's; `ListRow padding="sm"` since beta.39), the title 26/36 (Figma's size on the 4
px grid; drawn `heading` 28/40), the detail inset 36 (Figma's; drawn 40),
and the made-in box's side padding 16 (Figma 15, on the 4 px grid). The
New pill takes `Badge tone="working" size="sm"` (20 px, Figma 22), as D1's
cards do; Remove takes `variant="secondaryDanger"` and Open artifact
`variant="primary"`. The stack gaps are Figma's: 20 between the bar, title
block, preview and "Made in", 8 under "MADE IN", 10 in the bar. The link
mark in the preview's footer (403:500) is the 20 px `LinkIcon` (`icon.20`)
in a 12 px place (`LinkMark`, -4 margins at the sides and -2 above and
below): the library draws the links across the middle 15 of its 24, so the
mark is 12.6 px wide against Figma's 13, and the address starts at x 557
against 558. As T2's.
