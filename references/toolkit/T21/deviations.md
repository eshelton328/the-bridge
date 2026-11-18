# T21 deviations

What still differs from Figma after the fidelity loop (`pnpm fidelity
toolkit T21`, 2026-11-18, against library 1.0.0-beta.36: a first run and
two fix rounds), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/agentActivityTablet.ts`: D22's data,
opened from writer as on T7 and T25 (Toolkit › writer ›
writing-reviewer). Every other Toolkit frame (the 86 frames built before
the Activity tab) gives the same text, position and rule results as
before it, layer by layer. The frame has no `exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and seen, and nothing
  extra shows.
- Position: 19 of 31 layers pass. The 12 that fail: `button · Discuss` x
  -5.1 y -1 w +2.5 h -2; `toolkit item` x +2 y +32 w -4 h -122;
  `491:7049` x +2 y -3 w +14.7 h +2; `activity` x +2 y -2 w -4 h +5;
  `row · day and where` x +2 y -5 w -4 h -10; `panel · by day` x +2 y -5
  w -4 h -6; `panel · where` x +2 y -11 w -4 h -4; `panel · chats` x +2
  y -15 w -4 h +19; `row · NCC-1701 Figma toolkit page` x +2 y -16 w -4
  h +11; `row · Brain NC1701 project` x +2 y -13 w -4 h +11; `row ·
  Writer rules, skills, and agents` x +2 y -10 w -4 h +11; `row · Deep
  research on evals` x +2 y -7 w -4 h +11. Each is explained below.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` holds the back row and the
  item, from y 41 down to the tab bar. In `DetailFrame` the back row is
  the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row and ends with the tab's source line
  (`toolkit item` x +2 y +32 w -4 h -122: the Container pads 24 at the
  sides against 22, so every part of the tab is x +2 w -4). This is the
  d-107 structure that keeps Back in view, as on T16 and T24 (gap:
  Tablet item spacing).
- **Back row.** The back row is 32 px high against Figma's 36 (gap: Item
  action buttons). Discuss is wider than Figma's, so it starts further
  left (`button · Discuss` x -5.1 y -1 w +2.5 h -2).
- **Title width.** The title renders wider than Figma's (`491:7049` x +2
  y -3 w +14.7 h +2), as on T17, T24 and T25: the heading text style
  draws the name a little wider.
- **Key figures.** The four figures are the library's `KpiTile`, which
  pads 10 and 12 inside a 1 px border with 16 px lines (d-072), where
  Figma pads 11 and 13 with 17 px lines, so each tile is 3 px shorter
  (86 against 89; every `panel · kpi` key is within the tolerance) and
  the panels under them start 3 px higher (gap: KPI tile).
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
  y -5 w -4 h -10; `panel · by day` x +2 y -5 w -4 h -6; `panel · where`
  x +2 y -11 w -4 h -4.
- **List rows.** Each row is the library's `ListRow`, 62 px high against
  Figma's 51: it pads 10 inside a 1 px border, draws its meta 4 under
  the title in the `mono` style (Figma: the `small` sans style, 2 under
  it) and sets the chat icon and the chevron at its top, where Figma
  centres them; the icons are 16 px against Figma's 15 and 14. So each
  row is h +11, the panel is taller, the rows after the first drift down
  from the panel's higher start and the tab (`activity`) ends lower by
  what the rows add (gap: Activity chat row). `activity` x +2 y -2 w -4
  h +5; `panel · chats` x +2 y -15 w -4 h +19; `row · NCC-1701 Figma
  toolkit page` x +2 y -16 w -4 h +11; `row · Brain NC1701 project` x +2
  y -13 w -4 h +11; `row · Writer rules, skills, and agents` x +2 y -10
  w -4 h +11; `row · Deep research on evals` x +2 y -7 w -4 h +11.
- **Chat taps.** Figma's note says each chat opens as in D18, the chat
  panel of the Activity view. No state draws the Activity view or D18
  yet, so a chat row is not a button: it takes no tap and no focus, and
  its chevron is decorative (`rowTap`). The row gets its tap when D18 is
  built.
- **Device chrome.** Figma's 9:41 status bar, home indicator and round
  device corners are design-only (d-089): the app draws none of them,
  and the checks measure below the status bar (d-102).
