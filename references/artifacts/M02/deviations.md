# M02 deviations

What still differs from Figma after the review fix round of the
fidelity loop (`pnpm fidelity artifacts M02`, 2026-11-18, against the
installed library
1.0.0-beta.27), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`. M2 is T2's open artifact on
the phone, on the same page (`screens/ArtifactPage.tsx`,
`layout="phone"`) under a Back bar, over the tab bar with More selected.

## Checks

- Text: passes. Nothing is missing, hidden or extra.
- Position: these layers pass (`top bar`, `button · more`,
  `title block`, `status`, `pill · New`, `chip · Claude`, `preview`,
  `button · Open artifact`, `secondary actions`, `button · Copy link`,
  `button · Discuss`, `tab bar` and the tab bar's five items), and since
  the project chip became a `MetaChipButton` with its chevron (Figma
  406:388) also `chips` and `project · File in a project`: 19 of 23. Four
  fail: `section · MADE IN`, `made in`, `text` and
  `link · Open in workspace`; see below.
  `section · MADE IN`, `made in` and `text` passed before Copy link and
  Discuss became 44 high.
- Rules: pass.

## Deviations

- **Made in lower.** `section · MADE IN` y +6.9, `made in` y +5.9 and
  `text` y +5.9 (x -2): Copy link and Discuss are 4 px taller than
  Figma's (below), and the sections are 16 apart against Figma's 14
  (d-072), so Made in starts about 6 px lower than Figma's.
- **Open in workspace.** `link · Open in workspace` w -4.3, h +7 (y
  +0.9, x -2). Figma's link is mono cyan text 17 high with no padding
  (452:4229); the library has no inline link, so it is a `text` Button,
  24 high with 8 px sides and a sans label. The text column has no gap
  between its lines, so the label sits where Figma's link is (2 px left)
  and the meta line 2 px higher than Figma's, relative to Made in.
  Library gap "Made in on the phone".
- **Made in mark.** The Claude mark is 12 px against Figma's 14
  (406:423); `KindMark` draws 12, 16 or 20. Library gap "Made in on the
  phone".
- **Copy link and Discuss.** The buttons are 44 high against Figma's 40
  (406:412, 406:416), and their icons 16 px against 14. No control
  height is 40; 36 and 44 tie, and the tie takes the larger, the 44 px
  `Button size="xl"` (d-072). This puts Made in lower (above). Library
  gap "Phone secondary action height".
- **Open artifact label.** The label is the button's `label` style
  (Medium 14) against Figma's about 16 px SemiBold (406:408), so it looks
  smaller and lighter. Library gap "Large primary button label".
- **Description.** The description wraps one word later than Figma's:
  its first line ends "with and", where Figma's ends "with" and puts
  "and" on the second line (406:378). `body` is 14/20, and Figma's type
  is a little larger, so Figma's line fills sooner. Library gap "Phone
  artifact description size".
- **Preview.** The chart's bars are the library's `Thumbnail
  kind="chart"` drawing: a brighter cyan and violet, and other heights
  and order than Figma's (406:397 to 406:405); the window bar's dots are
  larger and further apart than Figma's 5 px and 9 (406:393 to 406:395).
  Library gaps "Thumbnail colour" and "Artifact preview frame".
- **⋯ icon.** The ⋯ is `MoreIcon` at 16 px, as Figma's (406:368), but
  its dots are drawn thinner and dimmer than Figma's.
- **Buttons.** The ⋯ button sets `ui.fileOpen` and opens File in a
  project as a sheet (M7). Discuss sets `ui.discussOpen` and opens the
  discussion as its own page (M9). Copy link, Open artifact and Open in
  workspace have no action, as on T2. Back returns to the library (M1).

## Values picked (d-100)

- Page: 4 under the status bar and 12 in, the phone `Container`, as
  Figma (406:360).
- Back bar: the 36 px ⋯ button (`size="lg"`), as Figma; the title block
  16 under it, as Figma.
- Title block rows 8 apart, as Figma (406:370).
- Sections 16 apart (Figma 14; 12 and 16 tie on the 4 px grid and the
  tie takes the larger token, d-072).
- Copy link and Discuss: 44 px `Button size="xl"` (Figma 40; the tie
  takes the larger, d-072), 8 apart, each half the width.
- Made in: the label 8 over the chat (Figma 6 under a 17 px label box;
  the render's label is 16 high).
