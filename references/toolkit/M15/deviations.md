# M15 deviations

What still differs from Figma after the fidelity loop (`pnpm fidelity
toolkit M15`, 2026-11-18, against library 1.0.0-beta.36: a first run and
two fix rounds), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/skillActivityPhone.ts`: T13's data: the
back row names the item (Toolkit › writer) and the title sits over the
tabs. Every other Toolkit frame (the 86 frames built before the Activity
tab) gives the same text, position and rule results as before it, layer
by layer. The frame has no `exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and seen, and nothing
  extra shows.
- Position: 15 of 24 layers pass. The 9 that fail: `button · Discuss` x
  +6 w -8; `toolkit` y +36 h +143; `row · day and where` y -3 h -11;
  `panel · by day` y -3 h -5; `panel · where` y -8 h -6; `panel · chats`
  y -14 h +16; `row · Linear workflow setup for NCC team` y -15 h +11;
  `row · Brain NC1701 project` y -12 h +11; `row · Deep research on
  evals` y -9 h +11. Each is explained below.
- Rules: fail. 2 `hiddenOverflow` findings: `div.backdrop >
  div.app-shell__root > main.app-shell__detail > div.scroll-frame__root
  > div.scroll-frame__body:nth-of-type(2)`; `[data-figma="toolkit"] >
  div.item-tabs__root > div.item-tabs__list:nth-of-type(1)`. Each is
  explained below; this frame takes no exceptions.

## Deviations

- **Item frame.** Figma's `toolkit` holds the back row and the item,
  from y 42 down to the tab bar at y 767. In `DetailFrame` the back row
  is the ScrollFrame's header and the item is the body under it, so the
  article starts under the back row and runs to the tab's source line
  (`toolkit` y +36 h +143), as on M18 and M27 (d-107).
- **Discuss button.** As on M18 and M27: an icon-only `Button` is
  square, so Discuss is `sm`, 28 × 28, against Figma's 36 × 28, and
  starts further right (`button · Discuss` x +6 w -8; gap: Item action
  buttons).
- **Key figures.** The four figures are the library's `KpiTile`, which
  pads 10 and 12 inside a 1 px border with 16 px lines (d-072), where
  Figma pads 11 and 13 with 17 px lines, so each tile is 3 px shorter
  (the phone's 70; every `panel · kpi` key is within the tolerance) and
  the panels under them start 3 px higher (gap: KPI tile). On the phone
  the tiles have no caption, as in Figma (M15 474:1217), and sit two by
  two, 8 apart.
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
  longest label, where Figma gives every label 150 px (120 on the
  phone), so the two panels' bars start at different x, and the longest
  bar fills its track up to the count, where Figma's is 150 px long; the
  chart takes no label width or bar room (gap: Activity bar chart). On a
  tablet and the phone the panels stand one under the other, so the
  second starts the first's shortfall higher. `row · day and where` y -3
  h -11; `panel · by day` y -3 h -5; `panel · where` y -8 h -6.
- **List rows.** Each row is the library's `ListRow`, 62 px high against
  Figma's 51: it pads 10 inside a 1 px border, draws its meta 4 under
  the title in the `mono` style (Figma: the `small` sans style, 2 under
  it) and sets the chat icon and the chevron at its top, where Figma
  centres them; the icons are 16 px against Figma's 15 and 14. So each
  row is h +11, the panel is taller, the rows after the first drift down
  from the panel's higher start and the tab (`activity`) ends lower by
  what the rows add (gap: Activity chat row). `panel · chats` y -14 h
  +16; `row · Linear workflow setup for NCC team` y -15 h +11; `row ·
  Brain NC1701 project` y -12 h +11; `row · Deep research on evals` y -9
  h +11.
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
- **Item tabs.** Figma scrolls the tabs sideways so Activity shows, with
  Overview past the left edge (M15 480:214 at x -71). The library's
  `ItemTabs` does not scroll its selected tab into view, so the page
  sets the list's scroll when the tab's middle is outside it
  (`useTabInView`); Activity then ends at the list's end, where Figma's
  ends 8 px inside it, since each tab is 1.3 to 1.8 px wider (gap: Item
  tab width). The list's sideways scroll is the `hiddenOverflow` finding
  `[data-figma="toolkit"] > div.item-tabs__root >
  div.item-tabs__list:nth-of-type(1)`, as on M18 and M27.
- **Under the tab bar.** Figma draws the tab past the tab bar at y 767;
  the tab bar lies over the page (AppShell `tabBarOverlay`), so the
  tab's foot lies under the bar in the render too, and the item's
  ScrollFrame body scrolls: the `hiddenOverflow` finding `div.backdrop >
  div.app-shell__root > main.app-shell__detail > div.scroll-frame__root
  > div.scroll-frame__body:nth-of-type(2)`, as on M18 and M27.
  Since each list row is 11 px taller and the list starts higher, the
  second row (`row · Brain NC1701 project`) ends under the bar with the
  top of its title and chevron showing above it, cut by the opaque bar,
  where Figma's second row starts with its title at the bar's top, so it
  shows none of it (gap: Activity chat row).
- **Device chrome.** Figma's 9:41 status bar, home indicator and round
  device corners are design-only (d-089): the app draws none of them,
  and the checks measure below the status bar (d-102).
