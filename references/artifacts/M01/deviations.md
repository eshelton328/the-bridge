# M01 deviations

What still differs from Figma after fix round 2 of the fidelity loop
(`pnpm fidelity artifacts M01`, 2026-11-18, against the installed library
1.0.0-beta.27; checked again 2026-11-18 with 1.0.0-beta.36), each with its
reason. The library gaps are in `web/src/pages/artifacts/LIBRARY_GAPS.md`.
M1 is D1's library on the phone as a list of rows
(`screens/LibraryPhone.tsx`, `RowGroup` and `ArtifactRow` with
`layout="phone"`).

## Checks

- Text: passes. The Brain map prototype row (406:277) lies under the tab
  bar in Figma and in the render: the library runs under the bar
  (AppShell `tabBarOverlay`).
- Position: 24 of 25 layers pass (`header`, `button · plus`,
  `list tools`, `search`, `button · Sort`, `button · Filter`,
  `found status`, both groups, the nine artifact rows and the tab bar's
  items). `filter · chips` fails; see below.
- Rules: pass. The scrolling pane is a `hiddenOverflow` exception
  (`exceptions.json`): Figma's library runs to y 875, past the frame's
  bottom edge, under the pinned tab bar, and the render scrolls the same
  way (d-107).

## Deviations

- **Source chips.** `filter · chips` w +4.2, h +2. `FilterChips
  size="compact"` draws Figma's 9 px sides (8 px padding in a 1 px
  border) and puts the chips 6 apart against Figma's 5: 5 ties 4 and 6
  on the 4 px grid and the tie takes the larger (d-072), so the row is
  274.2 wide against 270. FilterChips pads its row 2 above and 2 below
  the chips for the focus ring; the 2 above is Figma's (406:78), and
  `LibraryPhone` takes back the 2 below (`mb: '-2'`), so the search row
  starts 2 under the chips as Figma's; the measured box stays 34 high.
  Library gap "Compact chip spacing".
- **Row previews.** Each row's preview is `Thumbnail size="md"`, 76 × 48
  as Figma's (406:122, library 1.0.0-beta.36), so the title and meta
  start at x 103 against Figma's 104. Figma draws the phone's previews
  for their size, with no window dots and larger cells; `size="md"`
  scales D2's 64 × 40 row drawing, with its dots and smaller cells.
  Library gap "Phone row preview drawing".
- **Preview colours.** The chart's bars are brighter cyan than Figma's
  muted bars, and the drawings take one colour set per kind. Library gap
  "Thumbnail colour".
- **Row height and New.** The rows are 70 high against Figma's 66
  (406:121): `ListRow padding="phone"` pads 10 above and below inside
  its 1 px border around the 48 px preview, where Figma has 8 inside the
  border (its 9 from the row's edge). `RowGroup`'s `mt: -2` starts each row after the first 2 up, so the
  pitch is Figma's 68 and each row starts where Figma's does. Library gap
  "ListRow phone height 70 vs 66". The age sits on the title line and
  New 4 under it in one column at the row's end. At the sides the row's content sits
  where Figma's does: the preview starts at x 17 and the age and New end
  at 373 (Figma 16 and 374), because `ListRow padding="phone"` (library
  1.0.0-beta.39) pads 4 at the sides inside its 1 px border, and the row
  is the list's 366 px.
- **New badge.** New is `Badge tone="working" size="xs"` with
  `SparkFilledIcon size="12"` (library 1.0.0-beta.36): 16 high with a
  filled four-point star in Figma's teal, as Figma's (406:144). It is
  51.3 wide against 48, as its star is 12 px against Figma's 9
  (406:145). Library gap "New badge".
## Values picked (d-100)

- Page: 4 under the status bar and 12 in, as Figma (406:69).
- Rows 2 apart from the header to the groups, as Figma's frames
  (406:70 to 406:114); the search row is padded 8 above its controls
  (406:90, 44 high) and the status 6 above its text (406:110).
- Earlier's group starts 2 up into Found's last row (Figma's header is
  2 under it): the phone's rows are 70 high at Figma's 68 px pitch, so
  Found's last row ends 4 lower than Figma's, and the header is at
  y 501, as Figma's.
- Sort and Filter draw their icons in `fg.muted`, as Figma's grey
  (406:100, 406:107).
