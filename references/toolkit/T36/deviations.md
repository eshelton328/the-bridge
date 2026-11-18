# T36 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T36`, 2026-11-17, against the library build
installed in this worktree), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/ruleHowItWorksTablet.ts`: D37's data
(`ruleHowItWorks`), with no `elsewhere`, because T36 draws nothing under the
steps. On a tablet the rule replaces the list in the shared `DetailFrame`
(d-107), as on T17. Its `how` does not set `named`, so the item keeps T17's
header (the back row to Toolkit, the kind badge, the name and the path row),
and the How it works tab is T10's `ToolkitHowColumn`: the trigger across the
item, then the four steps in one column. D14, D37, D38, D39, T10, M12 and
T17 give the same results as before T36. The Checks below are from a rerun
with library 1.0.0-beta.25 and the item tabs' `tone` and `density` props
(2026-11-17).

## Checks

- Text: pass. Every Figma string is in the render and visible; no extra
  text and no covered text.
- Position: 21 of 25 layers pass (`back row`, `button · Show on map`,
  `meta row`, `kind badge`, `path row`, `path badge`, `steps`, `step 1` to
  `step 4`, the three `uses · …` chips and `tab bar`). The 4 that fail
  (`button · Discuss`, `toolkit item`, `495:1827`, `trigger`) are listed
  below.
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects`, `tab · Artifacts`
  and `tab · More`.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` (495:1803) holds the back row and
  the item, from y 41 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and ends at its content (`toolkit item` y +32,
  h -436, x +2, w -4: the Container pads 24 at the sides against 22). This
  is the d-107 structure that keeps Back in view, as on T17 (gap: Tablet
  item spacing).
- **Discuss button.** The back row's buttons are the library's `md`
  buttons, 32 high against Figma's 34 and 36, and Discuss is 99.5 px wide
  against 97; with the 24 px side of the Container (Figma 22) it starts
  5 px further left (`button · Discuss` x -5.1, h -2). Gaps: Item action
  buttons, Tablet item spacing.
- **Title width.** The title skills is 70.4 px wide and 40 high against
  Figma's 66 and 38 (`495:1827` w +4.4): the `heading` glyphs and line
  height, as on T17 (`487:355`). It starts in place.
- **Trigger.** Figma's trigger is 31 high, its text 7 px from the top and
  foot. `Panel variant="notice" tone="done"` pads it 10/12, so it is 38
  high (`trigger` h +7); it starts at Figma's y, and the steps start 4
  under it, so every step card stays within 3 px of Figma's (gap: How it
  works trigger).
- **Step cards.** A card with a use is 86 high against 88 (the chips are
  22 high against 23), and the arrow rows are 16 high against 14. The
  chips' text is white where Figma colours it as the step's kind: the
  `link.sh` script cyan (gap: How it works use chip). The step numbers are
  `Badge variant="outline"`, 22 high against 19 (gap: How it works steps).
- **Copy button.** As on T17, the path badge's copy icon is a plain
  button with `CopyIcon` (gap: Path badge copy button); the path row
  passes the position check.
- **Item tabs.** `ItemTabs density="compact" tone="accent"` (library
  #126, beta.21) starts the tabs at the list's edge with 10 px sides and
  draws How it works' label cyan, as Figma's. The outline stays
  `border.selected` at half alpha where Figma's is solid cyan (no solid
  selected token, d-050), and since library #153 (beta.42) each tab is
  within 1.1 px of Figma's width: the tabs start at 24 against 22 (the
  Container's 24 px side), and Activity ends at 462.3 against 463. The
  item adds 4 above the panel, so the trigger stays in place.
- **In Codex line.** D37 draws what Codex does instead under the steps;
  T36 draws nothing there, so the state leaves `elsewhere` out and the
  render shows nothing under step 4, as in Figma.
