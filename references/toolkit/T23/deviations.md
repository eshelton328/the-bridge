# T23 deviations

What still differs from Figma after the fidelity loop (`pnpm fidelity
toolkit T23`, 2026-11-18, against library 1.0.0-beta.36: a first run and
two fix rounds), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookActivityTablet.ts`: D24's data, under
the hook's header. Every other Toolkit frame (the 86 frames built before
the Activity tab) gives the same text, position and rule results as
before it, layer by layer. The frame's `exceptions.json` excepts the
string and the `hiddenOverflow` finding below, each with the entry that
records it; with them the text and rules checks now pass.

## Checks

- Text: fail. Every Figma string is in the render. 1 string is not
  visible: `the message broke the rule` (491:8077); see Key figures.
- Position: 19 of 30 layers pass. The 11 that fail: `button · Discuss` x
  -5.1 y -1 w +2.5 h -2; `toolkit item` x +2 y +32 w -4 h -106;
  `491:7892` x +2 y -1 w +11.7 h +2; `row · day and where` x +2 y -3 w
  -4 h -10; `panel · by day` x +2 y -3 w -4 h -5; `panel · where` x +2 y
  -8 w -4 h -5; `panel · chats` x +2 y -13 w -4 h +19; `row · Commit and
  push private brain` x +2 y -14 w -4 h +11; `row · Deep research on
  evals` x +2 y -11 w -4 h +11; `row · Writer rules, skills, and agents`
  x +2 y -8 w -4 h +11; `row · Agent PR description toolkit pieces` x +2
  y -5 w -4 h +11. Each is explained below.
- Rules: fail. 1 `hiddenOverflow` finding: `[data-figma="panel · kpi
  rejected"] > dl.kpi-tile__root > dd.kpi-tile__caption:nth-of-type(2) >
  span.truncated-text`. Each is explained below; the frame's
  `exceptions.json` excepts it.

## Deviations

- **Item frame.** Figma's `toolkit item` holds the back row and the
  item, from y 41 down to the tab bar. In `DetailFrame` the back row is
  the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row and ends with the tab's source line
  (`toolkit item` x +2 y +32 w -4 h -106: the Container pads 24 at the
  sides against 22, so every part of the tab is x +2 w -4). This is the
  d-107 structure that keeps Back in view, as on T16 and T24 (gap:
  Tablet item spacing).
- **Back row.** The back row is 32 px high against Figma's 36 (gap: Item
  action buttons). Discuss is wider than Figma's, so it starts further
  left (`button · Discuss` x -5.1 y -1 w +2.5 h -2).
- **Title width.** The title renders wider than Figma's (`491:7892` x +2
  y -1 w +11.7 h +2), as on T17, T24 and T25: the heading text style
  draws the name a little wider.
- **Key figures.** The four figures are the library's `KpiTile`, which
  pads 10 and 12 inside a 1 px border with 16 px lines (d-072), where
  Figma pads 11 and 13 with 17 px lines, so each tile is 3 px shorter
  (86 against 89; every `panel · kpi` key is within the tolerance) and
  the panels under them start 3 px higher (gap: KPI tile).
  Each value is as high as Figma's (the `title` style, 20 px), but
  `KpiTile` draws it with tabular figures, so a value with a 1 draws 2
  to 4 px wider than Figma's proportional figures (on M23 `18` is 23 px
  against 21, `Nov 14` 66 against 62) and looks a size larger; the tile
  has no prop for proportional figures or a smaller value (gap: KPI
  tile).
- **Long caption.** The hook's caption `the message broke the rule`
  (491:8077) is 151 px wide in Figma, wider than the 169 px tile's
  content; Figma lets it run to 2 px from the tile's edge. `KpiTile`
  keeps each line inside its padding (143 px) and ends a long one with
  an ellipsis, its full text in a tooltip, so the caption is cut: it is
  not visible in full, and the tile's caption is the `hiddenOverflow`
  finding `[data-figma="panel · kpi rejected"] > dl.kpi-tile__root >
  dd.kpi-tile__caption:nth-of-type(2) > span.truncated-text` (gap: KPI
  tile). The tablet's four tiles stay as wide as Figma's.
- **Bar panels.** Each bar panel is the library's `Panel` with its title
  in capitals and its note at the header's end, over the library's
  `HorizontalBarChart`. Its rows are 24 px apart against Figma's 25,
  since the `small` style's line is 16 px high (d-072), so each panel is
  4 to 6 px shorter. The chart sizes its label column to the panel's
  longest label, where Figma gives every label 150 px (on every panel),
  so the two panels' bars start at different x, and the longest bar
  fills its track up to the count, where Figma's is 440 px long; the
  chart takes no label width or bar room (gap: Activity bar chart). On a
  tablet and the phone the panels stand one under the other, so the
  second starts the first's shortfall higher. `row · day and where` x +2
  y -3 w -4 h -10; `panel · by day` x +2 y -3 w -4 h -5; `panel · where`
  x +2 y -8 w -4 h -5.
- **List rows.** Each row is the library's `ListRow`, 62 px high against
  Figma's 51: it pads 10 inside a 1 px border, draws its meta 4 under
  the title in the `mono` style (Figma: the `small` sans style, 2 under
  it) and sets the chat icon and the chevron at its top, where Figma
  centres them; the icons are 16 px against Figma's 15 and 14. So each
  row is h +11, the panel is taller, the rows after the first drift down
  from the panel's higher start and the tab (`activity`) ends lower by
  what the rows add (gap: Activity chat row). `panel · chats` x +2 y -13
  w -4 h +19; `row · Commit and push private brain` x +2 y -14 w -4 h
  +11; `row · Deep research on evals` x +2 y -11 w -4 h +11; `row ·
  Writer rules, skills, and agents` x +2 y -8 w -4 h +11; `row · Agent
  PR description toolkit pieces` x +2 y -5 w -4 h +11.
  The row's content also starts 11 px right of the panel's title, and
  its chevron ends 11 px left of the end of the header's note (12 to 13
  px with the larger icons), where Figma's row has no side padding and
  its icon, or a round's title, lines up with the title and its chevron
  with the note. The rows sit straight in the `Panel` body, which adds
  no padding, so each row box starts at the panel title's edge; the
  inset is `ListRow`'s 10 px padding inside its 1 px border (gap:
  Activity chat row).
- **Chat taps.** Figma's note says each chat opens as in D18, the chat
  panel of the Activity view. No state draws the Activity view or D18
  yet, so a chat row is not a button: it takes no tap and no focus, and
  its chevron is decorative (`rowTap`). The row gets its tap when D18 is
  built.
- **Device chrome.** Figma's 9:41 status bar, home indicator and round
  device corners are design-only (d-089): the app draws none of them,
  and the checks measure below the status bar (d-102).
