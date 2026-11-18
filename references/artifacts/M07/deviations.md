# M07 deviations

What still differs from Figma after the review fix round of the
fidelity loop (`pnpm fidelity artifacts M07`, 2026-11-18, against the
installed library 1.0.0-beta.27), each with its reason. That round
lined Done up with the sheet's edge and made M2's Copy link and Discuss
44 high, which puts Made in about 6 px lower. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`. M7 is M2's artifact page on
the phone with File in a project open as a sheet over the tab bar
(`FileSheet`); the page under the scrim has M2's differences
(`../M02/deviations.md`).

## Checks

- Text: passes. "Open in workspace ›" is an `extra` exception
  (`exceptions.json`): the link is on M2's page under Made in, and the
  sheet covers it.
- Position: 20 of 28 layers pass (`top bar`, `button · more`,
  `title block`, `status`, `pill · New`, `chip · Claude`, `preview`,
  `button · Open artifact`, `secondary actions`, `button · Copy link`,
  `button · Discuss`, `tab bar` and its five items, `divider`,
  `button · Remove from the library` and `remove note`).
- Rules: pass.

## Failing layers

Render minus Figma, in px. All three checks render the page 38 px
shorter, below Figma's status bar (d-102), and the position check adds
38 to each render y (d-101). The sheet sits at the bottom of the window,
so the shorter choices move everything above them in the sheet down.

- `sheet body`: y +43, h -43.
- `artifact name`: y +43 (h -1).
- `chips`: w -15.6.
- `project · File in a project`: w -16.8.
- `section · MADE IN`: y +6.9, h +20.
- `made in`: y +5.9, h +21.
- `text`: y +5.9, h +21 (x -2).
- `link · Open in workspace`: no layer of that name in M7.

## Deviations: the sheet

- **Choice rows.** The five choices are 36 px high against Figma's 44
  (407:1054 to 407:1079), still 2 apart, so the sheet is 43 px shorter:
  its title row, the artifact's title (`artifact name` y +43) and the top
  of `sheet body` (y +43, h -43) sit lower than Figma's, while the rule,
  Remove and the note are where Figma has them. `OptionList` has no
  44 px row without a description. Library gap "Sheet choice rows".
- **Project names.** ncc-1701, omni, omni-brain and skill-evals are in
  the sans `label` style; Figma draws them in mono, about 14 px, and Not
  in a project in sans. `OptionList` takes one label style for the whole
  list, and its mono is 12/16. Library gap "Sheet choice rows".
- **Folders.** The folders are 16 px against Figma's 15 (407:1062), grey,
  and cyan on the checked project, as Figma's.
- **Remove.** Remove is a 44 px `dangerText` button the sheet's width;
  its trash is 16 px and 6 from the label against Figma's 15 px and 10
  (407:1089 to 407:1091), within the tolerance.
- **Artifact title.** The artifact's title under the sheet's title is
  `small` (12/16), 16 high against Figma's 17 (407:1060).

## Deviations: the page under the scrim (as M2)

- **Made in.** `section · MADE IN` y +6.9 and `made in` and `text`
  y +5.9: Copy link and Discuss are 44 high (below), as in M2.
  `section · MADE IN` h +20, `made in` h +21 and `text` h +21, and the
  extra `link · Open in workspace`: the page is M2's,
  which puts Open in workspace as a link under the meta line (M2
  452:4229). Figma's M7 copy of the page has no link there. The sheet
  covers Made in in both, so a viewer sees no difference. The page stays
  M2's, so the ⋯ button opens the sheet over the same page.
- **Project chip.** `project · File in a project` w -16.8 and `chips`
  w -15.6: the project chip is a read-only `MetaChip` with no chevron
  (407:973), as in M2. Library gap "Project chip menu".
- **Page parts.** As M2: the description's first line ends one word
  later than Figma's ("with and" against "with"), the Open artifact
  label is smaller, Copy link and Discuss are 44 high against Figma's 40
  (407:997, 407:1001; 36 and 44 tie, and the tie takes the larger, d-072),
  and
  the chart's bars are the library's colours and heights. Library gaps
  "Phone artifact description size", "Large primary button label",
  "Phone secondary action height", "Made in on the phone", "Thumbnail
  colour" and "Artifact preview frame".
- **Device chrome.** The status bar (9:41), the home indicator
  (407:1053) and the screen corners are not drawn (d-089); the checks
  measure the render 38 px shorter, under Figma's status bar (d-102).

## Values picked (d-100)

- Done: the `text` Button reaches 8 past the title row's end, so its
  label ends at x 372, 1 px inside Figma's 373 (407:1100).
- Spacing: the artifact's title, the choices, the rule, Remove and the
  note are 2 apart, and the body ends 8 under the note, as Figma's
  (407:1101 ends at 809, the note at 801).
- Focus: the sheet opens with the focus on the sheet itself, so no
  choice shows a focus ring, as Figma draws none.
- Width: `ArtifactsScreen` draws the sheet over an open artifact at any
  width when a state sets `ui.fileOpen`, so the story shows it at the
  width Storybook gives it. Only the phone's ⋯ button opens it; the
  desktop's project chip menu is a library gap ("Project chip menu").
- Picking a project sets `ui.fileProject` and checks it; Done, the scrim
  and Escape close the sheet. Remove has no action yet, as the desktop's
  Remove (D2) has none; the note says what it will do.
