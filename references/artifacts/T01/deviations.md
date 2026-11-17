# T01 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity artifacts T01`, 2026-11-17, against the installed
library 1.0.0-beta.19), each with its reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`. T1 is D1's library on the
iPad mini; most differences are D1's (`../D01/deviations.md`).

## Checks

- Text: fails on one string. `Routes, the RPC client and the owner check
  over Tailscale` (405:220) is cut with an ellipsis in the render, and
  Figma shows it whole (see "Card text column" below). Nothing is missing
  and nothing extra shows. The four strings of the third card row's body
  (405:278, 405:279, 405:302, 405:303) lie under the tab bar in Figma and
  in the render, and Figma cuts the Tailscale description (414:667) with
  an ellipsis; they are `missing` exceptions (`exceptions.json`).
- Position: 13 of 18 layers pass (`header`, `found status`, `list tools`,
  `view · Grid or List`, both groups, the six cards and `tab bar`).
- Rules: fails on one `hiddenOverflow`: the Hono server spike
  description (`[data-figma="artifact card · Hono server spike"] >
  article.card__root > div.card__body:nth-of-type(2) > p.card__description
  > span.truncated-text`), the same cut as the text failure. The scrolling
  pane and the two cut descriptions that Figma also hides (Tailscale,
  versioning) are `hiddenOverflow` exceptions.

## Deviations

- **Card text column.** Hono server spike's description ends "…over
  Tailsc…" in the render and shows whole in Figma (405:220); the rule
  `hiddenOverflow` on its `span.truncated-text` says the same. The cards
  are 346 wide against Figma's 349 (the page keeps 24 px sides on the
  4 px grid, Figma 22, and 16 px between columns, Figma 14, d-100), and
  `Card` pads 16 at the sides against Figma's 14, so the text column is
  312 against 319. Library gap "Card body and line heights".
- **Search, Sort, Filter and Add a link.** `search` w -28.8,
  `button · Sort` x -26.8, w +16.4, `button · Filter` x -10.4, w +12.4,
  `button · Add a link` x -11.2, w +9.2. The tablet's controls are the
  library's 36 px `size="lg"`, which pads 16 at the sides against
  Figma's 11, so each button is wider and the search, which takes the
  free width as in Figma, is narrower. Library gap "Sort and Filter
  button widths".
- **Source chips.** `filter · chips` w +4.2. `FilterChips size="compact"`
  puts the chips 6 apart with 8 px sides; Figma has 5 and 9. Library gap
  "Compact chip spacing".
- **Card heights.** Each card is 287.5 high against Figma's 290, so each
  card row sits up to 2.5 px higher than the one before (within the
  tolerance). Library gap "Card body and line heights".
- **New badge.** New sits 8 px after the card title; Figma puts it at the
  end of the title row. Library gap "Card badge at the end of the title
  row".
- **Page title.** "Artifacts" uses the library's phone title (28 px type,
  `PageHeader size="phone"`), the largest it has; Figma's text box is
  34 high and 110 wide, a little larger. Library gap "Desktop page title
  size".
- **Thumbnails.** The chart bars are a brighter cyan than Figma's muted
  teal-cyan; the ui preview draws a list of lines in its side panel and
  rows where Figma has a plain dark panel and plain rows; the diagram's
  boxes have violet lines in them; the doc previews draw two buttons
  under the lines; and the grid preview's tiles have coloured bars.
  `Thumbnail` draws its own content per kind and takes no colour. Library
  gap "Thumbnail colour".
- **Card kind mark.** The Claude and Codex marks are 12 px against
  Figma's 14. Library gap "Card kind mark size".
- **Tab bar.** The shared tab bar (`AppTabBar device="tablet"`, not
  changed here: another chat holds it) spreads its six tabs over the full
  width; Figma groups them, 76 wide each, in the middle (405:65 to
  405:95, x 150 to 606). The `tab bar` box itself matches.

## Values picked (d-100)

- Page sides: 24 (Figma 22, on the 4 px grid); the header 24 under the
  status bar, as Figma.
- Row gaps: 10 (`spacing.10`), Figma's value, between the header, the
  status, the chips, the tools, the groups and the card rows.
- Card columns: 16 apart (Figma 14, on the 4 px grid; the desktop's
  value).
- Header height: 44 (`sizes.control.xl`), Figma's value (405:106).
- Controls: 36 (`sizes.control.lg`, the library's tablet control), 8 apart
  as Figma.
