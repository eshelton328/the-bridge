# T38 deviations

What still differs from Figma after the fidelity loop
(`pnpm fidelity toolkit T38`, 2026-11-17, against the library build
installed in this worktree), each with its reason. The library gaps are in
`web/src/pages/toolkit/LIBRARY_GAPS.md`. The state is
`web/src/pages/toolkit/states/hookHowItWorksTablet.ts`: D39's data
(`hookHowItWorks`), with no `elsewhere`, because T38 draws nothing under
the steps, and step 3's use (commits-and-prs) shown as a file, because
T38 gives it the file icon (495:2871) where D39 gives it the rule icon. On a
tablet the hook replaces the list in the shared `DetailFrame` (d-107). The
item keeps T19's header (the back row to Toolkit, the kind badge, the name
and the path row; its `how` does not set `named`), and the How it works tab
is T10's `ToolkitHowColumn`: the trigger across the item, then the five
steps in one column. D14, D37, D38, D39, T10, M12, T36, T37 and T19 give the
same results as before T38. The Checks below are from a rerun with library
1.0.0-beta.25 and the item tabs' `tone` and `density` props (2026-11-17).

## Checks

- Text: pass. Every Figma string is in the render and visible; no extra
  text and no covered text. No text runs under the tab bar: step 5 ends at
  y 727, far above it.
- Position: 21 of 24 layers pass (`back row`, `button · Show on map`,
  `meta row`, `kind badge`, `path row`, `path badge`, `steps`, `step 1` to
  `step 5`, `uses · commits-and-prs`, `uses · git commit` and `tab bar`).
  The 3 that fail (`button · Discuss`, `toolkit item`, `trigger`) are
  listed below.
  The shared navigation's items pass too: `tab · Home`, `tab · Inbox`,
  `tab · Workspaces`, `tab · Projects`, `tab · Artifacts`
  and `tab · More`.
- Rules: pass.

## Deviations

- **Item frame.** Figma's `toolkit item` (495:2546) holds the back row and
  the item, from y 41 to the tab bar. In `DetailFrame` the back row is the
  ScrollFrame's header and the item is the body under it, so the article
  starts under the back row and ends at its content (`toolkit item` y +32,
  h -386, x +2, w -4: the Container pads 24 at the sides against 22). This
  is the d-107 structure that keeps Back in view, as on T19, T36 and T37
  (gap: Tablet item spacing).
- **Discuss button.** The back row's buttons are the library's `md`
  buttons, 32 high against Figma's 34 and 36, and Discuss is 99.5 px wide
  against 97; with the 24 px side of the Container (Figma 22) it starts
  5 px further left (`button · Discuss` x -5.1, h -2). Gaps: Item action
  buttons, Tablet item spacing.
- **Trigger.** Figma's trigger is 31 high, its text 7 px from the top and
  foot. `Panel variant="notice" tone="done"` pads it 10/12, so it is 38
  high (`trigger` h +7); the steps start 1 px above Figma's, and each step
  card passes the position check (gap: How it works trigger).
- **Step cards.** The step numbers are `Badge variant="outline"`, 22 high
  against 19, and the arrow rows between the cards are 16 high against 14
  (gap: How it works steps). The chips' text is the badge's muted colour
  where Figma draws it white, and the code chip's text (git commit) is not
  cyan (gap: How it works use chip). Every card and both chips pass the
  position check.
- **Copy button.** The path badge's copy icon is a plain button with
  `CopyIcon` (gap: Path badge copy button); the path row passes the
  position check.
- **Item tabs.** `ItemTabs density="compact" tone="accent"` (library
  #126, beta.21) starts the tabs at the list's edge with 10 px sides and
  draws How it works' label cyan, as Figma's. The outline stays
  `border.selected` at half alpha where Figma's is solid cyan (no solid
  selected token, d-050), and since library #153 (beta.42) each tab is
  within 1.1 px of Figma's width: the tabs start at 24 against 22 (the
  Container's 24 px side), and Activity ends at 462.3 against 463. The
  item adds 4 above the panel, so the trigger stays in place.
- **Tests line.** D39 draws the hook's tests under the steps; T38 draws
  nothing there, so the state leaves `elsewhere` out and the render shows
  nothing under step 5, as in Figma.
