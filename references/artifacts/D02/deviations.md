# D02 deviations

What still differs from Figma after round 1 of the fidelity loop (`pnpm
fidelity artifacts D02`, 2026-11-17, against the installed library
1.0.0-beta.15; checked again 2026-11-18 with 1.0.0-beta.36 and
2026-11-19 with 1.0.0-beta.69), each with its reason. The library gaps are in `web/src/pages/artifacts/LIBRARY_GAPS.md`.

## Checks

- Text: passes. `Toolkit` is an `extra` exception (`exceptions.json`).
- Position: 37 of 45 layers pass, among them the search, Sort and
  Filter, every artifact row, both group headers, the header, the
  artifact pane, its bar, title block, preview and "Made in". Eight fail;
  each is listed below.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects` and `rail · Artifacts`.
- Rules: pass.

## Deviations

- **Rail Artifacts icon.** Figma draws it in a 20 px frame (414:934); its
  other rail icons are 22 px. The shared `AppRail` draws every item's
  icon at 24 (`NavRail`, d-100), so the 22 px ones pass the iconSize
  check (2 px slack) and this one does not. A position exception
  names 414:934 (2026-11-19, the same decision on every page's rail).
- **Source chips.** `filter · chips` w +7.2. `FilterChips size="compact"`
  draws Figma's 9 px sides (8 px padding in a 1 px border) and puts the
  chips 6 apart against Figma's 5: 5 ties 4 and 6 on the 4 px grid and the
  tie takes the larger (d-072), so no library change closes it. Library
  gap "Compact chip spacing".
- **Search, Sort and Filter.** None left: since 2026-11-19 Sort and
  Filter take `padding="compact"` (10 px sides, Sort with
  `keepIconSize`), and `search`, `button · Sort` and `button · Filter`
  pass.
- **List tools row.** `list tools` y +6, h -8. Figma's row frame (403:165)
  starts 8 above the search and buttons; the render's row is only the
  controls, which sit 2 px higher than Figma's.
- **Discuss.** `button · Discuss` x -4.2, w +4.8: 95.8 wide against
  Figma's 91, as `Button textSize="sm"` pads its sides more than Figma's
  11 px. Library gap "Sort and Filter button widths".
- **Project chip.** `project · File in a project` x +6, `chips` w +5.2,
  `chip · updated 12m ago` x +7.2. The project chip is a `MetaChipButton`
  with its chevron, 137.2 wide against Figma's 136, and opens the project
  menu. The detail column starts 4 px further right (below): it pads 40
  against Figma's 36, by d-072 (LIBRARY_GAPS.md, "Decided with no
  library change").
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
- **Artifact title.** Since library 1.0.0-beta.71 (library PR 222) the
  title is `headingSm` (SemiBold 26/36), Figma's size, and the title
  block's rows are 10 apart, as Figma's (403:464: the title at 76, the
  description at 120, the chips at 150). What remains: Figma's title is
  a 34 px auto line and the render's 36 (on the 4 px grid), so the chips
  sit 2 px below Figma's, and the chips fail on x and width (Project chip,
  above).
- **Detail column.** The artifact column is 40 in from the list
  (`Container size="detail"`) against Figma's 36: no spacing token is 36,
  and d-072 takes 40 (LIBRARY_GAPS.md, "Decided with no library change").
- **Preview.** The chart's bars are the library's `Thumbnail kind="chart"`
  drawing, not Figma's heights and colours, and the frame around it is
  built from tokens. Since library 1.0.0-beta.74 (library PR 226) the
  window bar's dots are 5 px and 9 apart, as Figma's (403:485 to
  403:487), and the chart's axis is 8 % in and 84 % wide, Figma's 628
  and 60 (403:498). Library gaps "Thumbnail colour" and "Artifact
  preview frame". The readme cold-reader row's chart is amber, as Figma's
  (`Thumbnail tone`, library 1.0.0-beta.68).
- **Buttons with no screen yet.** Add a link, Discuss, Copy link,
  Remove, Open in workspace, Sort and Filter are buttons with no action;
  the project chip opens the project menu. Discuss opens the discussion (D7) in
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
px grid; `headingSm` since beta.71), the detail inset 36 (Figma's; drawn 40),
and the made-in box's side padding 16 (Figma 15, on the 4 px grid). The
New pill takes `Badge tone="working" size="sm"` (20 px, Figma 22), as D1's
cards do; Remove takes `variant="secondaryDanger"` and Open artifact
`variant="primary"`. The stack gaps are Figma's: 20 between the bar, title
block, preview and "Made in", 8 under "MADE IN", 10 in the bar. The link
mark in the preview's footer (403:500) is the library's `LinkMarkIcon
size="12"` (`LinkMark`), which fills its box: 12 px against Figma's 13,
as 12 is on the 4 px icon scale. As T2's.

## Notifications switch (d-118)

In the app, the rail has a Notifications switch at its end, which this
frame does not draw. Erik asked on 2026-11-21: "Can we get lush
notifications on the phone for this app?" ("lush" is a typo for "push"),
and decision d-118 adds Web Push with this switch to turn it on. It is a
frame exception that the app owns (`web/src/blocks/AppRail.tsx`,
`web/src/blocks/NotificationsSwitch.tsx`). The screen draws the switch
only when the page entry passes `push`; this frame's state and story pass
none, so the checks above are unchanged.
