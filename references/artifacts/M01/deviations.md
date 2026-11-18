# M01 deviations

What still differs from Figma after fix round 2 of the fidelity loop
(`pnpm fidelity artifacts M01`, 2026-11-18, against the installed library
1.0.0-beta.27), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`. M1 is D1's library on the
phone as a list of rows (`screens/LibraryPhone.tsx`, `RowGroup` and
`ArtifactRow` with `layout="phone"`).

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
  size="compact"` puts the chips 6 apart with 8 px sides; Figma has 5
  and 9, so the row is 274.2 wide against 270. FilterChips also pads its
  row 2 below the chips, where Figma's frame ends; the search row follows
  with no gap, so it stays where Figma has it. Library gap "Compact chip
  spacing".
- **Row previews.** Each row's preview is 44 × 27.5 against Figma's
  76 × 48, so the previews look small and the title and meta start 33 px
  left of Figma's (x 71 against 104). No size token is 76; the rows use
  D2's `control.xl` width. Library gap "List row thumbnail".
- **Preview drawings.** The previews are `Thumbnail shape="compact"`'s
  own drawings, cropped and scaled: the chart's bars are brighter cyan,
  the ui preview is a list of lines, the diagram's boxes are small and
  the grid's cells touch. Figma draws row-size previews with muted bars,
  a side panel with green tags, four violet boxes and two rows of three
  outlined cells. Library gap "Thumbnail colour".
- **Row height and New.** The rows are 62 high, 6 apart, against Figma's
  66, 2 apart (the pitch is Figma's 68, so each row starts where Figma's
  does). The text is 11 from the row's top against 13. New is
  `Badge size="sm"`, 20 high against Figma's 16, so the age and New sit
  4 apart in one column at the row's end, the age 3 px higher than
  Figma's. `ListRow` pads 10 and has no 16 px badge. Library gap "List
  row padding and age". At the sides the row's content now sits where
  Figma's does: the preview starts at x 17 and the age and New end at
  373 (Figma 16 and 374), because the row takes `ListRow`'s extra 6 px
  outside the list's padding, as the Inbox's phone rows do.
- **New badge.** New is `Badge tone="working" size="sm"` with
  `SparkIcon`: the same teal fill as Figma's (#152c3b against #142a37),
  but 57 × 20 against Figma's 48 × 16 (406:144), and its spark is a
  12 px outline where Figma draws a filled four-point star of 9 px
  (406:145). The library has no filled spark icon and no 16 px badge.
  Library gap "New badge".

## Values picked (d-100)

- Page: 4 under the status bar and 12 in, as Figma (406:69).
- Rows 2 apart from the header to the groups, as Figma's frames
  (406:70 to 406:114); the search row is padded 8 above its controls
  (406:90, 44 high) and the status 6 above its text (406:110).
- Earlier's header 6 under Found's last row (Figma 2): the phone's
  rows are 62 high at Figma's 68 px pitch, so Found's last row ends 3
  higher than Figma's and the header needs 5 to stay where Figma's is;
  4 and 6 tie, and the tie takes the larger (d-072). The header is at
  y 502 against Figma's 501.
- Sort and Filter draw their icons in `fg.muted`, as Figma's grey
  (406:100, 406:107).
