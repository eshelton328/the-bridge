# M02 deviations

What still differs from Figma after fix round 3 of the fidelity loop
(`pnpm fidelity artifacts M02`, 2026-11-17, against the installed library
1.0.0-beta.27), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`. M2 is T2's open artifact on
the phone, on the same page (`screens/ArtifactPage.tsx`,
`layout="phone"`) under a Back bar, over the tab bar with More selected.

## Checks

- Text: passes. Nothing is missing, hidden or extra.
- Position: 20 of 23 layers pass (`top bar`, `button · more`,
  `title block`, `status`, `pill · New`, `chip · Claude`, `preview`,
  `button · Open artifact`, `secondary actions`, `button · Copy link`,
  `button · Discuss`, `section · MADE IN`, `made in`, `text`, `tab bar`
  and the tab bar's five items). Three fail: `chips`,
  `project · File in a project` and `link · Open in workspace`; see
  below.
- Rules: pass.

## Deviations

- **Project chip.** `project · File in a project` w -16.8, `chips`
  w -15.6. The project chip is a read-only `MetaChip` with no chevron
  (Figma 406:388), so it is narrower, and it does not open File in a
  project; the ⋯ button does. Library gap "Project chip menu".
- **Open in workspace.** `link · Open in workspace` y -7.1, w -4.3,
  h +7. Figma's link is mono cyan text 17 high with no padding
  (452:4229); the library has no inline link, so it is a `text` Button,
  24 high with 8 px sides and a sans label. The text column has no gap
  between its lines, so the label sits where Figma's link is (2 px left)
  and the meta line 2 px higher than Figma's. Library gap "Made in on the
  phone".
- **Made in mark.** The Claude mark is 12 px against Figma's 14
  (406:423); `KindMark` draws 12, 16 or 20. Library gap "Made in on the
  phone".
- **Copy link and Discuss.** The buttons are 36 high against Figma's 40
  (406:412, 406:416), and their icons 16 px against 14. No control
  height is 40; 36 and 44 tie, and 44 put Made in 7 px lower than
  Figma's, so the page uses 36 (d-100). Library gap "Phone secondary
  action height".
- **Open artifact label.** The label is the button's `label` style
  (Medium 14) against Figma's about 16 px SemiBold (406:408), so it looks
  smaller and lighter. Library gap "Large primary button label".
- **Description.** The description wraps after "with and" against
  Figma's "with" (406:378): `body` is 14/20 and Figma's type is a little
  larger. Library gap "Phone artifact description size".
- **Preview.** The chart's bars are the library's `Thumbnail
  kind="chart"` drawing: a brighter cyan and violet, and other heights
  and order than Figma's (406:397 to 406:405); the window bar's dots are
  larger and further apart than Figma's 5 px and 9 (406:393 to 406:395).
  Library gaps "Thumbnail colour" and "Artifact preview frame".
- **⋯ icon.** The ⋯ is `MoreIcon` at 16 px, as Figma's (406:368), but
  its dots are drawn thinner and dimmer than Figma's.
- **Buttons with no screen yet.** The ⋯ button sets `ui.fileOpen`; File
  in a project (M7) is a later frame. Discuss sets `ui.discussOpen`; the
  phone's discussion page (M9) is a later frame, so the artifact's page
  stays. Copy link, Open artifact and Open in workspace have no action,
  as on T2. Back returns to the library (M1).

## Values picked (d-100)

- Page: 4 under the status bar and 12 in, the phone `Container`, as
  Figma (406:360).
- Back bar: the 36 px ⋯ button (`size="lg"`), as Figma; the title block
  16 under it, as Figma.
- Title block rows 8 apart, as Figma (406:370).
- Sections 16 apart (Figma 14; 12 and 16 tie on the 4 px grid and the
  tie takes the larger token, d-072).
- Copy link and Discuss: 36 px `Button size="lg"`, 8 apart, each half
  the width.
- Made in: the label 8 over the chat (Figma 6 under a 17 px label box;
  the render's label is 16 high).
