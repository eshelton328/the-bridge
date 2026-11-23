# D13 deviations

What still differs from Figma after round 2 of the fidelity loop
(`pnpm fidelity toolkit D03 D07 D14 D37 T07 M19 D13`, 2026-11-17, against
the installed library 1.0.0-beta.25), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/workflowFullPage.ts`: D8's data
(`workflowOpen`) with the workflow's `flowPage`, its D13 description and
when it changed, opened full page on How it works with step 4 selected.
D03, D07, D14, D37, T07 and M19 give the same results as before D13 (each
report's text, position and rule results are unchanged). The frame's
`exceptions.json` holds only icon sizes (Deviations).

## Checks

- Text: pass. Every Figma string is in the render and visible; no text is
  covered and no render text is extra.
- Position: 49 of 52 layers pass, among them the rail items, the
  breadcrumb row, Discuss, the meta row, the kind badge, the title
  (`446:513`), the path row and badge, the flow panel, its header and
  legend, `flow`, all nine step cards, `new failure`, the details row,
  its three panels, the seven fields, the three gates and the four
  rounds. Three fail:
  - `button · Show on map`: h -6 (32 against Figma's 38).
  - `446:514`: w +284 (the description is 1384 wide against 1100).
  - `stop · skill-eval-cases`: h +7 (38 against Figma's 31).
- Rules: pass.

## Deviations

- **Show on map.** The button is 32 px high against Figma's 38
  (`button · Show on map` h -6), and Discuss 32 against 36: `Button` is 32
  high at `md`; `lg` is 36 high but 145 wide against Figma's 136 (gap:
  Item action buttons). The breadcrumb row takes the tablet control
  height (36, Figma 38), so the buttons sit within 2 px of Figma's y.
- **Description.** Figma wraps the description at 1100 px, after
  "stages:", into two lines; no size token has 1100, so the render runs
  it across the page's width on one line (`446:514` w +284; gap: Workflow
  page description). 20 px under it keep the flow and every row under it
  at Figma's y.
- **Stop box.** The stop under the gate is 38 px high against 31
  (`stop · skill-eval-cases` h +7) and has the needs-you tint:
  `Panel variant="notice" tone="needsYou"` pads 10/12 where Figma has
  7/11 (gap: Workflow page flow).
- **Connectors.** The library draws each connector (library #133 and
  #137): `FlowLine` between stages, `FlowBranch` into and out of steps 4
  and 5, the gate's way out as an amber `FlowLine` down with `no` beside
  it, and the dashed `FlowLoop` from Owner decides back into the stop's
  side, placed by CSS anchors. Each tip ends 2 px (the loop's 4 px)
  before its card or the stop, as Figma's. The connector columns are 20
  wide, so the cards are 20 apart against Figma's 22 (no token has 22)
  and each line is 18 long against 20; all nine cards pass. The loop's
  label `new failure` is drawn by the page under the step it names, as
  Figma's (x 992), since `FlowLoop` centres its label on the line (gap:
  Workflow page flow). The loop meets the stop's middle, 4 px lower than
  Figma's as the stop is 38 high against 31.
- **Step cards.** The cards are drawn with the FlowDiagram card's tokens
  (gap: Workflow page flow): 126 px high against 128, with 14 px titles
  (`label`) against Figma's 13 and the mark a 22 px `Badge` against 19.
  All nine pass the position check. The selected card (step 4) has the
  selected fill as well as the cyan border.
- **Legend swatches.** The swatches are 12 px squares (`icon.12`)
  against Figma's 9 (no size token has 9), 4 before their word; all four
  legend items pass.
- **Selected step's panel.** `Panel tone="accent"` gives the panel the
  selected fill as well as the cyan border Figma draws on the pane fill.
  The field labels' column is as wide as the longest label with the
  values 40 after it, where Figma has an 80 px column and 10 (no size
  token has 80; gap: Workflow page details); the values start within a
  few px of Figma's x. The field rows are 26 apart against 27 (`small`
  is 16 high on the 4 px grid against Figma's 17), so the list starts 4
  lower and every row is within 3 px.
- **Rounds.** The round rows are drawn with the card tokens (gap:
  Workflow page details), 30 px high against 31; all four pass.
- **Breadcrumb.** The breadcrumb is `BackRow` (Toolkit, 16 px label and
  18 px chevron against Figma's 14 px label and 16 px icon) and the
  crumbs as text in `labelLg` (gap: Item breadcrumb), so the crumbs are a
  little larger than Figma's.
- **Item tabs.** As in D14: the selected tab's outline is
  `border.selected` at half alpha where Figma's is solid cyan (d-050).
- **Other tabs.** Overview opens the workflow's D8 Overview on the same
  page; Files, Links, Evals and Activity show empty panels: they are
  later frames.
- **Rail Artifacts icon.** Figma draws `icon/artifacts` at 20 px (446:137)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 446:137 (bridge-coord's shared decision, 2026-11-19).
- **Rail Toolkit icon.** Figma draws `icon/toolkit` at 20 px (446:142)
  where the other rail icons are 22; the shared AppRail draws every item's
  icon at 24 (d-100), so the render's icon is 24 and `exceptions.json`
  names 446:142, as for `icon/artifacts`.

## Second review

A blind side-by-side review of D13 found three differences (F1 to F3).
After the fix, `pnpm fidelity toolkit D13 T08 D14 T07 M19` (2026-11-17,
library 1.0.0-beta.26) gives D13 the same results as above: text and
rules pass, and position fails on the same three keys
(`button · Show on map`, `446:514`, `stop · skill-eval-cases`). T08, D14,
T07 and M19 keep their results.

- **F2, header rows (fixed).** Figma's meta row, title, path row, tabs
  and description are 14 apart; the render had 12, so the path row sat at
  164 against 168 and the tabs 6 higher. No space token has 14: the page
  now keeps the gap's 12 and adds 2 above each row after the first, and
  the breadcrumb row's foot space is 2. The path row is at 168 (Figma
  168), the tabs at 210 (Figma 208), and the description 14 under the
  tabs (Figma 14), at 256 (Figma 255). The flow panel stays at 310 and the
  details row at 716.
- **F3, details panels (not fixed).** The step, gates and rounds panels
  are 246 px high against Figma's 242, so they end 4 px lower, with 13 px
  under the last field against Figma's 4. Figma's last field
  (`field · If it fails` 446:644) ends 4 over the panel's foot, where
  `Panel` pads 12 and scrolls content that runs into that space (a 4 px
  smaller foot made `panel__body` scroll, a `hiddenOverflow` finding). The
  fields cannot move up: they are 26 apart against 27 (`small` is 16 high),
  so the last one is already 3 px over Figma's. Gap: Workflow page details.
- **F1, Show on map icon.** The library's `MapIcon` glyph against Figma's
  `icon/map`; no action.

## Library connectors

After the move to the library's connectors, `pnpm fidelity` on every built frame of inbox, workspaces, artifacts
and toolkit (2026-11-18, library 1.0.0-beta.31) gives D13 the
same results: text and rules pass, and position fails on the same three
keys (`button · Show on map`, `446:514`, `stop · skill-eval-cases`). The
lines, elbows, the gate's way out and the dashed loop now show where the
render drew lone arrow icons.

## Settings gear (d-119)

In the app, the rail has a Settings gear before More, which this frame
does not draw: Settings has no Figma page, and decision d-119 puts its
entry in the rail (`web/src/blocks/AppRail.tsx`). The Notifications
switch that d-118 put at the rail's end moved to the Settings page, so
the rail no longer draws it. The screen draws the gear only when the
page entry passes `settingsEntry`; this frame's state and story pass
none, so the checks above are unchanged.
