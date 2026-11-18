# T13 deviations

What still differs from Figma after the fidelity loop (`pnpm fidelity
toolkit T13`, 2026-11-18, against library 1.0.0-beta.36: a first run and
two fix rounds), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillActivityTablet.ts`: D17's data;
writer's `activity` sets `named`, so the back row names the item
(Toolkit › writer) and the kind badge and path rows are left out. Every
other Toolkit frame (the 86 frames built before the Activity tab) gives
the same text, position and rule results as before it, layer by layer.
The frame has no `exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and seen, and nothing
  extra shows.
- Position: 16 of 25 layers pass. The 9 that fail: `button · Discuss` x
  -7.1 y -1 w +2.5 h -2; `toolkit item` x +2 y +32 w -4 h -226; `row ·
  day and where` x +2 y -4 w -4 h -11; `panel · by day` x +2 y -4 w -4 h
  -5; `panel · where` x +2 y -9 w -4 h -6; `panel · chats` x +2 y -15 w
  -4 h +16; `row · Linear workflow setup for NCC team` x +2 y -16 w -4 h
  +11; `row · Brain NC1701 project` x +2 y -13 w -4 h +11; `row · Deep
  research on evals` x +2 y -10 w -4 h +11. Each is explained below.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` holds the back row and the
  item, from y 41 down to the tab bar. In `DetailFrame` the back row is
  the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row and ends with the tab's source line
  (`toolkit item` x +2 y +32 w -4 h -226: the Container pads 24 at the
  sides against 22, so every part of the tab is x +2 w -4). This is the
  d-107 structure that keeps Back in view, as on T16 and T24 (gap:
  Tablet item spacing).
- **Back row.** The back row is 32 px high against Figma's 36 (gap: Item
  action buttons). Discuss is wider than Figma's, so it starts further
  left (`button · Discuss` x -7.1 y -1 w +2.5 h -2).
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
  y -4 w -4 h -11; `panel · by day` x +2 y -4 w -4 h -5; `panel · where`
  x +2 y -9 w -4 h -6.
- **List rows.** Each row is the library's `ListRow`, 62 px high against
  Figma's 51: it pads 10 inside a 1 px border, draws its meta 4 under
  the title in the `mono` style (Figma: the `small` sans style, 2 under
  it) and sets the chat icon and the chevron at its top, where Figma
  centres them; the icons are 16 px against Figma's 15 and 14. So each
  row is h +11, the panel is taller, the rows after the first drift down
  from the panel's higher start and the tab (`activity`) ends lower by
  what the rows add (gap: Activity chat row). `panel · chats` x +2 y -15
  w -4 h +16; `row · Linear workflow setup for NCC team` x +2 y -16 w -4
  h +11; `row · Brain NC1701 project` x +2 y -13 w -4 h +11; `row · Deep
  research on evals` x +2 y -10 w -4 h +11.
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
