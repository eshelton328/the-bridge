# D04 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity artifacts D04`, 2026-11-17, against the installed
library 1.0.0-beta.19; checked again 2026-11-18 with 1.0.0-beta.36),
each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`.

## Checks

- Text: passes, as D01: the view switch draws its icons alone
  (`ViewSwitch iconOnly`, library #121). Every string is visible. Each
  "eval" mark counts in its title, description or link. `Toolkit` is an
  `extra` exception (`exceptions.json`).
- Position: 15 of 21 layers pass (`header`, `found status`,
  `button · Add a link`, `list tools`, `view · Grid or List`,
  `group · matches`, `result list`, the three artifact rows and `hint`).
  Six fail (`rail · Toolkit`, `rail · More`, `filter · chips`, `search`,
  `button · Sort`, `button · Filter`); each is listed below.
  The shared navigation's items pass too: `rail · Inbox`,
  `rail · Workspaces`, `rail · Projects` and `rail · Artifacts`.
- Rules: pass.

## Deviations

- **Row previews and row heights.** The previews are `Thumbnail
  size="lg" shape="wide"`, 128 × 72 as Figma's (403:8217, library
  1.0.0-beta.36), so the text starts where Figma's does. Each row is
  96 high against Figma's 98 (`ListRow` pads 10 inside the box's and its
  own 1 px borders, Figma 12 inside one); the rows are 8 apart against
  Figma's 6, so they keep Figma's 104 px pitch and the three rows,
  `result list` (h -2) and `hint` pass. Library gap "List row padding
  and age".
- **Row layout.** The match place, the age and Open sit at the top of the
  row, on the title line; Figma centres them down the row. The row's box
  (border, radius and pane fill) is drawn with the Card's tokens around a
  `ListRow`, as `ListRow` has no border, and its content is 12 in (Figma
  13). Library gap "List row padding and age".
- **New dot.** The cyan dot of the new Skill eval pass rates sits at the
  start of the trailing items, before "in title"; Figma puts it 8 px after
  the title. `ListRow` takes the title as text only. Library gap "New dot in
  a list row".
- **Match place chip.** "in title", "in description" and "in link" are
  `Badge variant="tag"`: a box with the small radius, 6 px sides and
  20 px high, against Figma's round pill with 8 px sides, 21 high. Library
  gap "Match place chip".
- **Search, Sort and Filter.** `search` w -17.4, `button · Sort` x -17.4,
  w +8.4, `button · Filter` x -9, w +4.4, as D01: Sort and Filter pad
  their sides more than Figma's 11 px, and the search and the space
  before the view switch share the free width equally where Figma gives
  the search 22 px more. Library gap "Sort and Filter button widths".
- **Search clear button.** The story focuses the search field, so it
  shows Figma's cyan focus border. The × that clears the search
  (`CloseIcon`, as Figma's `icon/x` 403:8202) is thin and grey; Figma's is
  bold and bright white. `SearchField` sets the clear button's colour and
  takes no tone for it. Library gap "Search clear button".
- **Source chips.** `filter · chips` w +6.8. `FilterChips size="compact"`
  draws Figma's 9 px sides (8 px padding in a 1 px border) and puts the
  chips 6 apart against Figma's 5: 5 ties 4 and 6 on the 4 px grid and the
  tie takes the larger (d-072), so no library change closes it. Library
  gap "Compact chip spacing".
- **Thumbnail colours.** The readme cold-reader chart is cyan and violet,
  not amber. `Thumbnail` draws one colour set per kind. Library gap
  "Thumbnail colour".
- **Page title.** "Artifacts" is 20 px type (`PageHeader size="page"`)
  against Figma's about 24 px, so the title and "3 of 24" are smaller.
  Library gap "Desktop page title size".
- **Nav rail.** Figma's rail has no Toolkit item, so `rail · Toolkit`
  has no layer, and `rail · More` sits 52 px lower (y +52). The design
  predates d-105, which adds the Toolkit (and Artifacts) item; the app
  draws the six-item navigation.
- **Buttons with no screen yet.** Open on each row, Add a link, Sort and
  Filter are buttons with no action on this page yet.

## Values picked (d-100)

Each value with no token is recorded for the library in
`LIBRARY_GAPS.md` and drawn with the library's part until it lands: the
row preview 128 (Figma's, `Thumbnail size="lg"` since beta.36) and
the match pill with 8 px sides, round, 20 high (Figma's sides; 21 on the
4 px grid is 20; drawn `Badge variant="tag"`). The rows are 8 apart (Figma
6, around 2 px shorter rows, so the pitch stays Figma's 104) and
the groups, rows and hint 12 apart (Figma's, spacing `6` and `12`); the
match place, age and Open are 16 apart (Figma's, spacing `16`). The marks
take `Highlight`'s default `strong` variant (cyan, semibold, underlined,
as Figma's), and the hint the `small` text style in `fg.muted`.
