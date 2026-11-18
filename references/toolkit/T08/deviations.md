# T08 deviations

What still differs from Figma after round 3 of the fidelity loop
(`pnpm fidelity toolkit D13 D14 T07 T10 T19 M19 T08`, 2026-11-17, against
the installed library 1.0.0-beta.26), each with its reason. The library
gaps are in `web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/workflowFullPageTablet.ts`: D13's data
(`workflowFullPage`) with T8's shorter lines (the description, a gate that
names the ledger and the stop, one line of notes for each step), the path
without `toolkit/`, five fields for step 4, and no stop box, loop label,
hint, gates or rounds. D13, D14, T07, T10, T19 and M19 give the same
results as before T08 (each report's text, position and rule results are
unchanged). The frame has no `exceptions.json`.

## Checks

- Text: pass. Every Figma string is in the render and visible; no text is
  covered where Figma does not cover it, and no render text is extra.
- Position: 28 of 36 layers pass, among them the breadcrumb row, Show on
  map, the meta row, the title (`448:214`), the path row and badge, the
  tabs, the description (`448:215`), `steps`, all nine step cards, the fork
  and the join, `parallel · 4 and 5` and `step 4 details`. Eight fail:
  - `button · Discuss`: x -7.1.
  - `toolkit item`: y +36, h +94.
  - `kind badge`: w +6.2 (90 against Figma's 84).
  - `field · Input`, `field · Output`, `field · Model`,
    `field · Parallel`, `field · If it fails`: w -8 (674 against 682),
    x +4; y within 3 px.
- Rules: one finding, `hiddenOverflow` on the `DetailFrame`'s scroll body
  (`scroll-frame__body`, 1231 high in 1081).

## Deviations

- **Discuss.** As on T07, T10 and T19: `Button` is 32 high at `md` against
  Figma's 34 and 36, and Discuss is 99.5 wide against 97, so it starts 7 px
  further left (`button · Discuss` x -7.1; gap: Item action buttons).
- **Item box.** Figma's `toolkit item` holds the breadcrumb row and ends at
  the tab bar; the render's item is the `DetailFrame`'s scrolling body under
  the pinned back row, so it starts 36 lower and runs to the end of the
  page (`toolkit item` y +36, h +94; gap: Tablet item spacing). As on T07,
  T10 and T19. The item is 24 in from the sides against 22.
- **Kind badge.** `KindBadge` is 90 × 24 against Figma's 84 × 21
  (`kind badge` w +6.2; gap: Kind badge 21 px). The rows under it stay
  within 3 px of Figma's y.
- **Step 4 fields.** `Panel` pads 16 and its border, where Figma's fields
  are 15 in from the panel's sides, and the item is 708 wide against 712,
  so each field row is 674 wide against 682 and starts 4 px right
  (`field · Input`, `field · Output`, `field · Model`, `field · Parallel`,
  `field · If it fails` w -8; gap: Workflow page details). The rows are 22
  apart against 23 (`small` is 16 high on the 4 px grid against Figma's
  17), within 3 px of Figma's y. The labels' column is as wide as the
  longest label with the value 24 after it, where Figma has a 76 px column
  and 10 (no size token has 76).
- **Page longer than the screen.** Figma's page runs under the tab bar and
  past the frame's foot (`step 4 details` ends at 1215 in a 1158 frame);
  the render's page does the same in the `DetailFrame`'s scroll body, so
  the rule reports the scrolled part (`hiddenOverflow`). The tab bar lies
  over the page, as Figma draws it (library 1.0.0-beta.26); the library's
  bar is translucent, so the fields show faintly through it, where Figma's
  bar hides them.
- **Connectors.** The library has no connector line or 14 px icon (gap:
  Workflow page flow): each arrow is the 16 px `ArrowDownIcon` with no line;
  the fork from step 3 is one arrow over each of steps 4 and 5, and the
  join one arrow over step 6, with no elbow lines. The arrow rows keep
  Figma's 18 and 22 px, so every card is within 4 px of Figma's y.
- **Step cards.** The cards use the FlowDiagram card's tokens (gap:
  Workflow page flow): 84 high as in Figma (the gates and Read within 2 px
  of Figma's 63), the mark a 22 px `Badge` against 19 and the title 14 px
  (`label`) against 13. The selected card (step 4) has the selected fill as
  well as the cyan border.
- **Breadcrumb.** As on D13: `BackRow` (Toolkit, 16 px label and 18 px
  chevron against 14 px and 16 px) and the crumbs as text in `labelLg`
  (gap: Item breadcrumb), so the crumbs are a little larger than Figma's.
- **Item tabs.** As on D13 and T10: the selected tab's outline is
  `border.selected` at half alpha where Figma's is solid cyan (d-050).
