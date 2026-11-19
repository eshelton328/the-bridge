# T01 deviations

What still differs from Figma after round 3 of the fidelity loop and a
fix round for the cut card text (`pnpm fidelity artifacts T01`,
2026-11-17, against the installed library 1.0.0-beta.19), each with its
reason. The library gaps are in
`web/src/pages/artifacts/LIBRARY_GAPS.md`. T1 is D1's library on the
iPad mini; most differences are D1's (`../D01/deviations.md`).

Checked again 2026-11-18 with library 1.0.0-beta.36 (`pnpm fidelity
artifacts`): the text, position and rules results did not change.

## Checks

- Text: passes. Hono server spike's description (405:220) shows whole,
  as in Figma. The third card row's body lies under the tab bar in Figma
  and in the render: the library runs under the bar (AppShell
  `tabBarOverlay`, library 1.0.0-beta.26), so its first three strings
  (405:278, 405:279, 405:302) pass. The fourth (405:303) is still not
  seen in full, and Figma cuts the Tailscale description (414:667) with
  an ellipsis; those two are `missing` exceptions (`exceptions.json`).
- Position: 18 of 24 layers pass (`header`, `found status`, `list tools`,
  both groups, the six cards and `tab bar`). `button · Add a link`,
  `filter · chips`, `search`, `button · Sort`, `button · Filter` and
  `view · Grid or List` fail; see below.
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects`, `tab · Artifacts` and
  `tab · More`.
- Rules: pass. The scrolling pane and the two cut descriptions that Figma
  also hides (Tailscale, versioning) are `hiddenOverflow` exceptions.

## Deviations

- **Search, Sort, Filter and Add a link.** `search` w -20.8,
  `button · Sort` x -22.8, w +16.4, `button · Filter` x -6.4, w +12.4,
  `button · Add a link` x -7.2, w +9.2. The tablet's controls are the
  library's 36 px `size="lg"`, which pads 16 at the sides against
  Figma's 11, so each button is wider and the search, which takes the
  free width as in Figma, is narrower. Library gap "Sort and Filter
  button widths".
- **Source chips.** `filter · chips` w +4.2. `FilterChips size="compact"`
  draws Figma's 9 px sides (8 px padding in a 1 px border) and puts the
  chips 6 apart against Figma's 5: 5 ties 4 and 6 on the 4 px grid and the
  tie takes the larger (d-072), so no library change closes it. Library
  gap "Compact chip spacing".
- **Grid or List.** `view · Grid or List` x +6: `ViewSwitch iconOnly
  size="lg"` is 68 wide against Figma's 72 (405:152), and with the page's
  20 px sides its right edge is at 736 against Figma's 734. Library gap
  "Sort and Filter button widths".
- **Cards.** The cards are 352 wide and 290.9 high against Figma's 349
  and 290 (405:167), 20 in and 12 apart against Figma's 22 and 14 (d-100,
  see "Values picked"), so each card sits 1 or 2 px left of Figma's, and
  `Card` pads 16 at the sides against Figma's 14. The text column is 320
  against 319, so the descriptions break where Figma's do. `GroupHeader`
  is 36 high against Figma's 34 (405:159), so the cards are 8 under it,
  not 10, and keep Figma's rows. Library gap "Card body and line
  heights".
- **Page title.** "Artifacts" uses the library's phone title (28 px type,
  `PageHeader size="phone"`), the largest it has; Figma's text box is
  34 high and 110 wide, a little larger. Library gap "Tablet page title
  size".
- **Thumbnails.** The chart bars are a brighter cyan than Figma's muted
  teal-cyan; the ui preview draws a list of lines in its side panel and
  rows where Figma has a plain dark panel and plain rows; the diagram's
  boxes have violet lines in them; the doc previews draw two buttons
  under the lines; and the grid preview's tiles have coloured bars.
  `Thumbnail` draws its own content per kind and takes no colour. Library
  gap "Thumbnail colour".
- **Card kind mark (2026-11-18).** Library beta.51 (#168) draws the
  leading mark of `MetaLine icon="md"` at 16 px, so the Claude and Codex
  marks in the meta line are 16 px against Figma's 14 (d-100: 14 ties
  12 and 16 on the 4 px icon scale, and the tie takes 16). They were 12.

## Values picked (d-100)

- Page sides: 20 (Figma 22, on the 4 px grid; 24 left the cards' text
  column 312 wide and cut Hono server spike's description); the header 24
  under the status bar, as Figma.
- Row gaps: 10 (`spacing.10`), Figma's value, between the header, the
  status, the chips, the tools, the groups and the card rows.
- Card columns: 12 apart (Figma 14, on the 4 px grid). With 20 px sides
  this gives 352 px cards and a 320 px text column inside `Card`'s 16 px
  padding, so the descriptions show as in Figma.
- Group header to cards: 8 (`spacing.8`; Figma 10), because
  `GroupHeader` is 2 px higher than Figma's.
- Header height: 44 (`sizes.control.xl`), Figma's value (405:106).
- Controls: 36 (`sizes.control.lg`, the library's tablet control), 8 apart
  as Figma.
