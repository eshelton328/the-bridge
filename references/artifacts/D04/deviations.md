# D04 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity artifacts D04`, 2026-11-17, against the installed
library 1.0.0-beta.8), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`.

## Checks

- Text: fails on two extra strings, `Grid` and `List` (see "View
  switch"), as D01. Nothing is missing and every string is visible. Each
  "eval" mark counts in its title, description or link. `Toolkit` is an
  `extra` exception (`exceptions.json`).
- Position: 5 of 15 layers pass (`header`, `found status`,
  `button · Add a link`, `list tools`, `group · matches`). Ten fail;
  each is listed below.
- Rules: pass.

## Deviations

- **Row previews and row heights.** `artifact row · Skill eval pass rates`
  h -14, `artifact row · readme cold-reader run` y -12, h -14,
  `artifact row · Writer cross-family round x1` y -26, h -14,
  `result list` h -42 and `hint` y -40. Figma's previews are 128 × 72;
  no size token is 128, so each preview is a 44 px wide `Thumbnail
  shape="wide"` (`control.xl`, as D2's row previews), 24.75 high. The
  text column (60 px) then sets the row's height: each row is 84 high
  against Figma's 98, so each row after the first starts 14 px higher than
  the one before it, and the hint follows them up. The text starts about
  91 px further left than Figma's (x 162 against 253: 16 px after a
  128 px preview there, 10 after 44 here). Library gap "List row thumbnail".
- **Row layout.** The match place, the age and Open sit at the top of the
  row, on the title line; Figma centres them down the row. The row's box
  (border, radius and pane fill) is drawn with the Card's tokens around a
  `ListRow`, as `ListRow` has no border, and its content is 12 in (Figma 13).
  Library gap "List row padding and age".
- **New dot.** The cyan dot of the new Skill eval pass rates sits at the
  start of the trailing items, before "in title"; Figma puts it 8 px after
  the title. `ListRow` takes the title as text only. Library gap "New dot in
  a list row".
- **Match place chip.** "in title", "in description" and "in link" are
  `Badge variant="tag"`: a box with the small radius, 6 px sides and
  20 px high, against Figma's round pill with 8 px sides, 21 high. Library
  gap "Match place chip".
- **View switch.** `view · Grid or List` x -70.9, w +70.9, as D01: the
  switch shows "Grid" and "List" beside its icons (the text check's extra
  `Grid` and `List`) and is 139 px wide against 68. List is selected, as
  Figma's. Library gap "Icon-only view switch".
- **Search, Sort and Filter.** `search` w -52.9, `button · Sort` x -52.9,
  w +8.4, `button · Filter` x -44.4, w +4.4, as D01: the wider view switch
  takes 71 px of the search's width, so Sort and Filter sit further left,
  and both pad their sides more than Figma's 11 px. Library gaps "Icon-only
  view switch" and "Sort and Filter button widths".
- **Search clear button.** The story focuses the search field, so it
  shows Figma's cyan focus border. The × that clears the search
  (`CloseIcon`, as Figma's `icon/x` 403:8202) is thin and grey; Figma's is
  bold and bright white. `SearchField` sets the clear button's colour and
  takes no tone for it. Library gap "Search clear button".
- **Source chips.** `filter · chips` w +6.8: the chips are 6 apart with
  8 px sides against Figma's 5 and 9. Library gap "Compact chip spacing".
- **Thumbnail colours.** The readme cold-reader chart is cyan and violet,
  not amber. `Thumbnail` draws one colour set per kind. Library gap
  "Thumbnail colour".
- **Page title.** "Artifacts" is 20 px type (`PageHeader size="page"`)
  against Figma's about 24 px, so the title and "3 of 24" are smaller.
  Library gap "Desktop page title size".
- **Rail.** The rail's items are 60 px apart against Figma's 56, so each
  item after Inbox sits lower, and the shared rail (`AppRail`, not changed
  here: another chat holds the navigation) has a Toolkit item after
  Artifacts (d-105), which this frame does not draw, so More sits one item
  lower still. Library gap "Rail item height".
- **Buttons with no screen yet.** Open on each row, Add a link, Sort and
  Filter are buttons with no action on this page yet.

## Values picked (d-100)

Each value with no token is recorded for the library in
`LIBRARY_GAPS.md` and drawn with the library's part until it lands: the
row preview 128 (Figma's, on the 4 px grid; drawn 44, `control.xl`) and
the match pill with 8 px sides, round, 20 high (Figma's sides; 21 on the
4 px grid is 20; drawn `Badge variant="tag"`). The rows are 6 apart and
the groups, rows and hint 12 apart (Figma's, spacing `6` and `12`); the
match place, age and Open are 16 apart (Figma's, spacing `16`). The marks
take `Highlight`'s default `strong` variant (cyan, semibold, underlined,
as Figma's), and the hint the `small` text style in `fg.muted`.
