# M06 deviations

What still differs from Figma after fix round 2 of the fidelity loop
(`pnpm fidelity artifacts M06`, 2026-11-18, against the installed library
1.0.0-beta.27), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`. M6 is M1's library on the
phone with D5's Add a link form open as a sheet over the tab bar
(`AddLinkSheet`, which holds the same `AddLinkFields` as D5's
`AddLinkDialog`); the library under the scrim has M1's differences
(`../M01/deviations.md`), and the form has D5's (`../D05/deviations.md`).

## Checks

- Text: passes.
- Position: 25 of 30 layers pass (`header`, `button · plus`,
  `list tools`, `search`, `button · Sort`, `button · Filter`,
  `found status`, both groups, the artifact rows, `tab bar` and its
  items, and `field · Project`).
- Rules: pass. The scrolling pane is a `hiddenOverflow` exception
  (`exceptions.json`), as in M1, M3 and M4: Figma's library runs to
  y 875, under the pinned tab bar, and the render scrolls the same way
  (d-107).

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101). The sheet sits at the bottom of the window,
so a field that is shorter than Figma's moves every field above it down:
the Project field passes and the offsets grow towards the top.

- `filter · chips`: x +0, y +0, w +4.2, h +2.
- `field · Link`: y +19, h -6.
- `field · Source`: y +15, h -10.
- `segmented · Source`: y +11, h -6 (w -3, within the tolerance).
- `field · Title`: y +7, h -5.

## Deviations: the sheet

- **Field labels.** "Link", "Source", "Title" and "Project" are `small`
  (12/16) in grey, `TextField`'s label, against Figma's Medium 14 in the
  default text colour, 20 high. Each field is 4 px shorter: `field · Link`
  h -6 (the label 4 and the two-line hint 32 against 34), `field · Title`
  h -5 and part of `field · Source` h -10. Library gap "Field label style".
- **Source choice.** Claude artifact and Codex site sit side by side at
  the start of the field, each as wide as its label, in a 36 px switch
  (`ViewSwitch size="lg"`) with 12 px kind marks; Figma's two options
  fill a 359 × 42 control, 174 px each, with 14 px marks.
  `segmented · Source` h -6 (its box is the field's width), and
  the rest of `field · Source` h -10. Codex site is selected, as Figma's.
  Library gap "Segmented control full width".
- **Field spacing.** The description and the fields are 16 apart against
  Figma's 14: no spacing token is 14, and a tie takes the larger token
  (d-072). With the shorter labels and switch this gives the y offsets of
  `field · Link` (+19), `field · Source` (+15), `segmented · Source`
  (+11) and `field · Title` (+7). Library gap "Sheet form spacing".
- **Inputs.** The link has no link icon before it, and the link and the
  project are in the body font, not mono; the link shows in full where
  Figma cuts it with an ellipsis. Library gap "Text field height, icon
  and mono value".
- **Project.** The project is a button with the folder, "ncc-1701" and a
  chevron at the end, which opens a menu of the projects (`RadioMenu`):
  its fill is the raised button fill, not the input's inset fill. Library
  gap "Select field".
- **Title row.** Cancel and Add are the library's cyan `text` buttons;
  Figma draws Add bolder than Cancel. The title row sits about 18 px
  lower than Figma's, as the whole sheet is shorter (above).
- **Link focus.** The link field has the focus when the sheet opens, with
  the cyan border, as Figma draws it, and the caret after the link, as
  D5's dialog.

## Deviations: the library under the scrim (as M1)

- **Source chips.** `filter · chips` w +4.2, as M1, M3 and M4: the chips
  are 6 apart with 8 px sides against Figma's 5 and 9. Library gap
  "Compact chip spacing".
- **Rows.** The previews are smaller and drawn by `Thumbnail
  shape="compact"` in one colour set per kind, and the rows are 62 high
  with New as a 20 px badge. Library gaps "List row thumbnail", "List
  row padding and age" and "Thumbnail colour".
- **Device chrome.** The status bar (9:41), the home indicator (408:700)
  and the screen corners are not drawn (d-089); the checks measure the
  render 38 px shorter, under Figma's status bar (d-102). Figma draws no
  keyboard in M6.

## Values picked (d-100)

- Form spacing: 16 between the description and the fields (Figma 14,
  d-072).
- Inset: the description and the fields sit 4 in from the sheet's
  padding, at x 17 as Figma's, the same as the title row.
- Hints: the phone's form has no line under Source or Project and a
  one-line description, as Figma's; the form's schema makes those lines
  optional, and D5 keeps its own.
- Focus: the sheet opens with the focus in the link field, as D5's
  dialog.
