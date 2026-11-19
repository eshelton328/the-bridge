# D04 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity artifacts D04`, 2026-11-17, against the installed
library 1.0.0-beta.19; checked again 2026-11-18 with 1.0.0-beta.36 and
2026-11-19 with 1.0.0-beta.69),
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

- **Rail Artifacts icon.** Figma draws it in a 20 px frame (414:950); its
  other rail icons are 22 px. The shared `AppRail` draws every item's
  icon at 24 (`NavRail`, d-100), so the 22 px ones pass the iconSize
  check (2 px slack) and this one does not. A position exception
  names 414:950 (2026-11-19, the same decision on every page's rail).
- **Row previews and row heights.** The previews are `Thumbnail
  size="lg" shape="wide"`, 128 × 72 as Figma's (403:8217, library
  1.0.0-beta.36). Since library 1.0.0-beta.39 (#147) each row is
  `ListRow surface="card" padding="lg"`: the pane fill in a 1 px
  `border.default` border, padded 12, 98 high and 6 apart, as Figma's
  (403:8216), and the three rows, `result list` and `hint` pass.
- **Row layout.** The match place, the age and Open are centred down the
  row, as Figma's (`trailingAlign="center"`, library 1.0.0-beta.39). Since
  library 1.0.0-beta.42 the text starts 16 after the preview, as Figma's
  (`leadingGap="16"`: the preview ends at x 237 and the title starts at
  253, 403:8217 and 403:8232), and the text is centred down the row
  (`bodyAlign="center"`). The render's text is 60 high against Figma's
  62 px frame (403:8230), so it starts 19 under the row's top against
  Figma's 18.
- **New dot.** None left: since library 1.0.0-beta.39 (#147) the cyan
  dot of the new Skill eval pass rates is `ListRow dot="working"`, 8 px
  after the title, as Figma's (403:8233).
- **Match place chip.** "in title", "in description" and "in link" are
  `Badge variant="tag"`: a box with the small radius, 6 px sides and
  20 px high, against Figma's round pill with 8 px sides, 21 high. Library
  gap "Match place chip".
- **Search, Sort and Filter.** `search` w -11.4, `button · Sort` x -11.4,
  `button · Filter` x -11, as D01: Sort (108.4) and Filter (75.4) take
  `padding="compact"` and are Figma's widths, but the search and the
  space before the view switch share the free width equally where Figma
  gives the search 22 px more, so the search is 554.1 wide against 565.5.
  Library gap "Sort and Filter button widths".
- **Search clear button.** The state opens with the focus in the search
  field (`ui.searchFocus`), so it shows Figma's cyan focus border. The × that clears the search
  (`CloseIcon`, as Figma's `icon/x` 403:8202) is thin and grey; Figma's is
  bold and bright white. `SearchField` sets the clear button's colour and
  takes no tone for it. Library gap "Search clear button".
- **Source chips.** `filter · chips` w +6.8. `FilterChips size="compact"`
  draws Figma's 9 px sides (8 px padding in a 1 px border) and puts the
  chips 6 apart against Figma's 5: 5 ties 4 and 6 on the 4 px grid and the
  tie takes the larger (d-072), so no library change closes it. Library
  gap "Compact chip spacing".
- **Thumbnail colours.** The readme cold-reader chart is amber, as
  Figma's (403:8248, `Thumbnail tone`, library 1.0.0-beta.68); every
  third bar stays violet. Library gap "Thumbnail colour".
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
