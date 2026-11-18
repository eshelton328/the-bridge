# M01 deviations

What still differs from Figma after fix round 1 of the fidelity loop
(`pnpm fidelity artifacts M01`, 2026-11-17, against the installed library
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
  76 × 48, so the previews look small and the title and meta start 27 px
  left of Figma's (x 77 against 104). No size token is 76; the rows use
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
  row padding and age".

## Values picked (d-100)

- Page: 4 under the status bar and 12 in, as Figma (406:69).
- Rows 2 apart from the header to the groups, as Figma's frames
  (406:70 to 406:114); the search row is padded 8 above its controls
  (406:90, 44 high) and the status 6 above its text (406:110).
- Earlier's header 4 under Found's last row (Figma 2), because the
  phone's rows are 4 shorter than Figma's.
